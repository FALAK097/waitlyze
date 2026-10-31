// Per-waitlist rewards engine (Phase 4, stream A). Server-only: database
// reads, the advancement query, and tier-unlock fan-out. Pure config math
// (normalization, tiers, progress, display positions) lives in the
// client-safe rewards-config.mjs so previews and pages can import it.
//
// Points accrue from activation with zero-config defaults (verified signup =
// 50, completed referral = 30, social follow = 5); founders override the
// amounts, custom events, position inflation, and stealth mode per waitlist in
// the snapshot `rewards` key. The rewards ladder reuses the founder-editable
// `referralRewards` content blocks as its single source of truth, so tiers
// never drift between the page and the progress math.
//
// Every award flows through the append-only PointLedger (see
// ../referrals/points.mjs) so retries collapse via skipDuplicates and the
// balance bump happens in the same transaction as the triggering event.

import { templateSnapshotSchema } from "../templates/catalog.mjs";
import { enqueueWebhookEventBatch } from "../webhooks/delivery.mjs";
import {
  displayPosition,
  normalizeRewardsConfig,
  readRewardTiers,
  resolveRewardsConfig,
  rewardProgress,
} from "./rewards-config.mjs";

export {
  displayPosition,
  normalizeRewardsConfig,
  readRewardTiers,
  resolveRewardsConfig,
  rewardProgress,
};

// Published snapshot is the source of truth for public behavior: draft edits
// must not change award amounts before they ship. Never throws - any failure
// (unpublished list, legacy snapshot-less page, unreadable record) resolves
// to zero-config defaults so points keep accruing.
export async function getPublishedRewards(db, waitListId) {
  const fallback = { rewards: normalizeRewardsConfig(null), tiers: [] };
  try {
    if (typeof waitListId !== "string" || !waitListId) return fallback;
    const waitList = await db.waitList.findUnique({
      where: { id: waitListId },
      select: { publishedRevision: true },
    });
    if (!waitList?.publishedRevision) return fallback;
    const publication = await db.waitListPublicationRevision.findUnique({
      where: {
        waitListId_revision: { waitListId, revision: waitList.publishedRevision },
      },
      select: { snapshot: true },
    });
    const parsed = templateSnapshotSchema.safeParse(publication?.snapshot);
    if (!parsed.success) return fallback;
    return { rewards: resolveRewardsConfig(parsed.data), tiers: readRewardTiers(parsed.data) };
  } catch {
    return fallback;
  }
}

// One query for a signup's verified-only rank, eligible referral count, and
// the referrals needed to take the spot above (0 at the top). Scoring matches
// getCampaignPosition exactly: verified-only, review-gated, same tiebreaks.
export async function getAdvancement(db, waitListId, signUpId) {
  if (typeof waitListId !== "string" || !waitListId || typeof signUpId !== "string" || !signUpId)
    return null;
  const rows = await db.$queryRaw`
    WITH referral_scores AS (
      SELECT referral."referredById" AS "referrerId", COUNT(*)::bigint AS score
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred
        ON referred."id" = referral."signUpId"
      INNER JOIN "sign_ups" AS referrer
        ON referrer."id" = referral."referredById"
       AND referrer."waitListId" = referred."waitListId"
      INNER JOIN "wait_lists" AS campaign
        ON campaign."id" = referred."waitListId"
       AND campaign."showReferrals" = true
      WHERE referred."waitListId" = ${waitListId}
        AND referred."verifiedAt" IS NOT NULL
        AND referrer."verifiedAt" IS NOT NULL
        AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
        AND referral."referredById" IS NOT NULL
        AND referral."referredById" <> referral."signUpId"
      GROUP BY referral."referredById"
    ), ranked AS (
      SELECT signup."id", COALESCE(score.score, 0)::bigint AS score,
        ROW_NUMBER() OVER (
          ORDER BY COALESCE(score.score, 0) DESC, signup."createdAt" ASC, signup."id" ASC
        ) AS position
      FROM "sign_ups" AS signup
      LEFT JOIN referral_scores AS score ON score."referrerId" = signup."id"
      WHERE signup."waitListId" = ${waitListId}
    )
    SELECT me.position AS position, me.score AS score, above.score AS "aboveScore"
    FROM ranked AS me
    LEFT JOIN ranked AS above ON above.position = me.position - 1
    WHERE me."id" = ${signUpId}
  `;
  const row = rows?.[0];
  if (!row) return null;
  const position = Number(row.position);
  const referrals = Number(row.score);
  if (!Number.isSafeInteger(position) || position < 1 || !Number.isSafeInteger(referrals))
    return null;
  const aboveScore = row.aboveScore == null ? null : Number(row.aboveScore);
  return {
    position,
    referrals,
    spotsToAdvance:
      aboveScore == null || !Number.isSafeInteger(aboveScore)
        ? 0
        : Math.max(aboveScore - referrals + 1, 1),
  };
}

