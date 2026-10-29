import console from "node:console";
import { ReadableStream } from "node:stream/web";
import { URL } from "node:url";
import { TextEncoder } from "node:util";

import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import {
  AUDIENCE_PAGE_SIZE,
  audienceOrderBy,
  audienceWhere,
  buildExportRow,
  exportHeaderRow,
  isJoinedSort,
  isPositionSort,
  parseAudienceFilters,
  parseExportColumns,
  sortAudienceRows,
} from "@/lib/audience-query.mjs";
import {
  getCampaignPositions,
  getEligibleReferralCounts,
} from "@/lib/campaigns/referral-position.mjs";
import prisma from "@/lib/prisma";
import { campaignRouteAccess } from "@/lib/workspaces/campaign-route-access.mjs";

async function getAccess(request, id) {
  const access = await campaignRouteAccess({
    request,
    id,
    permission: "viewAudience",
    select: { id: true, showReferrals: true, sendEmailsToSubscribers: true, publicSlug: true },
  });
  if (access.response) return access;
  return { scope: access.scope, ...access.waitlist };
}

async function verificationDelivery(waitListId, signupIds) {
  if (!signupIds.length) return new Map();
  const events = await prisma.$queryRaw`
    SELECT DISTINCT ON (event."payload"->>'signUpId')
      event."payload",
      event."status"::text AS status,
      event."lastErrorCode",
      event."createdAt",
      event."processedAt"
    FROM "outbox_events" AS event
    WHERE event."waitListId" = ${waitListId}
      AND event."type" = 'SIGNUP_VERIFICATION_REQUESTED'
      AND event."payload"->>'signUpId' = ANY(${signupIds}::text[])
    ORDER BY event."payload"->>'signUpId', event."createdAt" DESC, event."id" DESC
  `;
  const latest = new Map();
  for (const event of events) {
    const signupId = event.payload?.signUpId;
    if (typeof signupId === "string" && !latest.has(signupId))
      latest.set(signupId, {
        status: event.status,
        issue: event.lastErrorCode,
        createdAt: event.createdAt,
        processedAt: event.processedAt,
      });
  }
  return latest;
}

const escapeLike = (v) => String(v ?? "").replace(/[\\%_]/g, (m) => "\\" + m);

function failedVerificationWhere(waitListId, filters) {
  return Prisma.sql`
    "signup"."waitListId" = ${waitListId}
    AND (${filters.status} = 'all'
      OR (${filters.status} = 'verified' AND "signup"."verifiedAt" IS NOT NULL)
      OR (${filters.status} = 'pending' AND "signup"."verifiedAt" IS NULL))
    AND (${filters.query} = '' OR "signup"."email" ILIKE ${`%${escapeLike(filters.query)}%`} ESCAPE '\\')
    AND (${filters.country} = '' OR "signup"."country" ILIKE ${`%${escapeLike(filters.country)}%`} ESCAPE '\\')
    AND (${filters.city} = '' OR "signup"."city" ILIKE ${`%${escapeLike(filters.city)}%`} ESCAPE '\\')
    AND (${filters.source} = '' OR "signup"."utmSource" ILIKE ${`%${escapeLike(filters.source)}%`} ESCAPE '\\')
    AND (${filters.landing} = '' OR "signup"."landingPage" ILIKE ${`%${escapeLike(filters.landing)}%`} ESCAPE '\\')
    AND (${filters.device} = ''
      OR "signup"."deviceType" ILIKE ${`%${escapeLike(filters.device)}%`} ESCAPE '\\'
      OR "signup"."device" ILIKE ${`%${escapeLike(filters.device)}%`} ESCAPE '\\')
    AND (${filters.utm} = ''
      OR "signup"."utmMedium" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\'
      OR "signup"."utmCampaign" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\'
      OR "signup"."utmTerm" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\'
      OR "signup"."utmContent" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\'
      OR "signup"."referrer" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\')
    AND EXISTS (
      SELECT 1
      FROM "outbox_events" AS "latest"
      WHERE "latest"."waitListId" = "signup"."waitListId"
        AND "latest"."type" = 'SIGNUP_VERIFICATION_REQUESTED'
        AND "latest"."payload"->>'signUpId' = "signup"."id"
        AND "latest"."status"::text = 'FAILED'
        AND "latest"."lastErrorCode" IS DISTINCT FROM 'RECIPIENT_SUPPRESSED'
        AND (
          "latest"."lastErrorCode" IS DISTINCT FROM 'SIGNUP_NOT_SENDABLE'
          OR (
            "signup"."verifiedAt" IS NULL
            AND EXISTS (
              SELECT 1
              FROM "wait_lists" AS "eligibleWaitList"
              WHERE "eligibleWaitList"."id" = "signup"."waitListId"
                AND "eligibleWaitList"."status"::text = 'PUBLISHED'
                AND NOT EXISTS (
                  SELECT 1
                  FROM "email_suppressions" AS "suppression"
                  WHERE "suppression"."workspaceId" = "eligibleWaitList"."workspaceId"
                    AND "suppression"."emailNormalized" = COALESCE(NULLIF("signup"."emailNormalized", ''), lower(btrim("signup"."email")))
                )
            )
          )
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "outbox_events" AS "newer"
          WHERE "newer"."waitListId" = "latest"."waitListId"
            AND "newer"."type" = "latest"."type"
            AND "newer"."payload"->>'signUpId' = "latest"."payload"->>'signUpId'
            AND ("newer"."createdAt" > "latest"."createdAt"
              OR ("newer"."createdAt" = "latest"."createdAt" AND "newer"."id" > "latest"."id"))
        )
    )`;
}

