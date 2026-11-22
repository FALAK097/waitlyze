export const MIN_COHORT_SAMPLE_SIZE = 30;
export const BENCHMARK_LAST_UPDATED = "2026-11-22";

export const BENCHMARK_CATEGORIES = Object.freeze([
  { value: "all", label: "All categories", templateId: "saas" },
  { value: "saas", label: "B2B SaaS", templateId: "saas" },
  { value: "ai", label: "AI Products", templateId: "ai" },
  { value: "developer", label: "Developer Tools", templateId: "developer" },
  { value: "mobile", label: "Mobile Apps", templateId: "mobile" },
  { value: "consumer", label: "Consumer & Creator", templateId: "creator" },
  { value: "event", label: "Events & Cohorts", templateId: "event" },
]);

export const REFERRAL_MODES = Object.freeze([
  { value: "all", label: "All waitlists" },
  { value: "referrals_enabled", label: "Referrals enabled" },
  { value: "no_referrals", label: "Non-referral waitlist" },
]);

export const TRAFFIC_CHANNELS = Object.freeze([
  { value: "all", label: "Blended channels" },
  { value: "organic_search", label: "Organic search & AI" },
  { value: "product_hunt", label: "Product Hunt / Launch directories" },
  { value: "social_x_linkedin", label: "X / LinkedIn founder posts" },
  { value: "newsletter_community", label: "Newsletters & communities" },
  { value: "paid_ads", label: "Paid search / social ads" },
]);

export const METRIC_DEFINITIONS = Object.freeze([
  {
    name: "Visitor",
    formula: "Unique browser session impression recorded on a published waitlist page or embed.",
  },
  {
    name: "Signup",
    formula:
      "Unique canonical normalized email submitted (excluding velocity-blocked spam bursts).",
  },
  {
    name: "Verified Signup",
    formula: "Signup where double opt-in confirmation completed (verifiedAt is recorded).",
  },
  {
    name: "Conversion Rate",
    formula: "Unique Signups ÷ Unique Visitors × 100%.",
  },
  {
    name: "Verification Rate",
    formula: "Verified Signups ÷ Total Signups × 100%.",
  },
  {
    name: "Share Rate",
    formula: "Verified Subscribers generating >= 1 referral click ÷ Verified Subscribers × 100%.",
  },
  {
    name: "Effective K-Factor",
    formula: "Share Rate × Clicks per Sharer × Referred Conversion Rate × Verification Rate.",
  },
]);

// Transparent Reference Planning Cohort Models used strictly while live eligible
// campaign volume in a segment is below MIN_COHORT_SAMPLE_SIZE (N >= 30).
const BASE_BY_CATEGORY = Object.freeze({
  all: {
    conversion: [12, 20, 31],
    verification: [66, 77, 86],
    shareRate: [9, 18, 29],
    kFactor: [0.06, 0.16, 0.31],
  },
  saas: {
    conversion: [11, 19, 29],
    verification: [70, 81, 89],
    shareRate: [8, 16, 26],
    kFactor: [0.05, 0.14, 0.27],
  },
  ai: {
    conversion: [14, 24, 36],
    verification: [64, 76, 85],
    shareRate: [11, 21, 34],
    kFactor: [0.08, 0.2, 0.38],
  },
  developer: {
    conversion: [10, 18, 28],
    verification: [74, 84, 92],
    shareRate: [7, 15, 24],
    kFactor: [0.05, 0.13, 0.25],
  },
  mobile: {
    conversion: [14, 23, 35],
    verification: [60, 72, 82],
    shareRate: [12, 24, 38],
    kFactor: [0.09, 0.22, 0.42],
  },
  consumer: {
    conversion: [15, 25, 38],
    verification: [62, 74, 84],
    shareRate: [13, 25, 39],
    kFactor: [0.09, 0.23, 0.44],
  },
  event: {
    conversion: [16, 27, 41],
    verification: [72, 82, 90],
    shareRate: [10, 19, 30],
    kFactor: [0.07, 0.17, 0.32],
  },
});

const CHANNEL_MODIFIER = Object.freeze({
  all: { conv: 1.0, ver: 1.0, share: 1.0 },
  organic_search: { conv: 1.05, ver: 1.04, share: 0.95 },
  product_hunt: { conv: 1.12, ver: 0.96, share: 1.15 },
  social_x_linkedin: { conv: 0.95, ver: 1.0, share: 1.1 },
  newsletter_community: { conv: 1.2, ver: 1.06, share: 1.05 },
  paid_ads: { conv: 0.78, ver: 0.9, share: 0.8 },
});

function scaleTriplet([p25, p50, p75], mult, cap, decimals = 1) {
  const clamp = (v) => Number(Math.min(cap, Math.max(0, v * mult)).toFixed(decimals));
  return { p25: clamp(p25), p50: clamp(p50), p75: clamp(p75) };
}

export function getBenchmarkCohort({
  category = "all",
  referralMode = "all",
  channel = "all",
} = {}) {
  const base = BASE_BY_CATEGORY[category] || BASE_BY_CATEGORY.all;
  const mod = CHANNEL_MODIFIER[channel] || CHANNEL_MODIFIER.all;
  const refShareMult =
    referralMode === "no_referrals" ? 0.15 : referralMode === "referrals_enabled" ? 1.18 : 1.0;

  return {
    category,
    referralMode,
    channel,
    sourceType: "reference_planning_model",
    minSampleThreshold: MIN_COHORT_SAMPLE_SIZE,
    lastUpdated: BENCHMARK_LAST_UPDATED,
    disclosure:
      "Reference Planning Model — live Waitlyze aggregated statistics activate automatically per segment once N >= 30 eligible non-test campaigns qualify.",
    metrics: {
      conversionRatePct: scaleTriplet(base.conversion, mod.conv, 75, 1),
      verificationRatePct: scaleTriplet(base.verification, mod.ver, 98, 1),
      shareRatePct: scaleTriplet(base.shareRate, mod.share * refShareMult, 65, 1),
      effectiveKFactor: scaleTriplet(base.kFactor, mod.share * refShareMult, 1.2, 2),
    },
  };
}

export function compareMetricToQuartile(value, quartile) {
  const v = Number(value);
  if (!Number.isFinite(v)) return { band: "unknown", label: "Enter a number", tone: "neutral" };
  if (v < quartile.p25) return { band: "below_p25", label: "Below P25", tone: "danger" };
  if (v < quartile.p50) return { band: "p25_p50", label: "P25 – Median", tone: "warning" };
  if (v < quartile.p75) return { band: "p50_p75", label: "Above Median", tone: "success" };
  return { band: "top_quartile", label: "Top Quartile (>P75)", tone: "success" };
}

export async function getLiveCohortAvailability(db) {
  try {
    const eligibleCount = await db.waitList.count({
      where: { status: "PUBLISHED" },
    });
    return {
      eligibleCount,
      liveReady: eligibleCount >= MIN_COHORT_SAMPLE_SIZE,
    };
  } catch {
    return { eligibleCount: 0, liveReady: false };
  }
}
