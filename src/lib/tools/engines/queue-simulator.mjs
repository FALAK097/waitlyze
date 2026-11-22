import { FOLLOW_POINTS, REFERRAL_POINTS, SIGNUP_POINTS } from "@/lib/referrals/points.mjs";

export const SHARER_SKEW_OPTIONS = Object.freeze([
  {
    value: "conservative",
    label: "Low sharing (82% refer 0)",
    zeroSharePct: 0.82,
    alpha: 1.65,
  },
  {
    value: "balanced",
    label: "Balanced launch (75% refer 0)",
    zeroSharePct: 0.75,
    alpha: 1.4,
  },
  {
    value: "viral",
    label: "High sharing (65% refer 0)",
    zeroSharePct: 0.65,
    alpha: 1.2,
  },
]);

export const QUEUE_SIMULATOR_DEFAULTS = Object.freeze({
  waitlistSize: 2500,
  pointsSignup: SIGNUP_POINTS, // 50
  pointsReferral: REFERRAL_POINTS, // 30
  pointsBonus: 10,
  pointsFollow: FOLLOW_POINTS, // 5
  sharerSkew: "balanced",
});

export function simulateWaitlistQueue(rawInputs = {}) {
  const waitlistSize = Math.max(
    100,
    Math.min(
      100000,
      Math.round(Number(rawInputs.waitlistSize) || QUEUE_SIMULATOR_DEFAULTS.waitlistSize),
    ),
  );
  const pointsSignup = Math.max(
    0,
    Math.min(
      200,
      Math.round(Number(rawInputs.pointsSignup ?? QUEUE_SIMULATOR_DEFAULTS.pointsSignup)),
    ),
  );
  const pointsReferral = Math.max(
    5,
    Math.min(
      200,
      Math.round(Number(rawInputs.pointsReferral ?? QUEUE_SIMULATOR_DEFAULTS.pointsReferral)),
    ),
  );
  const pointsBonus = Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(rawInputs.pointsBonus ?? QUEUE_SIMULATOR_DEFAULTS.pointsBonus)),
    ),
  );
  const skew =
    SHARER_SKEW_OPTIONS.find((s) => s.value === rawInputs.sharerSkew) || SHARER_SKEW_OPTIONS[1];

  // Fraction of existing subscribers who have strictly MORE than `r` referrals
  function fractionWithMoreThan(r) {
    if (r < 0) return 1;
    const activeShareFraction = 1 - skew.zeroSharePct;
    if (r === 0) return activeShareFraction;
    return activeShareFraction * Math.pow(r + 1, -skew.alpha);
  }

  // Given a newly joined subscriber's total points, estimate how many existing
  // subscribers beat them under Waitlyze's deterministic (points DESC, createdAt ASC) rule.
  // Because the new joiner has the newest timestamp, anyone with >= their points stays ahead.
  function rankForPoints(totalPoints, referrals) {
    if (totalPoints <= pointsSignup) {
      return waitlistSize;
    }
    // Existing subscribers whose points >= totalPoints
    const equivalentReferralsNeeded = Math.max(
      0,
      Math.ceil((totalPoints - pointsSignup) / pointsReferral),
    );
    const aheadFraction =
      referrals === 0 && pointsBonus > 0
        ? fractionWithMoreThan(0)
        : fractionWithMoreThan(Math.max(0, equivalentReferralsNeeded - 1));
    return Math.max(1, Math.min(waitlistSize, Math.round(waitlistSize * aheadFraction) + 1));
  }

  const checkpoints = [0, 1, 2, 3, 5, 10, 15, 25];
  const jumpCurve = checkpoints.map((referrals) => {
    const earnedPoints =
      pointsSignup + referrals * pointsReferral + (referrals > 0 ? pointsBonus : 0);
    const rank = rankForPoints(earnedPoints, referrals);
    const placesJumped = Math.max(0, waitlistSize - rank);
    const topPercentile = Math.max(0.1, Number(((rank / waitlistSize) * 100).toFixed(1)));
    return {
      referrals,
      points: earnedPoints,
      rank,
      placesJumped,
      topPercentile,
    };
  });

  function rankForReferrals(referrals) {
    const earnedPoints =
      pointsSignup + referrals * pointsReferral + (referrals > 0 ? pointsBonus : 0);
    return rankForPoints(earnedPoints, referrals);
  }

  function referralsForTargetRank(targetRank) {
    if (rankForReferrals(0) <= targetRank) return 0;
    if (pointsReferral <= 0) return null;
    // Exponential bound expansion + binary search using the exact same rankForPoints model
    let low = 1;
    let high = 1;
    const maxSearch = Math.max(10000, waitlistSize * 2);
    while (high < maxSearch && rankForReferrals(high) > targetRank) {
      low = high + 1;
      high = Math.min(maxSearch, high * 2);
    }
    if (rankForReferrals(high) > targetRank) return high;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (rankForReferrals(mid) <= targetRank) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    return low;
  }

  const cutoffs = [
    {
      label: "Top 10%",
      targetRank: Math.max(1, Math.round(waitlistSize * 0.1)),
      referralsRequired: referralsForTargetRank(Math.max(1, Math.round(waitlistSize * 0.1))),
    },
    {
      label: "Top 1%",
      targetRank: Math.max(1, Math.round(waitlistSize * 0.01)),
      referralsRequired: referralsForTargetRank(Math.max(1, Math.round(waitlistSize * 0.01))),
    },
    {
      label: "Top 100",
      targetRank: Math.min(100, waitlistSize),
      referralsRequired: referralsForTargetRank(Math.min(100, waitlistSize)),
    },
    {
      label: "Top 10",
      targetRank: Math.min(10, waitlistSize),
      referralsRequired: referralsForTargetRank(Math.min(10, waitlistSize)),
    },
  ];

  const oneRefRow = jumpCurve.find((row) => row.referrals === 1);
  const ratio = pointsSignup > 0 ? pointsReferral / pointsSignup : 1;

  let recommendedDisplay = "Exact queue rank (#142)";
  let hideCounts = false;
  if (waitlistSize >= 10000) {
    recommendedDisplay = "Percentile band (Top 5%) + milestones";
    hideCounts = true;
  } else if (waitlistSize >= 5000) {
    recommendedDisplay = "Exact rank for Top 1,000, percentile below";
  }

  let fairnessStatus = "healthy";
  let fairnessSummary = `Strong first-referral motivation: 1 verified referral moves a new joiner from #${waitlistSize.toLocaleString()} to #${oneRefRow.rank.toLocaleString()} (Top ${oneRefRow.topPercentile}%).`;
  if (ratio < 0.25) {
    fairnessStatus = "weak_incentive";
    fairnessSummary =
      "Referral points are low relative to base signup points. Raise Referral Points to at least 40% to 60% of Base Signup Points.";
  } else if (cutoffs[3].referralsRequired > 35) {
    fairnessStatus = "lockout_risk";
    fairnessSummary =
      "Reaching Top 10 requires 35+ referrals at this list size. Use guaranteed milestone tiers (e.g., 3 and 5 referrals) alongside leaderboard rank so late joiners stay motivated.";
  }

  return {
    inputs: { waitlistSize, pointsSignup, pointsReferral, pointsBonus, sharerSkew: skew.value },
    jumpCurve,
    cutoffs,
    oneRefJump: oneRefRow,
    threeRefJump: jumpCurve.find((row) => row.referrals === 3),
    recommendedDisplay,
    hideCounts,
    fairnessStatus,
    fairnessSummary,
    tieBreakerNote:
      "Waitlyze orders subscribers by Total Verified Points DESC, then Signup Timestamp ASC, so equal point totals always preserve earlier supporters.",
    formula: `Total Points = ${pointsSignup} (Base) + (Verified Referrals × ${pointsReferral}) + Bonus Points`,
  };
}