function failedVerificationAfter(filters, cursor) {
  if (!cursor) return Prisma.empty;
  if (filters.sort === "joined_asc" || isPositionSort(filters.sort)) {
    return Prisma.sql`AND ("signup"."createdAt" > ${cursor.createdAt} OR ("signup"."createdAt" = ${cursor.createdAt} AND "signup"."id" > ${cursor.id}))`;
  }
  if (filters.sort === "joined_desc") {
    return Prisma.sql`AND ("signup"."createdAt" < ${cursor.createdAt} OR ("signup"."createdAt" = ${cursor.createdAt} AND "signup"."id" < ${cursor.id}))`;
  }
  if (filters.sort === "email_asc") {
    return Prisma.sql`AND ("signup"."email" > ${cursor.email} OR ("signup"."email" = ${cursor.email} AND "signup"."id" > ${cursor.id}))`;
  }
  if (filters.sort === "email_desc") {
    return Prisma.sql`AND ("signup"."email" < ${cursor.email} OR ("signup"."email" = ${cursor.email} AND "signup"."id" > ${cursor.id}))`;
  }
  if (filters.sort === "points_asc") {
    return Prisma.sql`AND ("signup"."points" > ${cursor.points} OR ("signup"."points" = ${cursor.points} AND "signup"."id" > ${cursor.id}))`;
  }
  if (filters.sort === "points_desc") {
    return Prisma.sql`AND ("signup"."points" < ${cursor.points} OR ("signup"."points" = ${cursor.points} AND "signup"."id" > ${cursor.id}))`;
  }
  if (filters.sort === "status_desc") {
    return cursor.verifiedAt
      ? Prisma.sql`AND ("signup"."verifiedAt" IS NULL OR ("signup"."verifiedAt" IS NOT NULL AND "signup"."id" > ${cursor.id}))`
      : Prisma.sql`AND "signup"."verifiedAt" IS NULL AND "signup"."id" > ${cursor.id}`;
  }
  if (filters.sort === "status_asc") {
    return cursor.verifiedAt
      ? Prisma.sql`AND "signup"."verifiedAt" IS NOT NULL AND "signup"."id" > ${cursor.id}`
      : Prisma.sql`AND ("signup"."verifiedAt" IS NOT NULL OR ("signup"."verifiedAt" IS NULL AND "signup"."id" > ${cursor.id}))`;
  }
  return Prisma.empty;
}

