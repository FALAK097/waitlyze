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
import { auth } from "@/lib/auth";
import {
  getCampaignPositions,
  getEligibleReferralCounts,
} from "@/lib/campaigns/referral-position.mjs";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

async function getAccess(request, id) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id)
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { workspace } = await currentWorkspace();
  if (!workspace) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const scope = campaignScope(session.user.id, "viewAudience", workspace.id);
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...scope },
    select: { id: true, showReferrals: true, sendEmailsToSubscribers: true, publicSlug: true },
  });
  if (!waitlist) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return {
    scope,
    showReferrals: waitlist.showReferrals,
    sendEmailsToSubscribers: waitlist.sendEmailsToSubscribers,
    publicSlug: waitlist.publicSlug,
  };
}

async function verificationDelivery(waitListId, signupIds) {
  if (!signupIds.length) return new Map();
  const events = await prisma.outboxEvent.findMany({
    where: {
      waitListId,
      type: "SIGNUP_VERIFICATION_REQUESTED",
      OR: signupIds.map((id) => ({ payload: { path: ["signUpId"], equals: id } })),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      payload: true,
      status: true,
      lastErrorCode: true,
      createdAt: true,
      processedAt: true,
    },
  });
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
            EXISTS (
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
  if (filters.sort === "joined_asc") {
    return Prisma.sql`AND ("signup"."createdAt" > ${cursor.createdAt} OR ("signup"."createdAt" = ${cursor.createdAt} AND "signup"."id" > ${cursor.id}))`;
  }
  return Prisma.sql`AND ("signup"."createdAt" < ${cursor.createdAt} OR ("signup"."createdAt" = ${cursor.createdAt} AND "signup"."id" < ${cursor.id}))`;
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
      CASE WHEN ${filters.sort} = 'status_desc' THEN "signup"."verifiedAt" END DESC NULLS LAST,
      CASE WHEN ${filters.sort} = 'status_asc' THEN "signup"."verifiedAt" END ASC NULLS FIRST,
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
// In-memory ranking window for the failed-delivery view, which has no score
// column to order by. Delivery failures are rare; this bound only guards
// against pathological volumes.
const FAILED_SORT_WINDOW = 5000;

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

    const positions =
      access.showReferrals && (isPositionSort(filters.sort) || !failedOnly)
        ? await getCampaignPositions(prisma, id)
        : new Map();

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
        prisma.signUp.findMany({
          where,
          select: { id: true, createdAt: true },
          orderBy: [{ id: "asc" }],
        }),
        prisma.signUp.count({ where }),
      ]);
      total = count;
      const slice = sortAudienceRows(matches, filters.sort, positions).slice(
        pageIndex * AUDIENCE_PAGE_SIZE,
        pageIndex * AUDIENCE_PAGE_SIZE + AUDIENCE_PAGE_SIZE + 1,
      );
      const fetched = await prisma.signUp.findMany({
        where: { id: { in: slice.map((row) => row.id) } },
        select: ROW_SELECT,
      });
      const byId = new Map(fetched.map((row) => [row.id, row]));
      rows = slice.map((row) => byId.get(row.id)).filter(Boolean);
    } else {
      const pool = await failedVerificationPage(id, filters, null, FAILED_SORT_WINDOW);
      total = await failedVerificationCount(id, filters);
      rows = sortAudienceRows(pool, filters.sort, positions).slice(
        pageIndex * AUDIENCE_PAGE_SIZE,
        pageIndex * AUDIENCE_PAGE_SIZE + AUDIENCE_PAGE_SIZE + 1,
      );
    }
    const hasMore = rows.length > AUDIENCE_PAGE_SIZE;
    const pageRows = rows.slice(0, AUDIENCE_PAGE_SIZE);
    const [referralCounts, delivery] = await Promise.all([
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
    ]);
    const page = pageRows.map((row) => ({
      ...row,
      referredBy: row.referredBy?.[0]?.referredBy ?? null,
      verificationDelivery: delivery.get(row.id) ?? null,
      referralCount: referralCounts.get(row.id) ?? 0,
      position: positions.get(row.id) ?? null,
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
    if (columns.includes("points")) select.points = true;
    if (columns.includes("referral_code")) select.referralCode = true;
    if (columns.includes("referred_by"))
      select.referredBy = { select: { referredBy: { select: { email: true } } } };
    const joinedSort = isJoinedSort(filters.sort);
    const positionSort = isPositionSort(filters.sort);
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`${exportHeaderRow(columns)}\r\n`));
          const positions =
            access.showReferrals && (needPosition || positionSort)
              ? await getCampaignPositions(prisma, id)
              : new Map();
          const streamRow = async (row, counts) => {
            controller.enqueue(
              encoder.encode(
                `${buildExportRow(row, columns, { referralCount: counts.get(row.id) ?? 0, position: positions.get(row.id) ?? "" })}\r\n`,
              ),
            );
          };
          const enrichAndStream = async (rows) => {
            const counts = needReferrals
              ? await getEligibleReferralCounts(
                  prisma,
                  id,
                  rows.map((row) => row.id),
                )
              : new Map();
            for (const row of rows) await streamRow(row, counts);
          };
          if (!failedOnly && !positionSort) {
            const orderBy = joinedSort
              ? [{ createdAt: direction }, { id: direction }]
              : audienceOrderBy(filters.sort);
            let cursor;
            let skipped = 0;
            while (true) {
              const rows = joinedSort
                ? await prisma.signUp.findMany({
                    where,
                    select,
                    orderBy,
                    take: 500,
                    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
                  })
                : await prisma.signUp.findMany({
                    where,
                    select,
                    orderBy,
                    take: 500,
                    skip: skipped,
                  });
              await enrichAndStream(rows);
              if (rows.length < 500) break;
              if (joinedSort) cursor = rows.at(-1).id;
              else skipped += rows.length;
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
              await enrichAndStream(chunk.map((ref) => byId.get(ref.id)).filter(Boolean));
            }
          } else if (joinedSort) {
            let failedCursor;
            while (true) {
              const rows = await failedVerificationPage(id, filters, failedCursor, 500);
              await enrichAndStream(rows);
              if (rows.length < 500) break;
              failedCursor = { id: rows.at(-1).id, createdAt: rows.at(-1).createdAt };
            }
          } else if (!positionSort) {
            let skipped = 0;
            while (true) {
              const rows = await failedVerificationPage(id, filters, null, 500, skipped);
              await enrichAndStream(rows);
              if (rows.length < 500) break;
              skipped += rows.length;
            }
          } else {
            // Failed rows have no score column: collect the bounded failure set,
            // rank it in memory, then stream.
            const collected = [];
            let failedCursor;
            while (true) {
              const batch = await failedVerificationPage(id, filters, failedCursor, 2000);
              collected.push(...batch);
              if (batch.length < 2000) break;
              failedCursor = { id: batch.at(-1).id, createdAt: batch.at(-1).createdAt };
            }
            await enrichAndStream(sortAudienceRows(collected, filters.sort, positions));
          }
          controller.close();
        } catch (error) {
          console.error("Error exporting audience:", error);
          controller.error(error);
        }
      },
    });
    return new Response(body, {
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
