export const REWARD_TYPE_OPTIONS = Object.freeze([
  { value: "priority_queue", label: "Priority Queue Jump", baseFraudRisk: "low" },
  { value: "extended_trial", label: "Extended Trial / Credits", baseFraudRisk: "low" },
  { value: "discount_pct", label: "Launch Discount %", baseFraudRisk: "low" },
  { value: "digital_asset", label: "Digital Guide / Template", baseFraudRisk: "low" },
  { value: "physical_swag", label: "Physical Swag / Hardware", baseFraudRisk: "high" },
  { value: "lifetime_deal", label: "Lifetime Deal / Free Plan", baseFraudRisk: "high" },
]);

export const DEFAULT_REWARD_INPUTS = Object.freeze({
  productLtv: 120,
  grossMarginPct: 80,
  targetWaitlistSize: 5000,
  shareRatePct: 22,
  tiers: [
    {
      id: "tier-1",
      referrals: 3,
      rewardType: "priority_queue",
      label: "Priority wave 1 beta access",
      unitCost: 0,
    },
    {
      id: "tier-2",
      referrals: 5,
      rewardType: "extended_trial",
      label: "1 month of Pro credits at launch",
      unitCost: 6,
    },
    {
      id: "tier-3",
      referrals: 15,
      rewardType: "physical_swag",
      label: "Founding supporter tote & sticker pack",
      unitCost: 22,
    },
    {
      id: "tier-4",
      referrals: 30,
      rewardType: "lifetime_deal",
      label: "Founding lifetime workspace license",
      unitCost: 45,
    },
  ],
});

function assessTierFraudRisk(tier) {
  const highRiskType = tier.rewardType === "physical_swag" || tier.rewardType === "lifetime_deal";
  if ((highRiskType || tier.unitCost >= 15) && tier.referrals <= 5) {
    return {
      level: "high",
      label: "High fraud risk",
      reason: "High marginal value at <=5 referrals makes disposable-email farming profitable.",
    };
  }
  if (highRiskType && tier.referrals <= 12) {
    return {
      level: "medium",
      label: "Moderate risk",
      reason: "Require double opt-in and Strict velocity limits before fulfilling.",
    };
  }
  if (tier.unitCost > 0 && tier.referrals <= 2) {
    return {
      level: "medium",
      label: "Moderate risk",
      reason: "Paid unit cost on 1–2 referrals is vulnerable to self-referral rings.",
    };
  }
  return {
    level: "low",
    label: "Low risk",
    reason: "Aligned with product-native value and healthy referral thresholds.",
  };
}

/**
 * Estimates fraction of verified subscribers unlocking >= threshold referrals
 * under a Pareto/power-law sharer curve scaled by shareRate and viral intensity.
 */
function unlockRateForThreshold(threshold, shareRate, intensityMultiplier) {
  const t = Math.max(1, Number(threshold) || 1);
  // Calibrated Pareto tail: at shareRate=0.22, intensity=1.0 -> t=1 (~14%), t=3 (~4.2%), t=5 (~2.1%), t=15 (~0.4%)
  const rate = shareRate * 0.65 * intensityMultiplier * Math.pow(t, -1.38);
  return Math.min(0.65, Math.max(0.0005, rate));
}

