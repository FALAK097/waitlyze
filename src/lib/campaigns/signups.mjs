import { createHash, randomBytes } from "node:crypto";
import { getCampaignPosition } from "./referral-position.mjs";
import { normalizeSignupEmail } from "../normalize-email.mjs";
import { findSignupByEmail } from "./signup-lookup.mjs";
import { createUnsubscribeToken, hashUnsubscribeToken } from "../email/unsubscribe.mjs";
import { MARKETING_CONSENT_COPY } from "./marketing-consent.mjs";
import { enqueueWebhookEvent } from "../webhooks/delivery.mjs";
import { REFERRAL_CREDIT_STATUSES, REFERRAL_POINTS, SIGNUP_POINTS, awardPoints, isFarmSuspect, referralEventKey, signupEventKey } from "../referrals/points.mjs";

const normalizeEmail = normalizeSignupEmail;
const tokenDigest = (token) => createHash("sha256").update(token).digest("hex");

export class DuplicateSignupError extends Error {
  constructor() {
    super("You have already signed up!");
    this.name = "DuplicateSignupError";
  }
}

export class InvalidCampaignError extends Error {
  constructor() {
    super("Invalid WaitList ID");
    this.name = "InvalidCampaignError";
  }
}

export async function createCampaignSignup(db, input, referralId, { now = new Date(), verificationTtlMs = 24 * 60 * 60 * 1000 } = {}) {
  if (typeof input?.waitListId !== "string" || !input.waitListId ||
      typeof input.uniqueUserId !== "string" || !input.uniqueUserId.trim() || input.uniqueUserId.length > 256) {
    throw new TypeError("WaitList ID and unique user ID are required.");
  }
  if (typeof input.email !== "string" || input.email.length > 320) {
    throw new TypeError("A valid email address is required.");
  }
  if (input.marketingConsent !== undefined && typeof input.marketingConsent !== "boolean") {
    throw new TypeError("Marketing consent must be a boolean.");
  }
  const emailNormalized = normalizeEmail(input.email);
  if (!emailNormalized || !/^\S+@\S+\.\S+$/.test(emailNormalized)) {
    throw new TypeError("A valid email address is required.");
  }

  let signUp;
  try {
    signUp = await db.$transaction(async (tx) => {
      // Hold a share lock until the signup commits so a concurrent pause cannot
      // slip between the publication check and the subscriber insert.
      const published = await tx.$queryRaw`
        SELECT "id", "showReferrals" FROM "wait_lists"
        WHERE "id" = ${input.waitListId} AND "status"::text = 'PUBLISHED'
        FOR SHARE
      `;
      if (published.length === 0) throw new InvalidCampaignError();

      const existing = await findSignupByEmail(tx, input.waitListId, input.email, { referrals: true, referredBy: true });
      if (existing) {
        if (existing.uniqueUserId === input.uniqueUserId) {
          // Browser IDs and referral links are public identifiers, not consent credentials.
          // Idempotent signup retries must preserve prior opt-out/preferences.
          return existing;
        }
        throw new DuplicateSignupError();
      }

      const signUp = await tx.signUp.create({
        data: {
          uniqueUserId: input.uniqueUserId,
          email: input.email.trim(),
          emailNormalized,
          waitListId: input.waitListId,
          impressionId: input.impressionId || null,
          device: input.device || null,
          deviceType: input.deviceType || null,
          city: input.city || null,
          country: input.country || null,
          timezone: input.timezone || null,
          ipAddress: input.ipAddress || null,
          latitude: input.latitude || null,
          longitude: input.longitude || null,
          referrer: input.referrer || null,
          landingPage: input.landingPage || null,
          utmSource: input.utmSource || null,
          utmMedium: input.utmMedium || null,
          utmCampaign: input.utmCampaign || null,
          utmTerm: input.utmTerm || null,
          utmContent: input.utmContent || null,
          verifiedAt: null,
          ...(input.marketingConsent === true ? { marketingConsentAt: now } : {}),
        },
      });
      await enqueueWebhookEvent(tx, { waitListId: input.waitListId, eventType: "signup.created", signupId: signUp.id, now });

      if (input.marketingConsent === true) {
        const token = createUnsubscribeToken(signUp.id, input.waitListId);
        await tx.signUp.update({ where: { id: signUp.id }, data: { unsubscribeTokenHash: hashUnsubscribeToken(token) } });
        await tx.marketingConsentEvent.create({ data: { waitListId: input.waitListId, signUpId: signUp.id, action: "OPTED_IN", source: "PUBLIC_SIGNUP", consentText: MARKETING_CONSENT_COPY, createdAt: now } });
      }

      if (published[0].showReferrals && referralId && referralId !== input.uniqueUserId) {
        const referredBy = await tx.signUp.findFirst({
          where: { referralCode: referralId, waitListId: input.waitListId },
          select: { id: true, uniqueUserId: true },
        }) ?? await tx.signUp.findFirst({
          where: { uniqueUserId: referralId, waitListId: input.waitListId },
          select: { id: true, uniqueUserId: true },
        });
        if (referredBy) {
          const sameBrowser = referredBy.uniqueUserId === input.uniqueUserId;
          await tx.referral.create({ data: {
            signUpId: signUp.id,
            referredById: referredBy.id,
            ...(sameBrowser ? { reviewStatus: "NEEDS_REVIEW", reviewReason: "same_browser" } : {}),
          } });
        }
      }

      const token = randomBytes(32).toString("base64url");
      const verification = await tx.signUpVerification.create({
        data: { signUpId: signUp.id, tokenHash: tokenDigest(token), expiresAt: new Date(now.getTime() + verificationTtlMs) },
      });
      const verificationEventKey = `signup.verify:${verification.id}`;
      await tx.outboxEvent.create({
        data: {
          eventKey: verificationEventKey,
          type: "SIGNUP_VERIFICATION_REQUESTED",
          waitListId: input.waitListId,
          payload: { signUpId: signUp.id, waitListId: input.waitListId, email: signUp.email, token },
        },
      });

      const created = await tx.signUp.findUnique({
        where: { id: signUp.id },
        include: { referrals: true, referredBy: true },
      });
      return { ...created, verificationEventKey };
    });
  } catch (error) {
    if (error?.code !== "P2002") throw error;
    const committed = await findSignupByEmail(db, input.waitListId, input.email, { referrals: true, referredBy: true });
    if (committed?.uniqueUserId === input.uniqueUserId) signUp = committed;
    else if (committed) throw new DuplicateSignupError();
    else throw error;
  }

  const rank = await getCampaignPosition(db, input.waitListId, signUp.id);
  return { ...signUp, rank };
}

