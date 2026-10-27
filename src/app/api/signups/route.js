import { Buffer } from "node:buffer";
import console from "node:console";
import { URL } from "node:url";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { campaignScope } from "@/lib/workspaces/service.mjs";

const MAX_PAGE_SIZE = 500;

function parsePageSize(searchParams) {
  if (!searchParams.has("limit")) return null;

  const value = searchParams.get("limit");
  if (!value || !/^\d+$/.test(value)) return undefined;

  const limit = Number(value);
  return Number.isSafeInteger(limit) && limit > 0 && limit <= MAX_PAGE_SIZE ? limit : undefined;
}

function parseCursor(value) {
  if (!value || value.length > 512) return undefined;

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const createdAt = new Date(decoded.createdAt);
    if (
      typeof decoded.id !== "string" ||
      decoded.id.length === 0 ||
      decoded.id.length > 128 ||
      Number.isNaN(createdAt.getTime())
    ) {
      return undefined;
    }

    return { id: decoded.id, createdAt };
  } catch {
    return undefined;
  }
}

function encodeCursor(signup) {
  return Buffer.from(
    JSON.stringify({ id: signup.id, createdAt: signup.createdAt.toISOString() }),
  ).toString("base64url");
}

export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const scope = campaignScope(session.user.id, "viewAudience");
    const { searchParams } = new URL(request.url);
    const waitListId = searchParams.get("waitListId");
    const pageSize = parsePageSize(searchParams);
    const cursor = parseCursor(searchParams.get("cursor"));

    if (
      pageSize === undefined ||
      cursor === undefined ||
      (searchParams.has("cursor") && (!searchParams.get("cursor") || pageSize === null))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid pagination parameters. Use limit 1-${MAX_PAGE_SIZE} and a valid cursor.`,
        },
        { status: 400 },
      );
    }

    if (!waitListId) {
      return NextResponse.json(
        { success: false, error: "waitListId is required" },
        { status: 400 },
      );
    }

    const campaign = await prisma.waitList.findFirst({
      where: { id: waitListId, ...scope },
      select: { id: true },
    });
    if (!campaign)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const paginationWhere = cursor
      ? {
          OR: [
            { createdAt: { gt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { gt: cursor.id } },
          ],
        }
      : {};
    const signups = await prisma.signUp.findMany({
      where: {
        waitListId: waitListId,
        waitList: scope,
        ...paginationWhere,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: pageSize ? [{ createdAt: "asc" }, { id: "asc" }] : { createdAt: "asc" },
      ...(pageSize ? { take: pageSize + 1 } : {}),
    });

    const hasMore = pageSize !== null && signups.length > pageSize;
    const data = pageSize && hasMore ? signups.slice(0, pageSize) : signups;

    return NextResponse.json(
      {
        success: true,
        data,
        ...(pageSize
          ? {
              hasMore,
              nextCursor: hasMore ? encodeCursor(data[data.length - 1]) : null,
            }
          : {}),
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
