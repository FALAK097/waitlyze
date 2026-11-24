import { Prisma } from "@/generated/prisma/client";

/**
 * Return the current 1-based position for one signup without rewriting campaign
 * ranks. When referrals are disabled on the campaign, uses an O(log N) indexed
 * count over (waitListId, createdAt, id).
 */
export async function getCampaignPosition(db, waitListId, signUpId) {
  if (typeof waitListId !== "string" || !waitListId || typeof signUpId !== "string" || !signUpId) {
    return null;
  }

  const campaign = await db.waitList.findUnique({
    where: { id: waitListId },
    select: { showReferrals: true },
  });
  if (!campaign) return null;

  if (!campaign.showReferrals) {
    const target = await db.signUp.findFirst({
      where: { id: signUpId, waitListId },
      select: { id: true, createdAt: true },
    });
    if (!target) return null;
    const ahead = await db.signUp.count({
      where: {
        waitListId,
        OR: [
          { createdAt: { lt: target.createdAt } },
          { createdAt: target.createdAt, id: { lt: target.id } },
        ],
      },
    });
    return ahead + 1;
  }

  const [row] = await db.$queryRaw`
    WITH referral_scores AS (
      SELECT referral."referredById" AS "referrerId", COUNT(*) AS score
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred
        ON referred."id" = referral."signUpId"
      INNER JOIN "sign_ups" AS referrer
        ON referrer."id" = referral."referredById"
       AND referrer."waitListId" = referred."waitListId"
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
           SUM(
             CASE
               WHEN candidate."id" IS NOT NULL AND (
                 COALESCE(candidate_score.score, 0) > target.score
                 OR (
                   COALESCE(candidate_score.score, 0) = target.score
                   AND (
                     REPLACE(candidate."createdAt", ' ', 'T') < REPLACE(target."createdAt", ' ', 'T')
                     OR (
                       REPLACE(candidate."createdAt", ' ', 'T') = REPLACE(target."createdAt", ' ', 'T')
                       AND candidate."id" < target."id"
                     )
                   )
                 )
               ) THEN 1
               ELSE 0
             END
           ) + 1 AS position
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
  const filterClause =
    ids === null ? Prisma.empty : Prisma.sql`WHERE ranked."id" IN (${Prisma.join(ids)})`;
  const rows = await db.$queryRaw`
    WITH referral_scores AS (
      SELECT referral."referredById" AS "referrerId", COUNT(*) AS score
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred
        ON referred."id" = referral."signUpId"
      INNER JOIN "sign_ups" AS referrer
        ON referrer."id" = referral."referredById"
       AND referrer."waitListId" = referred."waitListId"
      INNER JOIN "wait_lists" AS campaign
        ON campaign."id" = referred."waitListId"
       AND campaign."showReferrals" = 1
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
          ORDER BY COALESCE(score.score, 0) DESC, REPLACE(signup."createdAt", ' ', 'T') ASC, signup."id" ASC
        ) AS position
      FROM "sign_ups" AS signup
      LEFT JOIN referral_scores AS score ON score."referrerId" = signup."id"
      WHERE signup."waitListId" = ${waitListId}
    )
    SELECT ranked."id", ranked.position
    FROM ranked
    ${filterClause}
  `;
  const positions = new Map();
  for (const row of rows) {
    const position = Number(row.position);
    if (row?.id && Number.isSafeInteger(position) && position > 0) positions.set(row.id, position);
  }
  return positions;
}

// Spots a hypothetical fresh signup (0 referrals, joining now at the end of
// the list) would need to pass the signup directly above them.
export async function getSpotsForNewSignup(db, waitListId) {
  if (typeof waitListId !== "string" || !waitListId) return 0;
  const campaign = await db.waitList.findUnique({
    where: { id: waitListId },
    select: { showReferrals: true },
  });
  if (!campaign?.showReferrals) {
    const total = await db.signUp.count({ where: { waitListId } });
    return total > 0 ? 1 : 0;
  }
  const [row] = await db.$queryRaw`
    WITH referral_scores AS (
      SELECT referral."referredById" AS "referrerId", COUNT(*) AS score
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred
        ON referred."id" = referral."signUpId"
      INNER JOIN "sign_ups" AS referrer
        ON referrer."id" = referral."referredById"
       AND referrer."waitListId" = referred."waitListId"
      WHERE referred."waitListId" = ${waitListId}
        AND referred."verifiedAt" IS NOT NULL
        AND referrer."verifiedAt" IS NOT NULL
        AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
        AND referral."referredById" IS NOT NULL
        AND referral."referredById" <> referral."signUpId"
      GROUP BY referral."referredById"
    ), ranked AS (
      SELECT signup."id", COALESCE(score.score, 0) AS score,
        ROW_NUMBER() OVER (
          ORDER BY COALESCE(score.score, 0) DESC, REPLACE(signup."createdAt", ' ', 'T') ASC, signup."id" ASC
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
