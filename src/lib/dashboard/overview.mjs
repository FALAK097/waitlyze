// Cross-waitlist overview queries for the dashboard home: workspace totals,
// recent activity, and per-list health. All reads are workspace-scoped; the
// referral filter (all | organic | referred) applies to totals and recency.
// Counts use the same definitions as the waitlist list (_count of signups and
// impressions) so overview numbers reconcile with the table below.

import { campaignScope } from "@/lib/workspaces/service.mjs";

export const OVERVIEW_REFERRAL_FILTERS = Object.freeze(["all", "organic", "referred"]);
const RECENT_LIMIT = 8;
const LIST_LIMIT = 100;

export function normalizeOverviewReferral(value) {
  return OVERVIEW_REFERRAL_FILTERS.includes(value) ? value : "all";
}

const ELIGIBLE_REFERRAL = {
  referredById: { not: null },
  reviewStatus: { in: ["CLEAR", "APPROVED"] },
};

function referralSignupWhere(referral) {
  if (referral === "referred") return { referredBy: { some: ELIGIBLE_REFERRAL } };
  if (referral === "organic") return { referredBy: { none: ELIGIBLE_REFERRAL } };
  return {};
}

/** Cross-waitlist overview for one workspace. */
export async function getWorkspaceOverview(db, { userId, workspaceId, referral = "all" }) {
  const filter = normalizeOverviewReferral(referral);
  const scope = campaignScope(userId, "viewCampaign", workspaceId);
  const signupWhere = { waitList: scope, ...referralSignupWhere(filter) };

  const [lists, signups, verified, referred, recent, waitlistTotal, allSignupsTotal, visitorTotal] =
    await Promise.all([
      db.waitList.findMany({
        where: scope,
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          _count: { select: { signUps: true, impressions: true } },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        take: LIST_LIMIT,
      }),
      db.signUp.count({ where: signupWhere }),
      db.signUp.count({ where: { ...signupWhere, verifiedAt: { not: null } } }),
      db.signUp.count({
        where: { waitList: scope, referredBy: { some: ELIGIBLE_REFERRAL } },
      }),
      db.signUp.findMany({
        where: signupWhere,
        select: {
          id: true,
          email: true,
          createdAt: true,
          verifiedAt: true,
          waitListId: true,
          waitList: { select: { name: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: RECENT_LIMIT,
      }),
      // Headline totals must not inherit the LIST_LIMIT cap on the list query.
      db.waitList.count({ where: scope }),
      db.signUp.count({ where: { waitList: scope } }),
      db.impression.count({ where: { waitList: scope } }),
    ]);

  // Per-list health uses grouped aggregates so one round-trip covers the page.
  const health = await perListHealth(db, lists);
  const visitors = visitorTotal;
  const allSignups = allSignupsTotal;

  return {
    referral: filter,
    totals: {
      waitlists: waitlistTotal,
      signups,
      verified,
      referred,
      visitors,
      allSignups,
      verificationRate: signups === 0 ? null : Math.round((verified / signups) * 1000) / 10,
    },
    recent: recent.map((row) => ({
      id: row.id,
      email: row.email,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      verified: Boolean(row.verifiedAt),
      waitListId: row.waitListId,
      waitListName: row.waitList?.name || "Untitled waitlist",
    })),
    lists: health,
  };
}

async function perListHealth(db, lists) {
  if (!lists.length) return [];
  const ids = lists.map((list) => list.id);
  const [verifiedGroups, referredRows] = await Promise.all([
    db.signUp.groupBy({
      by: ["waitListId"],
      _count: { _all: true },
      where: { waitListId: { in: ids }, verifiedAt: { not: null } },
    }),
    db.$queryRaw`
      SELECT signup."waitListId" AS "waitListId", COUNT(*)::int AS "referred"
      FROM "sign_ups" AS signup
      INNER JOIN "referrals" AS referral
        ON referral."signUpId" = signup."id"
       AND referral."referredById" IS NOT NULL
       AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
      WHERE signup."waitListId" = ANY(${ids})
      GROUP BY signup."waitListId"
    `,
  ]);
  const verifiedById = new Map(verifiedGroups.map((row) => [row.waitListId, row._count._all]));
  const referredById = new Map(referredRows.map((row) => [row.waitListId, Number(row.referred)]));
  return lists.map((list) => {
    const visitors = list._count.impressions;
    const signups = list._count.signUps;
    const verified = verifiedById.get(list.id) ?? 0;
    const referred = referredById.get(list.id) ?? 0;
    return {
      id: list.id,
      name: list.name || "Untitled waitlist",
      status: list.status,
      updatedAt: list.updatedAt instanceof Date ? list.updatedAt.toISOString() : list.updatedAt,
      visitors,
      signups,
      conversion: visitors === 0 ? null : Math.round((signups / visitors) * 10000) / 100,
      verified,
      referred,
      referralShare: signups === 0 ? null : Math.round((referred / signups) * 1000) / 10,
    };
  });
}
