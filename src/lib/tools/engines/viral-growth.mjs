export const VIRAL_SCENARIO_PRESETS = Object.freeze([
  {
    id: "conservative",
    label: "Conservative SaaS beta",
    description: "Modeled scenario for an early B2B launch before optimizing referral prompts.",
    inputs: {
      startingList: 50,
      weeklyVisitors: 600,
      conversionRatePct: 14,
      verificationRatePct: 75,
      shareRatePct: 12,
      clicksPerSharer: 3,
      referredConversionPct: 22,
      weeks: 8,
      rewardCostPerReferral: 0,
    },
  },
  {
    id: "baseline",
    label: "Steady referral waitlist",
    description: "Modeled scenario with clear post-signup share links and double opt-in.",
    inputs: {
      startingList: 100,
      weeklyVisitors: 1200,
      conversionRatePct: 18,
      verificationRatePct: 78,
      shareRatePct: 22,
      clicksPerSharer: 4,
      referredConversionPct: 28,
      weeks: 8,
      rewardCostPerReferral: 0,
    },
  },
  {
    id: "ambitious",
    label: "High-share consumer launch",
    description: "Modeled scenario with milestone incentives and high peer-to-peer sharing.",
    inputs: {
      startingList: 250,
      weeklyVisitors: 2500,
      conversionRatePct: 24,
      verificationRatePct: 80,
      shareRatePct: 34,
      clicksPerSharer: 5,
      referredConversionPct: 32,
      weeks: 10,
      rewardCostPerReferral: 1.5,
    },
  },
]);

export const DEFAULT_VIRAL_INPUTS = Object.freeze({ ...VIRAL_SCENARIO_PRESETS[1].inputs });

