// Pure rewards-config helpers (Phase 4, stream A). Client-safe: no node
// imports, no database, no webhooks - the builder preview and public page
// import these directly. Transactional/query logic lives in rewards.mjs.

import { FOLLOW_POINTS, REFERRAL_POINTS, SIGNUP_POINTS } from "./points.mjs";

const clampInt = (value, { min = 0, max = 100000, fallback = 0 } = {}) => {
  const parsed = typeof value === "number" ? Math.trunc(value) : NaN;
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const CUSTOM_EVENT_KEY_RE = /^[a-z0-9-]{1,40}$/;

// Defensive normalization for snapshot `rewards` payloads of any age.
// Unknown shapes fall back to today's behavior: defaults accrue points,
// no offset, counts visible.
export function normalizeRewardsConfig(value) {
  const source = value && typeof value === "object" ? value : {};
  const seen = new Set();
  const customEvents = [];
  if (Array.isArray(source.customEvents)) {
    for (const entry of source.customEvents) {
      if (!entry || typeof entry !== "object" || customEvents.length >= 12) continue;
      const key = typeof entry.key === "string" ? entry.key.trim().toLowerCase() : "";
      if (!CUSTOM_EVENT_KEY_RE.test(key) || seen.has(key)) continue;
      seen.add(key);
      const label =
        typeof entry.label === "string" && entry.label.trim()
          ? entry.label.trim().slice(0, 80)
          : key;
      // Preserve the builder-local stable id when present; harmless to the
      // API, which matches events by key.
      const stableId = typeof entry.id === "string" && entry.id ? entry.id.slice(0, 40) : "";
      customEvents.push({
        ...(stableId ? { id: stableId } : {}),
        key,
        label,
        points: clampInt(entry.points, { fallback: 0 }),
      });
    }
  }
  return {
    pointsSignup: clampInt(source.pointsSignup, { fallback: SIGNUP_POINTS }),
    pointsReferral: clampInt(source.pointsReferral, { fallback: REFERRAL_POINTS }),
    pointsFollow: clampInt(source.pointsFollow, { fallback: FOLLOW_POINTS }),
    customEvents,
    positionOffset: clampInt(source.positionOffset, {
      min: 0,
      max: 1000000,
      fallback: 0,
    }),
    hideCounts: source.hideCounts === true,
    showPoints: source.showPoints !== false,
    showProgress: source.showProgress !== false,
  };
}

export function resolveRewardsConfig(publishedSnapshot) {
  if (!publishedSnapshot || typeof publishedSnapshot !== "object")
    return normalizeRewardsConfig(null);
  return normalizeRewardsConfig(publishedSnapshot.rewards);
}

// Reward tiers come from the visible `referralRewards` content blocks:
// founders already edit that ladder in the builder, so progress math reads
// the same source instead of a second config that could drift.
export function readRewardTiers(publishedSnapshot) {
  const sections = Array.isArray(publishedSnapshot?.sections) ? publishedSnapshot.sections : [];
  const tiers = [];
  for (const section of sections) {
    if (!section || section.type !== "referralRewards" || section.visible === false) continue;
    if (!Array.isArray(section.items)) continue;
    for (const item of section.items) {
      const referrals = Number(item?.referrals);
      const reward = typeof item?.reward === "string" ? item.reward.trim() : "";
      if (!Number.isSafeInteger(referrals) || referrals < 1 || !reward) continue;
      tiers.push({ referrals, reward: reward.slice(0, 120) });
    }
  }
  tiers.sort((a, b) => a.referrals - b.referrals);
  const deduped = [];
  for (const tier of tiers) {
    if (deduped.length > 0 && deduped[deduped.length - 1].referrals === tier.referrals) continue;
    deduped.push(tier);
    if (deduped.length >= 8) break;
  }
  return deduped;
}

// "X more to unlock" progress for one signup's verified referral count.
export function rewardProgress(tiers, verifiedReferrals) {
  const count = clampInt(verifiedReferrals, { min: 0, max: 100000000, fallback: 0 });
  const list = Array.isArray(tiers) ? tiers : [];
  const unlocked = list.filter((tier) => tier.referrals <= count);
  const next = list.find((tier) => tier.referrals > count) ?? null;
  return {
    unlocked,
    next: next ? { ...next, remaining: next.referrals - count } : null,
  };
}

// Displayed position with the founder's inflation offset applied. Raw ranks
// stay offset-free in storage and API `position` fields; public surfaces
// render this value so a young list can start at #N instead of #1.
export function displayPosition(rank, rewards) {
  if (!Number.isSafeInteger(rank) || rank < 1) return null;
  const offset = rewards
    ? clampInt(rewards.positionOffset, { min: 0, max: 1000000, fallback: 0 })
    : 0;
  return rank + offset;
}
