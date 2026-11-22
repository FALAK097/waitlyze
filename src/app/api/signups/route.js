import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { campaignScope } from "@/lib/workspaces/service.mjs";

const MAX_PAGE_SIZE = 5000;

export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const scope = campaignScope(session.user.id, "viewAudience");
    const { searchParams } = new URL(request.url);
    const waitListId = searchParams.get("waitListId");
    const cursor = searchParams.get("cursor");
    const requestedLimit = searchParams.get("limit");
    const limit = requestedLimit == null ? MAX_PAGE_SIZE : Number(requestedLimit);

    if (!waitListId) {
      return NextResponse.json(
        { success: false, error: "waitListId is required" },
        { status: 400 },
      );
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: `limit must be an integer from 1 to ${MAX_PAGE_SIZE}` },
        { status: 400 },
      );
    }
    if (cursor && cursor.length > 128) {
      return NextResponse.json({ success: false, error: "cursor is invalid" }, { status: 400 });
    }

    const campaign = await prisma.waitList.findFirst({
      where: { id: waitListId, ...scope },
      select: { id: true },
    });
    if (!campaign)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    if (cursor) {
      const cursorSignup = await prisma.signUp.findFirst({
        where: { id: cursor, waitListId, waitList: scope },
        select: { id: true },
      });
      if (!cursorSignup)
        return NextResponse.json({ success: false, error: "cursor is invalid" }, { status: 400 });
    }

    const signups = await prisma.signUp.findMany({
      where: {
        waitListId: waitListId,
        waitList: scope,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit + 1,
    });
    const hasMore = signups.length > limit;
    const page = hasMore ? signups.slice(0, limit) : signups;

    return NextResponse.json(
      {
        success: true,
        data: page,
        pagination: {
          limit,
          hasMore,
          nextCursor: hasMore ? page.at(-1)?.id || null : null,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Error fetching signups:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch signup data" },
      { status: 500 },
    );
  }
}
