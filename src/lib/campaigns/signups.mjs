import { createHash, randomBytes } from "node:crypto";

import { after } from "next/server";

import { createUnsubscribeToken, hashUnsubscribeToken } from "../email/unsubscribe.mjs";
import { maybeNotifySignupMilestone } from "../emails/founder-notifications.mjs";
import { normalizeSignupEmail } from "../normalize-email.mjs";
import {
  REFERRAL_CREDIT_STATUSES,
  REFERRAL_POINTS,
  SIGNUP_POINTS,
  awardPoints,
  isFarmSuspect,
  referralEventKey,
  signupEventKey,
} from "../referrals/points.mjs";
import { templateSnapshotSchema } from "../templates/catalog.mjs";
import { enqueueWebhookEvent } from "../webhooks/delivery.mjs";
import {
  checkCountryRules,
  checkEmailDomainRules,
  getPublishedFormConfig,
  normalizePhoneNumber,
  requiresDoubleOptIn,
  resolveSuccessRedirect,
  sanitizeCustomFieldAnswers,
  validatePhoneNumber,
} from "./form-rules.mjs";
import { MARKETING_CONSENT_COPY } from "./marketing-consent.mjs";
import { getCampaignPosition } from "./referral-position.mjs";
import { findSignupByEmail } from "./signup-lookup.mjs";
import { TurnstileVerificationError } from "./turnstile.mjs";

const normalizeEmail = normalizeSignupEmail;
const tokenDigest = (token) => createHash("sha256").update(token).digest("hex");