export function designReferralRewards(rawInputs = {}) {
  const productLtv = Math.max(5, Math.min(10000, Number(rawInputs.productLtv) || 120));
  const grossMarginPct = Math.max(10, Math.min(98, Number(rawInputs.grossMarginPct) || 80));
  const targetWaitlistSize = Math.max(
    100,
    Math.min(500000, Math.round(Number(rawInputs.targetWaitlistSize) || 5000)),
  );
  const shareRatePct = Math.max(3, Math.min(65, Number(rawInputs.shareRatePct) || 22));
  const shareRate = shareRatePct / 100;

  const rawTiers =
    Array.isArray(rawInputs.tiers) && rawInputs.tiers.length
      ? rawInputs.tiers
      : DEFAULT_REWARD_INPUTS.tiers;

  const tiers = rawTiers
    .slice(0, 4)
    .map((tier, index) => ({
      id: tier.id || `tier-${index + 1}`,
      referrals: Math.max(1, Math.min(500, Math.round(Number(tier.referrals) || (index + 1) * 3))),
      rewardType: tier.rewardType || "priority_queue",
      label: String(tier.label || `Tier ${index + 1} reward`)
        .trim()
        .slice(0, 110),
      unitCost: Math.max(0, Math.min(1000, Number(tier.unitCost) || 0)),
    }))
    .sort((a, b) => a.referrals - b.referrals);

  const scenarios = {
    p25: { label: "Conservative (P25)", multiplier: 0.65 },
    p50: { label: "Baseline (P50)", multiplier: 1.0 },
    p90: { label: "Breakout (P90)", multiplier: 1.75 },
  };

  const tierBreakdowns = tiers.map((tier) => {
    const p25Earners = Math.round(
      targetWaitlistSize *
        unlockRateForThreshold(tier.referrals, shareRate, scenarios.p25.multiplier),
    );
    const p50Earners = Math.round(
      targetWaitlistSize *
        unlockRateForThreshold(tier.referrals, shareRate, scenarios.p50.multiplier),
    );
    const p90Earners = Math.round(
      targetWaitlistSize *
        unlockRateForThreshold(tier.referrals, shareRate, scenarios.p90.multiplier),
    );
    const fraudRisk = assessTierFraudRisk(tier);
    return {
      ...tier,
      p25Earners,
      p50Earners,
      p90Earners,
      p25Cost: Number((p25Earners * tier.unitCost).toFixed(2)),
      p50Cost: Number((p50Earners * tier.unitCost).toFixed(2)),
      p90Cost: Number((p90Earners * tier.unitCost).toFixed(2)),
      fraudRisk,
      microcopy: `Invite ${tier.referrals} verified ${tier.referrals === 1 ? "friend" : "friends"} → Unlock ${tier.label}`,
    };
  });

  const budgets = {
    p25: Number(tierBreakdowns.reduce((sum, t) => sum + t.p25Cost, 0).toFixed(2)),
    p50: Number(tierBreakdowns.reduce((sum, t) => sum + t.p50Cost, 0).toFixed(2)),
    p90: Number(tierBreakdowns.reduce((sum, t) => sum + t.p90Cost, 0).toFixed(2)),
  };

  // Projected verified referrals driven across the campaign at P50
  const estimatedReferredP50 = Math.max(1, Math.round(targetWaitlistSize * shareRate * 1.15));
  const effectiveCostPerReferralP50 = Number((budgets.p50 / estimatedReferredP50).toFixed(2));
  const grossMarginLtv = productLtv * (grossMarginPct / 100);
  const costToMarginLtvPct =
    grossMarginLtv > 0
      ? Number(((effectiveCostPerReferralP50 / grossMarginLtv) * 100).toFixed(1))
      : 0;

  const hasHighRisk = tierBreakdowns.some((t) => t.fraudRisk.level === "high");
  const hasMediumRisk = tierBreakdowns.some((t) => t.fraudRisk.level === "medium");
  const recommendedFraudMode = hasHighRisk || hasMediumRisk ? "STRICT" : "STANDARD";

  return {
    inputs: { productLtv, grossMarginPct, targetWaitlistSize, shareRatePct },
    tiers: tierBreakdowns,
    budgets,
    estimatedReferredP50,
    effectiveCostPerReferralP50,
    costToMarginLtvPct,
    hasHighRisk,
    recommendedFraudMode,
    antiFraudRecommendations: [
      "Require double opt-in email verification before awarding referral credit.",
      "Normalize Gmail dot/+alias duplicates automatically (built into Waitlyze).",
      hasHighRisk
        ? "Switch Waitlyze Fraud Mode to STRICT and review high-tier earners before shipping rewards."
        : "Keep Waitlyze velocity limits active to block automated signup bursts.",
    ],
    formula:
      "Effective Cost / Verified Referral = Sum(Tier Earners × Unit Cost) ÷ Projected Verified Referrals",
  };
}