export async function verifyCampaignSignup(db, token, { now = new Date() } = {}) {
  if (typeof token !== "string" || token.length < 32 || token.length > 128) return false;
  return db.$transaction(async (tx) => {
    const verification = await tx.signUpVerification.findUnique({
      where: { tokenHash: tokenDigest(token) },
      select: { id: true, signUpId: true, expiresAt: true, usedAt: true },
    });
    if (!verification || verification.usedAt || verification.expiresAt <= now) return false;

    const claimed = await tx.signUpVerification.updateMany({
      where: { id: verification.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
      });
      if (claimed.count !== 1) return false;
      await tx.signUp.updateMany({ where: { id: verification.signUpId, verifiedAt: null }, data: { verifiedAt: now } });
      const signup = await tx.signUp.findUnique({ where: { id: verification.signUpId }, select: { id: true, waitListId: true, ipAddress: true } });
      await enqueueWebhookEvent(tx, { waitListId: signup.waitListId, eventType: "signup.verified", signupId: signup.id, now });
      if (!(await isFarmSuspect(tx, signup.ipAddress, now))) {
        await awardPoints(tx, { waitListId: signup.waitListId, signUpId: signup.id, kind: "SIGNUP_VERIFIED", points: SIGNUP_POINTS, eventKey: signupEventKey(signup.id) });
        // Lock the referral row (when one exists) so a concurrent approval
        // serializes around this decision: whichever transaction commits
        // first, exactly one of the two paths awards the credit.
        await tx.$queryRaw`SELECT "id" FROM "referrals" WHERE "signUpId" = ${signup.id} FOR UPDATE`;
        const referral = await tx.referral.findUnique({ where: { signUpId: signup.id }, select: { id: true, referredById: true, reviewStatus: true } });
        if (referral?.referredById && REFERRAL_CREDIT_STATUSES.includes(referral.reviewStatus)) {
          await awardPoints(tx, { waitListId: signup.waitListId, signUpId: referral.referredById, kind: "REFERRAL_CREDIT", points: REFERRAL_POINTS, eventKey: referralEventKey(referral.id) });
        }
      }
      await tx.outboxEvent.create({
        data: {
          eventKey: `automation.trigger:signup-verified:${signup.id}`,
          type: "MARKETING_AUTOMATION_TRIGGER_REQUESTED",
          waitListId: signup.waitListId,
          payload: { signUpId: signup.id },
        },
      });
      return true;
  });
}
