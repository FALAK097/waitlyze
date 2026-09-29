/**
 * Return the current 1-based position for one signup without rewriting campaign
 * ranks. A referral counts only after both the referrer and referred signup have
 * verified their email, referrals are enabled for the waitlist, and the
 * relationship stays inside that waitlist.
 */
export async function getCampaignPosition(db, waitListId, signUpId) {
  if (typeof waitListId !== "string" || !waitListId || typeof signUpId !== "string" || !signUpId) {
    return null;
  }

  const [row] = await db.$queryRaw`
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
        AND referral."referredById" IS NOT NULL
        AND referral."referredById" <> referral."signUpId"
      GROUP BY referral."referredById"
    ), target AS (
      SELECT signup."id", signup."waitListId", signup."createdAt",
             COALESCE(score.score, 0) AS score
      FROM "sign_ups" AS signup
      LEFT JOIN referral_scores AS score ON score."referrerId" = signup."id"
      WHERE signup."id" = ${signUpId}
        AND signup."waitListId" = ${waitListId}
    )
    SELECT target."id",
           COUNT(candidate."id") FILTER (WHERE
             COALESCE(candidate_score.score, 0) > target.score
             OR (
               COALESCE(candidate_score.score, 0) = target.score
               AND (candidate."createdAt", candidate."id") < (target."createdAt", target."id")
             )
           )::bigint + 1 AS position
    FROM target
    LEFT JOIN "sign_ups" AS candidate
      ON candidate."waitListId" = target."waitListId"
     AND candidate."id" <> target."id"
    LEFT JOIN referral_scores AS candidate_score
      ON candidate_score."referrerId" = candidate."id"
    GROUP BY target."id"
  `;

  if (!row?.id) return null;
  const position = Number(row.position);
  return Number.isSafeInteger(position) && position > 0 ? position : null;
}

export async function getEligibleReferralCounts(db, waitListId, signUpIds) {
  const ids = [...new Set((signUpIds ?? []).filter((id) => typeof id === "string" && id))];
  if (!waitListId || ids.length === 0) return new Map();

  const groups = await db.referral.groupBy({
    by: ["referredById"],
    where: {
      referredById: { in: ids },
      referredBy: { is: { waitListId, verifiedAt: { not: null } } },
      signUp: { is: { waitListId, verifiedAt: { not: null } } },
    },
    _count: { _all: true },
  });

  return new Map(groups
    .filter((group) => group.referredById)
    .map((group) => [group.referredById, group._count._all]));
}
