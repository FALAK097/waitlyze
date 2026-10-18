import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
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
    orderBy: { createdAt: "desc" },
    select: { payload: true, status: true, lastErrorCode: true, createdAt: true, processedAt: true },
  });
  const latest = new Map();
  for (const event of events) {
    const signupId = event.payload?.signUpId;
    if (typeof signupId === "string" && !latest.has(signupId)) latest.set(signupId, { status: event.status, issue: event.lastErrorCode, createdAt: event.createdAt, processedAt: event.processedAt });
  }
  return latest;
}

async function failedVerificationIds(waitListId) {
  const rows = await prisma.$queryRaw`
    SELECT recent.signup_id AS id FROM (
      SELECT DISTINCT ON ("payload"->>'signUpId') "payload"->>'signUpId' AS signup_id, "status"::text AS status, "lastErrorCode" AS issue
      FROM "outbox_events" WHERE "waitListId" = ${waitListId} AND "type" = 'SIGNUP_VERIFICATION_REQUESTED' AND "payload" ? 'signUpId'
      ORDER BY "payload"->>'signUpId', "createdAt" DESC
    ) recent WHERE recent.status = 'FAILED' AND (recent.issue IS NULL OR recent.issue NOT IN ('SIGNUP_NOT_SENDABLE', 'RECIPIENT_SUPPRESSED'))`;
  return rows.map(({ id }) => id);
}

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const access = await getAccess(request, id);
    if (access.response) return access.response;
    const url = new URL(request.url);
    const filters = parseAudienceFilters(url.searchParams);
    if (filters.error) return NextResponse.json({ error: filters.error }, { status: 400 });
    const where = { ...audienceWhere(id, access.scope, filters), ...(filters.delivery === "failed" ? { id: { in: await failedVerificationIds(id) } } : {}) };
    const direction = filters.sort === "joined_asc" ? "asc" : "desc";
    const cursor = url.searchParams.get("cursor");
    if (cursor) {
      if (cursor.length > 128) return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });
      const cursorExists = await prisma.signUp.findFirst({ where: { ...where, id: cursor }, select: { id: true } });
      if (!cursorExists) return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });
    }
    const [rows, total] = await Promise.all([
      prisma.signUp.findMany({
        where,
        select: { id: true, email: true, createdAt: true, verifiedAt: true, country: true, city: true, device: true, deviceType: true, referralCode: true, utmSource: true, points: true },
        orderBy: [{ createdAt: direction }, { id: direction }],
        take: AUDIENCE_PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.signUp.count({ where }),
    ]);
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
    const where = { ...audienceWhere(id, access.scope, filters), ...(filters.delivery === "failed" ? { id: { in: await failedVerificationIds(id) } } : {}) };
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
          while (true) {
            const rows = await prisma.signUp.findMany({
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
            cursor = rows.at(-1).id;
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