function audienceExportAfter(sort, cursor) {
  if (!cursor) return {};
  if (sort === "joined_asc") {
    return {
      OR: [
        { createdAt: { gt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { gt: cursor.id } },
      ],
    };
  }
  if (sort === "joined_desc") {
    return {
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
  }
  if (sort === "email_asc" || sort === "email_desc") {
    return {
      OR: [
        { email: { [sort === "email_asc" ? "gt" : "lt"]: cursor.email } },
        { email: cursor.email, id: { gt: cursor.id } },
      ],
    };
  }
  if (sort === "points_asc" || sort === "points_desc") {
    return {
      OR: [
        { points: { [sort === "points_asc" ? "gt" : "lt"]: cursor.points } },
        { points: cursor.points, id: { gt: cursor.id } },
      ],
    };
  }
  if (sort === "status_desc") {
    return cursor.verifiedAt
      ? {
          OR: [
            { verifiedAt: { lt: cursor.verifiedAt } },
            { verifiedAt: null },
            { verifiedAt: cursor.verifiedAt, id: { gt: cursor.id } },
          ],
        }
      : { verifiedAt: null, id: { gt: cursor.id } };
  }
  if (sort === "status_asc") {
    return cursor.verifiedAt
      ? {
          OR: [
            { verifiedAt: { gt: cursor.verifiedAt } },
            { verifiedAt: cursor.verifiedAt, id: { gt: cursor.id } },
          ],
        }
      : {
          OR: [{ verifiedAt: null, id: { gt: cursor.id } }, { verifiedAt: { not: null } }],
        };
  }
  return {};
}

function positionAudienceWhere(waitListId, filters) {
  return Prisma.sql`
    "signup"."waitListId" = ${waitListId}
    AND (${filters.status} = 'all'
      OR (${filters.status} = 'verified' AND "signup"."verifiedAt" IS NOT NULL)
      OR (${filters.status} = 'pending' AND "signup"."verifiedAt" IS NULL))
    AND (${filters.query} = '' OR "signup"."email" ILIKE ${`%${escapeLike(filters.query)}%`} ESCAPE '\\')
    AND (${filters.country} = '' OR "signup"."country" ILIKE ${`%${escapeLike(filters.country)}%`} ESCAPE '\\')
    AND (${filters.city} = '' OR "signup"."city" ILIKE ${`%${escapeLike(filters.city)}%`} ESCAPE '\\')
    AND (${filters.source} = '' OR "signup"."utmSource" ILIKE ${`%${escapeLike(filters.source)}%`} ESCAPE '\\')
    AND (${filters.landing} = '' OR "signup"."landingPage" ILIKE ${`%${escapeLike(filters.landing)}%`} ESCAPE '\\')
    AND (${filters.device} = ''
      OR "signup"."deviceType" ILIKE ${`%${escapeLike(filters.device)}%`} ESCAPE '\\'
      OR "signup"."device" ILIKE ${`%${escapeLike(filters.device)}%`} ESCAPE '\\')
    AND (${filters.utm} = ''
      OR "signup"."utmMedium" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\'
      OR "signup"."utmCampaign" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\'
      OR "signup"."utmTerm" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\'
      OR "signup"."utmContent" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\'
      OR "signup"."referrer" ILIKE ${`%${escapeLike(filters.utm)}%`} ESCAPE '\\')
  `;
}

async function rankedAudiencePage(waitListId, filters, pageIndex) {
  const where = positionAudienceWhere(waitListId, filters);
  return prisma.$queryRaw`
    WITH referral_scores AS (
      SELECT referral."referredById" AS "referrerId", COUNT(*)::bigint AS score
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
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
      SELECT signup."id", signup."createdAt",
        ROW_NUMBER() OVER (
          ORDER BY COALESCE(score.score, 0) DESC, signup."createdAt" ASC, signup."id" ASC
        ) AS position
      FROM "sign_ups" AS signup
      LEFT JOIN referral_scores AS score ON score."referrerId" = signup."id"
      WHERE signup."waitListId" = ${waitListId}
    )
    SELECT ranked."id", ranked.position
    FROM ranked
    INNER JOIN "sign_ups" AS signup ON signup."id" = ranked."id"
    WHERE ${where}
    ORDER BY
      CASE WHEN ${filters.sort} = 'position_asc' THEN ranked.position END ASC,
      CASE WHEN ${filters.sort} = 'position_desc' THEN ranked.position END DESC,
      ranked."createdAt" ASC,
      ranked."id" ASC
    LIMIT ${AUDIENCE_PAGE_SIZE + 1}
    OFFSET ${pageIndex * AUDIENCE_PAGE_SIZE}
  `;
}

async function rankedFailedAudiencePage(waitListId, filters, pageIndex) {
  const where = failedVerificationWhere(waitListId, filters);
  return prisma.$queryRaw`
    WITH referral_scores AS (
      SELECT referral."referredById" AS "referrerId", COUNT(*)::bigint AS score
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
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
      SELECT signup."id", signup."createdAt",
        ROW_NUMBER() OVER (
          ORDER BY COALESCE(score.score, 0) DESC, signup."createdAt" ASC, signup."id" ASC
        ) AS position
      FROM "sign_ups" AS signup
      LEFT JOIN referral_scores AS score ON score."referrerId" = signup."id"
      WHERE signup."waitListId" = ${waitListId}
    )
    SELECT ranked."id", ranked.position
    FROM ranked
    INNER JOIN "sign_ups" AS signup ON signup."id" = ranked."id"
    WHERE ${where}
    ORDER BY
      CASE WHEN ${filters.sort} = 'position_asc' THEN ranked.position END ASC,
      CASE WHEN ${filters.sort} = 'position_desc' THEN ranked.position END DESC,
      ranked."createdAt" ASC,
      ranked."id" ASC
    LIMIT ${AUDIENCE_PAGE_SIZE + 1}
    OFFSET ${pageIndex * AUDIENCE_PAGE_SIZE}
  `;
}

async function failedVerificationPage(waitListId, filters, cursor, take, offset = null) {
  const where = failedVerificationWhere(waitListId, filters);
  const after = offset == null ? failedVerificationAfter(filters, cursor) : Prisma.empty;
  const paging =
    offset == null ? Prisma.sql`LIMIT ${take}` : Prisma.sql`LIMIT ${take} OFFSET ${offset}`;
  return prisma.$queryRaw`
    SELECT "signup"."id", "signup"."email", "signup"."phone", "signup"."createdAt", "signup"."verifiedAt",
      "signup"."country", "signup"."city", "signup"."timezone",
      "signup"."device", "signup"."deviceType",
      "signup"."referralCode", "signup"."utmSource", "signup"."utmMedium",
      "signup"."utmCampaign", "signup"."utmTerm", "signup"."utmContent",
      "signup"."landingPage", "signup"."referrer", "signup"."points"
    FROM "sign_ups" AS "signup"
    WHERE ${where} ${after}
    ORDER BY
      CASE WHEN ${filters.sort} = 'joined_asc' THEN "signup"."createdAt" END ASC,
      CASE WHEN ${filters.sort} = 'joined_desc' THEN "signup"."createdAt" END DESC,
      CASE WHEN ${filters.sort} = 'email_asc' THEN "signup"."email" END ASC,
      CASE WHEN ${filters.sort} = 'email_desc' THEN "signup"."email" END DESC,
      CASE WHEN ${filters.sort} = 'points_desc' THEN "signup"."points" END DESC,
      CASE WHEN ${filters.sort} = 'points_asc' THEN "signup"."points" END ASC,
      CASE WHEN ${filters.sort} = 'status_desc' THEN ("signup"."verifiedAt" IS NOT NULL) END DESC,
      CASE WHEN ${filters.sort} = 'status_asc' THEN ("signup"."verifiedAt" IS NOT NULL) END ASC,
      CASE WHEN ${filters.sort} IN ('position_asc', 'position_desc') THEN "signup"."createdAt" END ASC,
      CASE WHEN ${filters.sort} IN ('position_asc', 'position_desc') THEN "signup"."id" END ASC,
      CASE WHEN ${filters.sort} = 'joined_asc' THEN "signup"."id" END ASC,
      CASE WHEN ${filters.sort} = 'joined_desc' THEN "signup"."id" END DESC,
      CASE WHEN ${filters.sort} NOT IN ('joined_asc', 'joined_desc') THEN "signup"."id" END ASC
    ${paging}`;
}

async function failedVerificationCount(waitListId, filters) {
  const where = failedVerificationWhere(waitListId, filters);
  const [result] = await prisma.$queryRaw(
    Prisma.sql`SELECT COUNT(*)::int AS total FROM "sign_ups" AS "signup" WHERE ${where}`,
  );
  return result.total;
}

// The cursor row only supplies keyset coordinates; it must not have to still
// match the failed-delivery predicate (a retry on that row removes it from the
// failed set, and the next page would otherwise dead-end at 400).
async function failedVerificationCursor(waitListId, cursorId) {
  const [row] = await prisma.$queryRaw(Prisma.sql`
    SELECT "signup"."id", "signup"."createdAt"
    FROM "sign_ups" AS "signup"
    WHERE "signup"."waitListId" = ${waitListId} AND "signup"."id" = ${cursorId}
    LIMIT 1`);
  return row ?? null;
}

const ROW_SELECT = {
  id: true,
  email: true,
  phone: true,
  createdAt: true,
  verifiedAt: true,
  country: true,
  city: true,
  timezone: true,
  device: true,
  deviceType: true,
  referralCode: true,
  referrer: true,
  landingPage: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  utmTerm: true,
  utmContent: true,
  points: true,
  referredBy: {
    select: {
      referredBy: {
        select: {
          id: true,
          email: true,
          phone: true,
          verifiedAt: true,
          createdAt: true,
          country: true,
          city: true,
          device: true,
          deviceType: true,
          referralCode: true,
          utmSource: true,
          points: true,
        },
      },
    },
  },
};

// "Select all" support: every matching id (capped), honoring the same filters
// and workspace scope as the list itself.
const ID_SELECT_LIMIT = 2000;

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const access = await getAccess(request, id);
    if (access.response) return access.response;
    const url = new URL(request.url);
    const filters = parseAudienceFilters(url.searchParams);
    if (filters.error) return NextResponse.json({ error: filters.error }, { status: 400 });
    const direction = filters.sort === "joined_asc" ? "asc" : "desc";
    const cursor = url.searchParams.get("cursor");
    const pageIndex = Math.max(0, Number.parseInt(url.searchParams.get("page") || "0", 10) || 0);
    const failedOnly = filters.delivery === "failed";
    const cursorMode = isJoinedSort(filters.sort);
    if (cursor && cursorMode && cursor.length > 128)
      return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });

    if (url.searchParams.get("select") === "ids") {
      const ids = failedOnly
        ? (await failedVerificationPage(id, filters, null, ID_SELECT_LIMIT)).map((row) => row.id)
        : (
            await prisma.signUp.findMany({
              where: audienceWhere(id, access.scope, filters),
              select: { id: true },
              orderBy: [{ id: "asc" }],
              take: ID_SELECT_LIMIT + 1,
            })
          ).map((row) => row.id);
      return NextResponse.json({
        ids: ids.slice(0, ID_SELECT_LIMIT),
        truncated: ids.length > ID_SELECT_LIMIT,
      });
    }

    let positions = new Map();

    let rows;
    let total;
    if (cursorMode && !failedOnly) {
      const where = audienceWhere(id, access.scope, filters);
      if (cursor) {
        const cursorExists = await prisma.signUp.findFirst({
          where: { ...where, id: cursor },
          select: { id: true },
        });
        if (!cursorExists)
          return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });
      }
      [rows, total] = await Promise.all([
        prisma.signUp.findMany({
          where,
          select: ROW_SELECT,
          orderBy: [{ createdAt: direction }, { id: direction }],
          take: AUDIENCE_PAGE_SIZE + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
        prisma.signUp.count({ where }),
      ]);
    } else if (cursorMode) {
      const after = cursor ? await failedVerificationCursor(id, cursor) : null;
      if (cursor && !after)
        return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });
      [rows, total] = await Promise.all([
        failedVerificationPage(id, filters, after, AUDIENCE_PAGE_SIZE + 1),
        failedVerificationCount(id, filters),
      ]);
    } else if (!failedOnly && !isPositionSort(filters.sort)) {
      const where = audienceWhere(id, access.scope, filters);
      [rows, total] = await Promise.all([
        prisma.signUp.findMany({
          where,
          select: ROW_SELECT,
          orderBy: audienceOrderBy(filters.sort),
          skip: pageIndex * AUDIENCE_PAGE_SIZE,
          take: AUDIENCE_PAGE_SIZE + 1,
        }),
        prisma.signUp.count({ where }),
      ]);
    } else if (!failedOnly) {
      const where = audienceWhere(id, access.scope, filters);
      const [matches, count] = await Promise.all([
        access.showReferrals
          ? rankedAudiencePage(id, filters, pageIndex)
          : prisma.signUp.findMany({
              where,
              select: { id: true, createdAt: true },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
              skip: pageIndex * AUDIENCE_PAGE_SIZE,
              take: AUDIENCE_PAGE_SIZE + 1,
            }),
        prisma.signUp.count({ where }),
      ]);
      total = count;
      const slice = access.showReferrals
        ? matches.map((row) => ({ ...row, position: Number(row.position) }))
        : matches;
      positions = new Map(
        slice
          .filter((row) => Number.isSafeInteger(row.position) && row.position > 0)
          .map((row) => [row.id, row.position]),
      );
      const fetched = await prisma.signUp.findMany({
        where: { id: { in: slice.map((row) => row.id) } },
        select: ROW_SELECT,
      });
      const byId = new Map(fetched.map((row) => [row.id, row]));
      rows = slice.map((row) => byId.get(row.id)).filter(Boolean);
    } else {
      const [matches, count] = await Promise.all([
        access.showReferrals && isPositionSort(filters.sort)
          ? rankedFailedAudiencePage(id, filters, pageIndex)
          : failedVerificationPage(
              id,
              filters,
              null,
              AUDIENCE_PAGE_SIZE + 1,
              pageIndex * AUDIENCE_PAGE_SIZE,
            ),
        failedVerificationCount(id, filters),
      ]);
      total = count;
      if (access.showReferrals && isPositionSort(filters.sort)) {
        positions = new Map(
          matches
            .map((row) => ({ id: row.id, position: Number(row.position) }))
            .filter((row) => Number.isSafeInteger(row.position) && row.position > 0)
            .map((row) => [row.id, row.position]),
        );
        const fetched = await prisma.signUp.findMany({
          where: { id: { in: matches.map((row) => row.id) } },
          select: ROW_SELECT,
        });
        const byId = new Map(fetched.map((row) => [row.id, row]));
        rows = matches.map((row) => byId.get(row.id)).filter(Boolean);
      } else {
        rows = matches;
      }
    }
    const hasMore = rows.length > AUDIENCE_PAGE_SIZE;
    const pageRows = rows.slice(0, AUDIENCE_PAGE_SIZE);
    const [referralCounts, delivery, pagePositions] = await Promise.all([
      access.showReferrals
        ? getEligibleReferralCounts(
            prisma,
            id,
            pageRows.map((row) => row.id),
          )
        : new Map(),
      verificationDelivery(
        id,
        pageRows.map((row) => row.id),
      ),
      access.showReferrals && !failedOnly && !isPositionSort(filters.sort)
        ? getCampaignPositions(
            prisma,
            id,
            pageRows.map((row) => row.id),
          )
        : positions,
    ]);
    const page = pageRows.map((row) => ({
      ...row,
      referredBy: row.referredBy?.[0]?.referredBy ?? null,
      verificationDelivery: delivery.get(row.id) ?? null,
      referralCount: referralCounts.get(row.id) ?? 0,
      position: pagePositions.get(row.id) ?? null,
    }));
    const flags = {
      showReferrals: access.showReferrals,
      sendEmailsToSubscribers: access.sendEmailsToSubscribers,
      publicSlug: access.publicSlug,
    };
    return NextResponse.json({
      data: page,
      total,
      flags,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching audience:", error);
    return NextResponse.json({ error: "Unable to load subscribers." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const access = await getAccess(request, id);
    if (access.response) return access.response;
    const url = new URL(request.url);
    const filters = parseAudienceFilters(url.searchParams);
    if (filters.error) return NextResponse.json({ error: filters.error }, { status: 400 });
    const columns = parseExportColumns(url.searchParams.get("columns"));
    if (!columns)
      return NextResponse.json({ error: "Select at least one export column." }, { status: 400 });
    const direction = filters.sort === "joined_asc" ? "asc" : "desc";
    const failedOnly = filters.delivery === "failed";
    const where = audienceWhere(id, access.scope, filters);
    const needReferrals = columns.includes("referrals");
    const needPosition = columns.includes("position") && access.showReferrals;
    const select = { id: true, email: true, createdAt: true, verifiedAt: true };
    if (columns.includes("phone")) select.phone = true;
    if (columns.includes("country")) select.country = true;
    if (columns.includes("city")) select.city = true;
    if (columns.includes("timezone")) select.timezone = true;
    if (columns.includes("device")) select.device = true;
    if (columns.includes("device_type")) select.deviceType = true;
    if (columns.includes("source")) select.utmSource = true;
    if (columns.includes("utm_medium")) select.utmMedium = true;
    if (columns.includes("utm_campaign")) select.utmCampaign = true;
    if (columns.includes("utm_term")) select.utmTerm = true;
    if (columns.includes("utm_content")) select.utmContent = true;
    if (columns.includes("landing_page")) select.landingPage = true;
    if (columns.includes("referrer")) select.referrer = true;
    if (columns.includes("points") || filters.sort.startsWith("points_")) select.points = true;
    if (columns.includes("referral_code")) select.referralCode = true;
    if (columns.includes("referred_by"))
      select.referredBy = { select: { referredBy: { select: { email: true } } } };
    const joinedSort = isJoinedSort(filters.sort);
    const positionSort = isPositionSort(filters.sort);
    const encoder = new TextEncoder();
    async function* generateCsv() {
      yield `${exportHeaderRow(columns)}\r\n`;

      const positions =
        access.showReferrals && (needPosition || positionSort)
          ? await getCampaignPositions(prisma, id)
          : new Map();
      const enrichAndStream = async function* (rows) {
        const ids = rows.map((row) => row.id);
        const counts = needReferrals ? await getEligibleReferralCounts(prisma, id, ids) : new Map();
        for (const row of rows) {
          yield `${buildExportRow(row, columns, { referralCount: counts.get(row.id) ?? 0, position: positions.get(row.id) ?? "" })}\r\n`;
        }
      };

      if (!failedOnly && !positionSort) {
        const orderBy = joinedSort
          ? [{ createdAt: direction }, { id: direction }]
          : audienceOrderBy(filters.sort);
        let cursor;
        while (true) {
          const rows = await prisma.signUp.findMany({
            where: cursor ? { AND: [where, audienceExportAfter(filters.sort, cursor)] } : where,
            select,
            orderBy,
            take: 500,
          });
          for await (const row of enrichAndStream(rows)) yield row;
          if (rows.length < 500) break;
          cursor = rows.at(-1);
        }
      } else if (!failedOnly) {
        // Position ranking has no database ordering: snapshot the ordered ids,
        // then chunk-fetch rows and stream them in rank order.
        const matches = await prisma.signUp.findMany({
          where,
          select: { id: true, createdAt: true },
          orderBy: [{ id: "asc" }],
        });
        const ordered = sortAudienceRows(matches, filters.sort, positions);
        for (let index = 0; index < ordered.length; index += 500) {
          const chunk = ordered.slice(index, index + 500);
          const rows = await prisma.signUp.findMany({
            where: { id: { in: chunk.map((row) => row.id) } },
            select,
          });
          const byId = new Map(rows.map((row) => [row.id, row]));
          const orderedRows = chunk.map((ref) => byId.get(ref.id)).filter(Boolean);
          for await (const row of enrichAndStream(orderedRows)) yield row;
        }
      } else if (joinedSort) {
        let failedCursor;
        while (true) {
          const rows = await failedVerificationPage(id, filters, failedCursor, 500);
          for await (const row of enrichAndStream(rows)) yield row;
          if (rows.length < 500) break;
          failedCursor = { id: rows.at(-1).id, createdAt: rows.at(-1).createdAt };
        }
      } else if (!positionSort) {
        let failedCursor;
        while (true) {
          const rows = await failedVerificationPage(id, filters, failedCursor, 500);
          for await (const row of enrichAndStream(rows)) yield row;
          if (rows.length < 500) break;
          failedCursor = rows.at(-1);
        }
      } else {
        // Failed rows have no score column, so collect the matching rows to
        // apply the in-memory position comparator before streaming.
        const collected = [];
        let failedCursor;
        while (true) {
          const batch = await failedVerificationPage(id, filters, failedCursor, 2000);
          collected.push(...batch);
          if (batch.length < 2000) break;
          failedCursor = { id: batch.at(-1).id, createdAt: batch.at(-1).createdAt };
        }
        const orderedRows = sortAudienceRows(collected, filters.sort, positions);
        for await (const row of enrichAndStream(orderedRows)) yield row;
      }
    }

    const csvRows = generateCsv();
    const body = new ReadableStream({
      async pull(controller) {
        try {
          const chunks = [];
          let chunkLength = 0;
          while (chunkLength < 16_384) {
            const { done, value } = await csvRows.next();
            if (done) {
              if (chunks.length) controller.enqueue(encoder.encode(chunks.join("")));
              controller.close();
              return;
            }
            chunks.push(value);
            chunkLength += value.length;
          }
          controller.enqueue(encoder.encode(chunks.join("")));
        } catch (error) {
          console.error("Error exporting audience:", error);
          controller.error(error);
        }
      },
      async cancel() {
        await csvRows.return();
      },
    });
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=subscribers.csv",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Error exporting audience:", error);
    return NextResponse.json({ error: "Unable to export subscribers." }, { status: 500 });
  }
}
