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
        AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
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

// Batch companion to getCampaignPosition: 1-based positions for every signup
// of a waitlist in a single query, using the same verified-only scoring. When
// IDs are provided, ranks remain global and only returned rows are restricted.
export async function getCampaignPositions(db, waitListId, signUpIds = null) {
  if (typeof waitListId !== "string" || !waitListId) return new Map();
  const ids = Array.isArray(signUpIds)
    ? [...new Set(signUpIds.filter((id) => typeof id === "string" && id))]
    : null;
  if (ids?.length === 0) return new Map();
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
      SELECT signup."id",
        ROW_NUMBER() OVER (
          ORDER BY COALESCE(score.score, 0) DESC, signup."createdAt" ASC, signup."id" ASC
        ) AS position
      FROM "sign_ups" AS signup
      LEFT JOIN referral_scores AS score ON score."referrerId" = signup."id"
      WHERE signup."waitListId" = ${waitListId}
    )
    SELECT ranked."id", ranked.position
    FROM ranked
    WHERE ${ids === null}::boolean OR ranked."id" = ANY(${ids ?? []}::text[])
  `;
  const positions = new Map();
  for (const row of rows) {
    const position = Number(row.position);
    if (row?.id && Number.isSafeInteger(position) && position > 0) positions.set(row.id, position);
  }
  return positions;
}

// Spots a hypothetical fresh signup (0 referrals, joining now at the end of
// the list) would need to pass the signup directly above them: the current
// last row's score plus one, or 0 when the list is empty. Powers silent-mode
// fraud responses so fakes carry the same `spots_to_advance` a real fresh
// signup would (no structurally-missing-keys oracle). Scoring matches
// getCampaignPosition exactly: verified-only, review-gated, same tiebreaks.
export async function getSpotsForNewSignup(db, waitListId) {
  if (typeof waitListId !== "string" || !waitListId) return 0;
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
    SELECT score AS last_score FROM ranked
    ORDER BY position DESC
    LIMIT 1
  `;
  if (!row || row.last_score == null) return 0;
  const spots = Number(row.last_score) + 1;
  return Number.isSafeInteger(spots) ? Math.max(spots, 1) : 0;
}

export async function getEligibleReferralCounts(db, waitListId, signUpIds) {
  const ids = [...new Set((signUpIds ?? []).filter((id) => typeof id === "string" && id))];
  if (!waitListId || ids.length === 0) return new Map();

  const groups = await db.referral.groupBy({
    by: ["referredById"],
    where: {
      referredById: { in: ids },
      reviewStatus: { in: ["CLEAR", "APPROVED"] },
      referredBy: { is: { waitListId, verifiedAt: { not: null } } },
      signUp: { is: { waitListId, verifiedAt: { not: null } } },
    },
    _count: { _all: true },
  });

  return new Map(
    groups
      .filter((group) => group.referredById)
      .map((group) => [group.referredById, group._count._all]),
  );
}
