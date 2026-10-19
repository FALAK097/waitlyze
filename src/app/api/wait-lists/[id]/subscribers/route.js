import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { Prisma } from "@/generated/prisma/client";
import { AUDIENCE_PAGE_SIZE, audienceWhere, buildExportRow, exportHeaderRow, parseAudienceFilters, parseExportColumns } from "@/lib/audience-query.mjs";
import { getCampaignPositions, getEligibleReferralCounts } from "@/lib/campaigns/referral-position.mjs";

async function getAccess(request, id) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { workspace } = await currentWorkspace();
  if (!workspace) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const scope = campaignScope(session.user.id, "viewAudience", workspace.id);
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...scope }, select: { id: true, showReferrals: true, sendEmailsToSubscribers: true, publicSlug: true } });
  if (!waitlist) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { scope, showReferrals: waitlist.showReferrals, sendEmailsToSubscribers: waitlist.sendEmailsToSubscribers, publicSlug: waitlist.publicSlug };
}

async function verificationDelivery(waitListId, signupIds) {
  if (!signupIds.length) return new Map();
  const events = await prisma.outboxEvent.findMany({
    where: { waitListId, type: "SIGNUP_VERIFICATION_REQUESTED", OR: signupIds.map((id) => ({ payload: { path: ["signUpId"], equals: id } })) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { payload: true, status: true, lastErrorCode: true, createdAt: true, processedAt: true },
  });
  const latest = new Map();
  for (const event of events) {
    const signupId = event.payload?.signUpId;
    if (typeof signupId === "string" && !latest.has(signupId)) latest.set(signupId, { status: event.status, issue: event.lastErrorCode, createdAt: event.createdAt, processedAt: event.processedAt });
  }
  return latest;
}

function failedVerificationWhere(waitListId, filters) {
  return Prisma.sql`
    "signup"."waitListId" = ${waitListId}
    AND (${filters.status} = 'all'
      OR (${filters.status} = 'verified' AND "signup"."verifiedAt" IS NOT NULL)
      OR (${filters.status} = 'pending' AND "signup"."verifiedAt" IS NULL))
    AND (${filters.query} = '' OR "signup"."email" ILIKE ${`%${filters.query}%`})
    AND EXISTS (
      SELECT 1
      FROM "outbox_events" AS "latest"
      WHERE "latest"."waitListId" = "signup"."waitListId"
        AND "latest"."type" = 'SIGNUP_VERIFICATION_REQUESTED'
        AND "latest"."payload"->>'signUpId' = "signup"."id"
        AND "latest"."status"::text = 'FAILED'
        AND ("latest"."lastErrorCode" IS NULL OR "latest"."lastErrorCode" NOT IN ('SIGNUP_NOT_SENDABLE', 'RECIPIENT_SUPPRESSED'))
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

async function failedVerificationPage(waitListId, filters, cursor, take) {
  const where = failedVerificationWhere(waitListId, filters);
  const after = failedVerificationAfter(filters, cursor);
  return prisma.$queryRaw(Prisma.sql`
    SELECT "signup"."id", "signup"."email", "signup"."createdAt", "signup"."verifiedAt",
      "signup"."country", "signup"."city", "signup"."device", "signup"."deviceType",
      "signup"."referralCode", "signup"."utmSource", "signup"."points"
    FROM "sign_ups" AS "signup"
    WHERE ${where} ${after}
    ORDER BY
      CASE WHEN ${filters.sort} = 'joined_asc' THEN "signup"."createdAt" END ASC,
      CASE WHEN ${filters.sort} = 'joined_desc' THEN "signup"."createdAt" END DESC,
      CASE WHEN ${filters.sort} = 'joined_asc' THEN "signup"."id" END ASC,
      CASE WHEN ${filters.sort} = 'joined_desc' THEN "signup"."id" END DESC
    LIMIT ${take}`);
}

async function failedVerificationCount(waitListId, filters) {
  const where = failedVerificationWhere(waitListId, filters);
  const [result] = await prisma.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS total FROM "sign_ups" AS "signup" WHERE ${where}`);
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
    let rows;
    let total;
    if (cursor) {
      if (cursor.length > 128) return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });
    }
    if (filters.delivery === "failed") {
      const after = cursor ? await failedVerificationCursor(id, cursor) : null;
      if (cursor && !after) return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });
      [rows, total] = await Promise.all([
        failedVerificationPage(id, filters, after, AUDIENCE_PAGE_SIZE + 1),
        failedVerificationCount(id, filters),
      ]);
    } else {
      const where = audienceWhere(id, access.scope, filters);
      if (cursor) {
        const cursorExists = await prisma.signUp.findFirst({ where: { ...where, id: cursor }, select: { id: true } });
        if (!cursorExists) return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });
      }
      [rows, total] = await Promise.all([
        prisma.signUp.findMany({
          where,
          select: { id: true, email: true, createdAt: true, verifiedAt: true, country: true, city: true, device: true, deviceType: true, referralCode: true, utmSource: true, points: true },
          orderBy: [{ createdAt: direction }, { id: direction }],
          take: AUDIENCE_PAGE_SIZE + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
        prisma.signUp.count({ where }),
      ]);
    }
    const hasMore = rows.length > AUDIENCE_PAGE_SIZE;
    const pageRows = rows.slice(0, AUDIENCE_PAGE_SIZE);
    const [referralCounts, positions, delivery] = await Promise.all([
      access.showReferrals ? getEligibleReferralCounts(prisma, id, pageRows.map((row) => row.id)) : new Map(),
      access.showReferrals ? getCampaignPositions(prisma, id) : new Map(),
      verificationDelivery(id, pageRows.map((row) => row.id)),
    ]);
    const page = pageRows.map((row) => ({ ...row, verificationDelivery: delivery.get(row.id) ?? null, referralCount: referralCounts.get(row.id) ?? 0, position: positions.get(row.id) ?? null }));
    const flags = { showReferrals: access.showReferrals, sendEmailsToSubscribers: access.sendEmailsToSubscribers, publicSlug: access.publicSlug };
    return NextResponse.json({ data: page, total, flags, nextCursor: hasMore ? page.at(-1)?.id ?? null : null });
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
    if (!columns) return NextResponse.json({ error: "Select at least one export column." }, { status: 400 });
    const direction = filters.sort === "joined_asc" ? "asc" : "desc";
    const failedOnly = filters.delivery === "failed";
    const where = audienceWhere(id, access.scope, filters);
    const needReferrals = columns.includes("referrals");
    const needPosition = columns.includes("position") && access.showReferrals;
    const select = { id: true, email: true, createdAt: true, verifiedAt: true };
    if (columns.includes("country")) select.country = true;
    if (columns.includes("city")) select.city = true;
    if (columns.includes("device")) select.device = true;
    if (columns.includes("points")) select.points = true;
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`${exportHeaderRow(columns)}\r\n`));
          const positions = needPosition ? await getCampaignPositions(prisma, id) : new Map();
          let cursor;
          let failedCursor;
          while (true) {
            const rows = failedOnly
              ? await failedVerificationPage(id, filters, failedCursor, 500)
              : await prisma.signUp.findMany({
                  where,
                  select,
                  orderBy: [{ createdAt: direction }, { id: direction }],
                  take: 500,
                  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
                });
            const counts = needReferrals ? await getEligibleReferralCounts(prisma, id, rows.map((row) => row.id)) : new Map();
            for (const row of rows) {
              controller.enqueue(encoder.encode(`${buildExportRow(row, columns, { referralCount: counts.get(row.id) ?? 0, position: positions.get(row.id) ?? "" })}\r\n`));
            }
            if (rows.length < 500) break;
            if (failedOnly) failedCursor = { id: rows.at(-1).id, createdAt: rows.at(-1).createdAt };
            else cursor = rows.at(-1).id;
          }
          controller.close();
        } catch (error) {
          console.error("Error exporting audience:", error);
          controller.error(error);
        }
      },
    });
    return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=subscribers.csv", "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error exporting audience:", error);
    return NextResponse.json({ error: "Unable to export subscribers." }, { status: 500 });
  }
}