// Tier-unlock fan-out, transactional with the referral credit that triggered
// it. Reuses the milestone.reached customer event (delivery code untouched):
// tier unlocks carry the reward label and a deterministic event id
// (reward-tier:{waitlist}:{referrer}:{threshold}) so concurrent completions
// collapse via skipDuplicates instead of double-firing, and so they never
// collide with the signup-count milestones (milestone:{waitlist}:{count}).
export async function checkRewardTierUnlocks(
  tx,
  { waitListId, referrerId, triggeringSignupId, verifiedReferrals, tiers, now = new Date() },
) {
  const list = Array.isArray(tiers) ? tiers : [];
  const count =
    Number.isSafeInteger(verifiedReferrals) && verifiedReferrals >= 0 ? verifiedReferrals : 0;
  const unlocked = list.filter(
    (tier) => tier && Number.isSafeInteger(tier.referrals) && tier.referrals <= count,
  );
  if (unlocked.length > 0) {
    await enqueueWebhookEventBatch(
      tx,
      unlocked.map((tier) => ({
        waitListId,
        eventType: "milestone.reached",
        signupId: referrerId,
        eventId: `reward-tier:${waitListId}:${referrerId}:${tier.referrals}`,
        extra: {
          count: tier.referrals,
          reward: tier.reward,
          // The invitee whose verification crossed the threshold; `signupId`
          // above stays the referrer who earns the tier.
          triggeringSignupId,
        },
        now,
      })),
    );
  }
  return unlocked.length;
}

// Canonical per-signup rewards payload for cockpit + API responses. Never
// throws: routes must not fail a signup response because progress math did.
export async function summarizeSignupRewards(db, waitListId, signup) {
  const empty = {
    points: 0,
    referrals: 0,
    position: null,
    displayPosition: null,
    spotsToAdvance: 0,
    nextReward: null,
    unlockedRewards: [],
    tiersTotal: 0,
    hideCounts: false,
    showPoints: true,
    showProgress: true,
  };
  try {
    if (!signup || typeof signup.id !== "string") return empty;
    const [{ rewards, tiers }, advance] = await Promise.all([
      getPublishedRewards(db, waitListId),
      getAdvancement(db, waitListId, signup.id),
    ]);
    const referrals = advance?.referrals ?? 0;
    const progress = rewardProgress(tiers, referrals);
    const position = advance?.position ?? null;
    return {
      points: Number.isSafeInteger(signup.points) && signup.points >= 0 ? signup.points : 0,
      referrals,
      position,
      displayPosition: displayPosition(position, rewards),
      spotsToAdvance: advance?.spotsToAdvance ?? 0,
      nextReward: progress.next,
      unlockedRewards: progress.unlocked,
      tiersTotal: tiers.length,
      hideCounts: rewards.hideCounts,
      showPoints: rewards.showPoints,
      showProgress: rewards.showProgress,
    };
  } catch {
    return empty;
  }
}