function clamp(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function runCoreSimulation(inputs) {
  const directConv = inputs.conversionRatePct / 100;
  const verifyRate = inputs.verificationRatePct / 100;
  const shareRate = inputs.shareRatePct / 100;
  const refConv = inputs.referredConversionPct / 100;

  const rawK = shareRate * inputs.clicksPerSharer * refConv * verifyRate;
  const effectiveK = Number(rawK.toFixed(3));
  const cappedK = Math.min(rawK, 1.35);

  const cycles = [];
  let cumulativeDirect = inputs.startingList;
  let cumulativeReferred = 0;
  // Week 0 active cohort (modest 25% of existing starting list shares in week 1)
  let previousNewCohort = inputs.startingList * 0.25;

  for (let week = 1; week <= inputs.weeks; week += 1) {
    const direct = Math.round(inputs.weeklyVisitors * directConv * verifyRate);
    // Gentle saturation decay (0.96^(week-1)) keeps long horizons realistic
    const saturation = Math.pow(0.96, week - 1);
    const referred = Math.round(previousNewCohort * cappedK * saturation);

    cumulativeDirect += direct;
    cumulativeReferred += referred;
    const cumulativeTotal = cumulativeDirect + cumulativeReferred;

    cycles.push({
      week,
      direct,
      referred,
      totalNew: direct + referred,
      cumulativeDirect,
      cumulativeReferred,
      cumulativeTotal,
    });

    previousNewCohort = direct + referred;
  }

  const directAdded = cumulativeDirect - inputs.startingList;
  const totalVerified = cumulativeDirect + cumulativeReferred;
  const referralLiftPct =
    directAdded > 0 ? Math.round((cumulativeReferred / directAdded) * 100) : 0;

  return {
    effectiveK,
    directAdded,
    referredTotal: cumulativeReferred,
    totalVerified,
    referralLiftPct,
    cycles,
  };
}

export function calculateViralGrowth(rawInputs = {}) {
  const inputs = {
    startingList: Math.round(
      clamp(rawInputs.startingList, 0, 50000, DEFAULT_VIRAL_INPUTS.startingList),
    ),
    weeklyVisitors: Math.round(
      clamp(rawInputs.weeklyVisitors, 50, 100000, DEFAULT_VIRAL_INPUTS.weeklyVisitors),
    ),
    conversionRatePct: clamp(
      rawInputs.conversionRatePct,
      1,
      75,
      DEFAULT_VIRAL_INPUTS.conversionRatePct,
    ),
    verificationRatePct: clamp(
      rawInputs.verificationRatePct,
      30,
      100,
      DEFAULT_VIRAL_INPUTS.verificationRatePct,
    ),
    shareRatePct: clamp(rawInputs.shareRatePct, 0, 80, DEFAULT_VIRAL_INPUTS.shareRatePct),
    clicksPerSharer: clamp(
      rawInputs.clicksPerSharer,
      0.5,
      15,
      DEFAULT_VIRAL_INPUTS.clicksPerSharer,
    ),
    referredConversionPct: clamp(
      rawInputs.referredConversionPct,
      1,
      75,
      DEFAULT_VIRAL_INPUTS.referredConversionPct,
    ),
    weeks: Math.round(clamp(rawInputs.weeks, 2, 24, DEFAULT_VIRAL_INPUTS.weeks)),
    rewardCostPerReferral: clamp(
      rawInputs.rewardCostPerReferral,
      0,
      50,
      DEFAULT_VIRAL_INPUTS.rewardCostPerReferral,
    ),
  };

  const base = runCoreSimulation(inputs);
  const estimatedRewardBudget = Number(
    (base.referredTotal * inputs.rewardCostPerReferral).toFixed(2),
  );
  const effectiveCostPerVerifiedReferral =
    base.referredTotal > 0 ? Number((estimatedRewardBudget / base.referredTotal).toFixed(2)) : 0;

  // +10% relative sensitivity analysis across all 5 growth levers
  const levers = [
    { key: "conversionRatePct", label: "Landing-page conversion rate", max: 75 },
    { key: "verificationRatePct", label: "Email verification rate", max: 100 },
    { key: "shareRatePct", label: "Subscriber share rate", max: 80 },
    { key: "clicksPerSharer", label: "Clicks per sharer", max: 15 },
    { key: "referredConversionPct", label: "Referred visitor conversion", max: 75 },
  ];

  const sensitivity = levers
    .map((lever) => {
      const bumpedVal = Math.min(lever.max, Number((inputs[lever.key] * 1.1).toFixed(2)));
      const testSim = runCoreSimulation({ ...inputs, [lever.key]: bumpedVal });
      const extraSignups = Math.max(0, testSim.totalVerified - base.totalVerified);
      return {
        key: lever.key,
        label: lever.label,
        fromValue: inputs[lever.key],
        toValue: bumpedVal,
        extraSignups,
      };
    })
    .sort((a, b) => b.extraSignups - a.extraSignups);

  const highestLever = sensitivity[0];

  let resultBand = "healthy";
  let recommendation =
    "Your referral loop adds meaningful compounding lift. Enable double opt-in verification and post-signup share prompts inside Waitlyze.";

  if (base.effectiveK < 0.15) {
    resultBand = "conversion_first";
    recommendation =
      "With K below 0.15, focus first on landing-page conversion and email verification before adding paid referral rewards.";
  } else if (base.effectiveK > 0.6) {
    resultBand = "verify_assumptions";
    recommendation =
      "K above 0.60 is unusually aggressive for most pre-launch lists. Stress-test your share rate and enable Strict fraud controls before promising cash-cost rewards.";
  }

  return {
    inputs,
    effectiveK: base.effectiveK,
    directAdded: base.directAdded,
    referredTotal: base.referredTotal,
    totalVerified: base.totalVerified,
    referralLiftPct: base.referralLiftPct,
    estimatedRewardBudget,
    effectiveCostPerVerifiedReferral,
    cycles: base.cycles,
    sensitivity,
    highestLever,
    resultBand,
    recommendation,
    formula:
      "K = Share Rate × Clicks per Sharer × Referred Conversion Rate × Email Verification Rate",
  };
}
