import { createHash, randomBytes } from "node:crypto";

import { after } from "next/server";

import { getCanonicalAttribution } from "../../utils/server/attribution.mjs";
import { createUnsubscribeToken, hashUnsubscribeToken } from "../email/unsubscribe.mjs";
import { maybeNotifySignupMilestone } from "../emails/founder-notifications.mjs";
import { FraudLimitError, evaluateSignupFraud, silentSignupShape } from "../fraud/gates.mjs";
import { normalizeSignupEmail } from "../normalize-email.mjs";
import {
  REFERRAL_CREDIT_STATUSES,
  awardPoints,
  isFarmSuspect,
  referralEventKey,
  signupEventKey,
} from "../referrals/points.mjs";
import {
  checkRewardTierUnlocks,
  displayPosition,
  getPublishedRewards,
  rewardProgress,
  summarizeSignupRewards,
} from "../referrals/rewards.mjs";
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
import {
  getCampaignPosition,
  getEligibleReferralCounts,
  getSpotsForNewSignup,
} from "./referral-position.mjs";
import { findSignupByEmail } from "./signup-lookup.mjs";
import { TurnstileVerificationError } from "./turnstile.mjs";

const normalizeEmail = normalizeSignupEmail;
const tokenDigest = (token) => createHash("sha256").update(token).digest("hex");

// Zero-value rewards block for silent-mode fakes: same keys as
// summarizeSignupRewards (no structurally-missing-keys oracle), zero
// progress, but the waitlist's real visibility flags and tier ladder so
// `next_reward`/`counts_hidden` behave like a real fresh signup. Never
// throws - a failure resolves to static zeros.
async function silentRewardSummary(db, waitListId, rank) {
  const zeros = {
    points: 0,
    referrals: 0,
    position: typeof rank === "number" ? rank : null,
    displayPosition: typeof rank === "number" ? rank : null,
    spotsToAdvance: 0,
    nextReward: null,
    unlockedRewards: [],
    tiersTotal: 0,
    hideCounts: false,
    showPoints: true,
    showProgress: true,
  };
  try {
    const [{ rewards, tiers }, spots] = await Promise.all([
      getPublishedRewards(db, waitListId),
      getSpotsForNewSignup(db, waitListId),
    ]);
    const progress = rewardProgress(tiers, 0);
    return {
      ...zeros,
      displayPosition: displayPosition(rank, rewards) ?? zeros.displayPosition,
      spotsToAdvance: spots,
      nextReward: progress.next,
      unlockedRewards: progress.unlocked,
      tiersTotal: tiers.length,
      hideCounts: rewards.hideCounts,
      showPoints: rewards.showPoints,
      showProgress: rewards.showProgress,
    };
  } catch {
    return zeros;
  }
}

async function recordVerifiedSignup(tx, signup, now) {
  await enqueueWebhookEvent(tx, {
    waitListId: signup.waitListId,
    eventType: "signup.verified",
    signupId: signup.id,
    now,
  });
  // Award amounts and tiers resolve from the published snapshot so draft edits
  // never change payouts before they ship; unpublished lists accrue defaults.
  const { rewards, tiers } = await getPublishedRewards(tx, signup.waitListId);
  if (!(await isFarmSuspect(tx, signup.ipAddress, now))) {
    await awardPoints(tx, {
      waitListId: signup.waitListId,
      signUpId: signup.id,
      kind: "SIGNUP_VERIFIED",
      points: rewards.pointsSignup,
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
        points: rewards.pointsReferral,
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
      // Tier unlocks are transactional with the credit that earned them.
      const counts = await getEligibleReferralCounts(tx, signup.waitListId, [
        referral.referredById,
      ]);
      await checkRewardTierUnlocks(tx, {
        waitListId: signup.waitListId,
        referrerId: referral.referredById,
        triggeringSignupId: signup.id,
        verifiedReferrals: counts.get(referral.referredById) ?? 0,
        tiers,
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

// Re-exported so signup routes map the fraud verdict to HTTP without
// importing the gate internals.
export { FraudLimitError };

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
        SELECT "id", "showReferrals", "publishedRevision", "fraudMode" FROM "wait_lists"
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

      // Fraud basics (additive, fail-open): IP velocity over the hard cap
      // rejects with 429; device-fingerprint velocity goes silent - a fake
      // success with nothing persisted (no row, no points, no webhooks, no
      // email). Counting failures allow the signup through.
      const fraud = await evaluateSignupFraud(tx, {
        fraudMode: published[0].fraudMode,
        ipAddress: input.ipAddress,
        deviceFingerprint:
          typeof input.deviceFingerprint === "string" && input.deviceFingerprint
            ? input.deviceFingerprint
            : null,
        now,
      });
      if (fraud.action === "limit") throw new FraudLimitError();
      if (fraud.action === "silent") {
        const [{ count }] = await tx.$queryRaw`
          SELECT COUNT(*)::bigint AS count FROM "sign_ups"
          WHERE "waitListId" = ${input.waitListId}
        `;
        const rank = Number(count) + 1;
        return silentSignupShape({
          waitListId: input.waitListId,
          email: input.email,
          emailNormalized,
          uniqueUserId: input.uniqueUserId,
          rank: Number.isSafeInteger(rank) && rank > 0 ? rank : null,
        });
      }

      const createdSignup = await tx.signUp.create({
        data: {
          uniqueUserId: input.uniqueUserId,
          email: input.email.trim(),
          emailNormalized,
          waitListId: input.waitListId,
          deviceFingerprint:
            typeof input.deviceFingerprint === "string" && input.deviceFingerprint
              ? input.deviceFingerprint.slice(0, 128)
              : null,
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
          ...getCanonicalAttribution(input),
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
        // Minimal: callers only need the referral count, so fetch ids alone
        // and skip the unused referrer relation.
        include: { referrals: { select: { id: true } } },
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
      referrals: { select: { id: true } },
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

  // Rank and rewards progress are independent reads: resolve them together
  // so the signup response pays one round trip, not two. Silent-mode fakes
  // skip the position query and get a zero-value block with the waitlist's
  // real visibility flags (same keys as a real response -
  // no structurally-missing-keys oracle).
  let rank;
  let rewardSummary = null;
  if (signUp.silent) {
    rank = signUp.rank;
    rewardSummary = await silentRewardSummary(db, input.waitListId, signUp.rank);
  } else {
    [rank, rewardSummary] = await Promise.all([
      getCampaignPosition(db, input.waitListId, signUp.id),
      // Rewards progress rides along with the rank so the cockpit and API can
      // render points + "X more to unlock" without extra round trips. Best
      // effort: a null summary never fails the signup response.
      summarizeSignupRewards(db, input.waitListId, signUp).catch(() => null),
    ]);
  }
  // Idempotent retries and duplicate lookups return early above, so only a row
  // we actually created can move the milestone counters. Silent-mode fakes
  // never touch counters, webhooks, or email.
  if (signUp?.signupOutcome === "created" && !signUp.silent) {
    after(() => maybeNotifySignupMilestone(db, input.waitListId, { signupId: signUp.id }));
  }
  // Server-vetted post-signup redirect rides on signUp itself (null = stay on
  // the cockpit); rank and rewards progress spread onto the result.
  return { ...signUp, rank, rewardSummary };
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
