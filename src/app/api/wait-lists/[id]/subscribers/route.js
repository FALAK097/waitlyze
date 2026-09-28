import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { AUDIENCE_PAGE_SIZE, audienceWhere, parseAudienceFilters, subscriberCsvRow } from "@/lib/audience-query.mjs";

async function getAccess(request, id) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { workspace } = await currentWorkspace();
  if (!workspace) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const scope = campaignScope(session.user.id, "viewAudience", workspace.id);
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...scope }, select: { id: true } });
  if (!waitlist) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { scope };
}

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const access = await getAccess(request, id);
    if (access.response) return access.response;
    const url = new URL(request.url);
    const filters = parseAudienceFilters(url.searchParams);
    if (filters.error) return NextResponse.json({ error: filters.error }, { status: 400 });
    const where = audienceWhere(id, access.scope, filters);
    const cursor = url.searchParams.get("cursor");
    if (cursor) {
      if (cursor.length > 128) return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });
      const cursorExists = await prisma.signUp.findFirst({ where: { ...where, id: cursor }, select: { id: true } });
      if (!cursorExists) return NextResponse.json({ error: "Invalid page cursor." }, { status: 400 });
    }
    const [rows, total] = await Promise.all([
      prisma.signUp.findMany({
        where,
        select: { id: true, email: true, createdAt: true, verifiedAt: true, country: true, city: true, device: true, _count: { select: { referrals: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: AUDIENCE_PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.signUp.count({ where }),
    ]);
    const hasMore = rows.length > AUDIENCE_PAGE_SIZE;
    const page = rows.slice(0, AUDIENCE_PAGE_SIZE).map(({ _count, ...row }) => ({ ...row, referralCount: _count.referrals }));
    return NextResponse.json({ data: page, total, nextCursor: hasMore ? page.at(-1)?.id ?? null : null });
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
    const where = audienceWhere(id, access.scope, filters);
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode("Email,Status,Joined at\r\n"));
          let cursor;
          while (true) {
            const rows = await prisma.signUp.findMany({
              where,
              select: { id: true, email: true, createdAt: true, verifiedAt: true },
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              take: 500,
              ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            });
            for (const row of rows) controller.enqueue(encoder.encode(`${subscriberCsvRow(row)}\r\n`));
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