async function recordVerifiedSignup(tx, signup, now) {
  await enqueueWebhookEvent(tx, {
    waitListId: signup.waitListId,
    eventType: "signup.verified",
    signupId: signup.id,
    now,
  });
  if (!(await isFarmSuspect(tx, signup.ipAddress, now))) {
    await awardPoints(tx, {
      waitListId: signup.waitListId,
      signUpId: signup.id,
      kind: "SIGNUP_VERIFIED",
      points: SIGNUP_POINTS,
      eventKey: signupEventKey(signup.id),
    });
    await tx.$queryRaw`SELECT "id" FROM "referrals" WHERE "signUpId" = ${signup.id} FOR UPDATE`;
    const referral = await tx.referral.findUnique({
      where: { signUpId: signup.id },
      select: { id: true, referredById: true, reviewStatus: true },
    });
    if (referral?.referredById && REFERRAL_CREDIT_STATUSES.includes(referral.reviewStatus)) {
      await awardPoints(tx, {
        waitListId: signup.waitListId,
        signUpId: referral.referredById,
        kind: "REFERRAL_CREDIT",
        points: REFERRAL_POINTS,
        eventKey: referralEventKey(referral.id),
      });
      // Custom reward fulfillment hook: the inviter earned verified credit
      // because this signup verified. Receivers deduplicate by event id.
      await enqueueWebhookEvent(tx, {
        waitListId: signup.waitListId,
        eventType: "referral.completed",
        signupId: referral.referredById,
        extra: { referredSignupId: signup.id },
        now,
      });
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
}

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

// Normalized phone for storage, or null when collection is off / empty.
function phoneForStorage(formConfig, phone) {
  if (!formConfig?.collectPhone && !formConfig?.requirePhone) return null;
  const value = normalizePhoneNumber(phone);
  return value || null;
}

// Sanitized custom-field answers for storage (already validated above).
function customFieldsForStorage(formConfig, customFields) {
  const { answers } = sanitizeCustomFieldAnswers(formConfig, customFields);
  return answers;
}

export async function createCampaignSignup(
  db,
  input,
  referralId,
  { now = new Date(), verificationTtlMs = 24 * 60 * 60 * 1000 } = {},
) {
  if (
    typeof input?.waitListId !== "string" ||
    !input.waitListId ||
    typeof input.uniqueUserId !== "string" ||
    !input.uniqueUserId.trim() ||
    input.uniqueUserId.length > 256
  ) {
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
        SELECT "id", "showReferrals", "publishedRevision" FROM "wait_lists"
        WHERE "id" = ${input.waitListId} AND "status"::text = 'PUBLISHED'
        FOR SHARE
      `;
      if (published.length === 0) throw new InvalidCampaignError();
      if (!published[0].publishedRevision) {
        throw new TypeError("Published form configuration is invalid.");
      }
      const publication = await tx.waitListPublicationRevision.findUnique({
        where: {
          waitListId_revision: {
            waitListId: input.waitListId,
            revision: published[0].publishedRevision,
          },
        },
        select: { snapshot: true },
      });
      const publishedSnapshot = templateSnapshotSchema.safeParse(publication?.snapshot);
      if (!publishedSnapshot.success) {
        throw new TypeError("Published form configuration is invalid.");
      }
      // Double opt-in (see requiresDoubleOptIn): confirmation is required only
      // when the validated snapshot opts in.
      const formConfig = publishedSnapshot.data.form;
      // Per-form join rules. TypeError → 400 on every public caller, so the
      // API-key path enforces the same gates as the browser form.
      if (formConfig) {
        const domainError = checkEmailDomainRules(formConfig, input.email);
        if (domainError) throw new TypeError(domainError);
        const countryError = checkCountryRules(formConfig, input.country);
        if (countryError) throw new TypeError(countryError);
        const phoneError = validatePhoneNumber(input.phone, formConfig);
        if (phoneError) throw new TypeError(phoneError);
        const fields = sanitizeCustomFieldAnswers(formConfig, input.customFields);
        if (fields.error) throw new TypeError(fields.error);
      }
      const requiresTurnstile = formConfig.requireTurnstile;
      if (requiresTurnstile && input.signupProtection !== "turnstile")
        throw new TurnstileVerificationError();
      const requiresVerification = requiresDoubleOptIn(formConfig);

      const existing = await findSignupByEmail(tx, input.waitListId, input.email, {
        referrals: true,
        referredBy: true,
      });
      if (existing) {
        if (existing.uniqueUserId === input.uniqueUserId) {
          // Browser IDs and referral links are public identifiers, not consent credentials.
          // Idempotent signup retries must preserve prior opt-out/preferences.
          return {
            ...existing,
            signupOutcome: "returning",
            redirectUrl: resolveSuccessRedirect(formConfig),
          };
        }
        throw new DuplicateSignupError();
      }

      const createdSignup = await tx.signUp.create({
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
          phone: phoneForStorage(formConfig, input.phone),
          customFields: customFieldsForStorage(formConfig, input.customFields),
          verifiedAt: requiresVerification ? null : now,
          ...(input.marketingConsent === true ? { marketingConsentAt: now } : {}),
        },
      });
      await enqueueWebhookEvent(tx, {
        waitListId: input.waitListId,
        eventType: "signup.created",
        signupId: createdSignup.id,
        now,
      });

      if (input.marketingConsent === true) {
        const token = createUnsubscribeToken(createdSignup.id, input.waitListId);
        await tx.signUp.update({
          where: { id: createdSignup.id },
          data: { unsubscribeTokenHash: hashUnsubscribeToken(token) },
        });
        await tx.marketingConsentEvent.create({
          data: {
            waitListId: input.waitListId,
            signUpId: createdSignup.id,
            action: "OPTED_IN",
            source: "PUBLIC_SIGNUP",
            consentText: MARKETING_CONSENT_COPY,
            createdAt: now,
          },
        });
      }

      if (published[0].showReferrals && referralId && referralId !== input.uniqueUserId) {
        const referredBy =
          (await tx.signUp.findFirst({
            where: { referralCode: referralId, waitListId: input.waitListId },
            select: { id: true, uniqueUserId: true },
          })) ??
          (await tx.signUp.findFirst({
            where: { uniqueUserId: referralId, waitListId: input.waitListId },
            select: { id: true, uniqueUserId: true },
          }));
        if (referredBy) {
          const sameBrowser = referredBy.uniqueUserId === input.uniqueUserId;
          await tx.referral.create({
            data: {
              signUpId: createdSignup.id,
              referredById: referredBy.id,
              ...(sameBrowser
                ? { reviewStatus: "NEEDS_REVIEW", reviewReason: "same_browser" }
                : {}),
            },
          });
        }
      }

      let verificationEventKey;
      if (requiresVerification) {
        const token = randomBytes(32).toString("base64url");
        const verification = await tx.signUpVerification.create({
          data: {
            signUpId: createdSignup.id,
            tokenHash: tokenDigest(token),
            expiresAt: new Date(now.getTime() + verificationTtlMs),
          },
        });
        verificationEventKey = `signup.verify:${verification.id}`;
        await tx.outboxEvent.create({
          data: {
            eventKey: verificationEventKey,
            type: "SIGNUP_VERIFICATION_REQUESTED",
            waitListId: input.waitListId,
            payload: {
              signUpId: createdSignup.id,
              waitListId: input.waitListId,
              email: createdSignup.email,
              token,
            },
          },
        });
      } else {
        await recordVerifiedSignup(tx, createdSignup, now);
      }

      const created = await tx.signUp.findUnique({
        where: { id: createdSignup.id },
        include: { referrals: true, referredBy: true },
      });
      return {
        ...created,
        verificationEventKey,
        signupOutcome: "created",
        redirectUrl: resolveSuccessRedirect(formConfig),
      };
    });
  } catch (error) {
    if (error?.code !== "P2002") throw error;
    const committed = await findSignupByEmail(db, input.waitListId, input.email, {
      referrals: true,
      referredBy: true,
    });
    if (committed?.uniqueUserId === input.uniqueUserId)
      signUp = {
        ...committed,
        signupOutcome: "returning",
        redirectUrl: resolveSuccessRedirect(await getPublishedFormConfig(db, input.waitListId)),
      };
    else if (committed) throw new DuplicateSignupError();
    else throw error;
  }

  const rank = await getCampaignPosition(db, input.waitListId, signUp.id);
  // Idempotent retries and duplicate lookups return early above, so only a row
  // we actually created can move the milestone counters.
  if (signUp?.signupOutcome === "created") {
    after(() => maybeNotifySignupMilestone(db, input.waitListId, { signupId: signUp.id }));
  }
  // Server-vetted post-signup redirect (null = stay on the cockpit). The
  // browser client navigates only to this value, never to founder config or
  // user input directly, so the allowlist cannot be bypassed client-side.
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
    await tx.signUp.updateMany({
      where: { id: verification.signUpId, verifiedAt: null },
      data: { verifiedAt: now },
    });
    const signup = await tx.signUp.findUnique({
      where: { id: verification.signUpId },
      select: { id: true, waitListId: true, ipAddress: true },
    });
    await recordVerifiedSignup(tx, signup, now);
    return true;
  });
}
