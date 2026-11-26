import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { parseJsonStringArray } from "@/lib/db/sqlite-helpers.mjs";
import prisma from "@/lib/prisma";
import { selectedWorkspaceId } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export async function POST(request, context) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
    }

    const params = await context.params;
    const { id } = params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: { message: "Invalid JSON body" } }, { status: 400 });
    }
    const waitlistId = body?.waitlistId;
    const requestedWorkspaceId =
      typeof body?.workspaceId === "string" && body.workspaceId ? body.workspaceId : null;

    if (typeof waitlistId !== "string" || !waitlistId) {
      return NextResponse.json({ error: { message: "Waitlist ID is required" } }, { status: 400 });
    }

    const [apiKey, cookieWorkspaceId] = await Promise.all([
      prisma.apiKey.findFirst({
        where: {
          id: id,
          userId: user.id,
          revokedAt: null,
        },
      }),
      requestedWorkspaceId ? Promise.resolve(null) : selectedWorkspaceId(user.id),
    ]);
    const workspaceId = requestedWorkspaceId || cookieWorkspaceId;

    if (!apiKey) {
      return NextResponse.json({ error: { message: "API key not found" } }, { status: 404 });
    }

    if (apiKey.waitlistId) {
      return NextResponse.json(
        {
          error: { message: "This API key is already linked to a waitlist" },
        },
        { status: 400 },
      );
    }

    const waitlist = await prisma.waitList.findFirst({
      where: {
        id: waitlistId,
        ...campaignScope(user.id, "manageConnections", workspaceId || undefined),
      },
    });

    if (!waitlist) {
      return NextResponse.json({ error: { message: "Waitlist not found" } }, { status: 404 });
    }

    if (apiKey.workspaceId && waitlist.workspaceId && apiKey.workspaceId !== waitlist.workspaceId) {
      return NextResponse.json(
        { error: { message: "API key belongs to a different workspace" } },
        { status: 403 },
      );
    }

    const linked = await prisma.apiKey.updateMany({
      where: { id, userId: user.id, waitlistId: null, revokedAt: null },
      data: { waitlistId, ...(waitlist.workspaceId ? { workspaceId: waitlist.workspaceId } : {}) },
    });
    if (linked.count === 0) {
      return NextResponse.json(
        { error: { message: "This API key can no longer be linked" } },
        { status: 409 },
      );
    }

    const updatedApiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        keyId: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        waitlist: { select: { id: true, name: true } },
      },
    });
    if (!updatedApiKey) {
      return NextResponse.json(
        { error: { message: "This API key can no longer be linked" } },
        { status: 409 },
      );
    }
    const apiKeyWithMaskedKey = {
      ...updatedApiKey,
      scopes: parseJsonStringArray(updatedApiKey.scopes, ["waitlist:write"]),
      key: "••••••••••••••••",
    };

    return NextResponse.json({ data: apiKeyWithMaskedKey });
  } catch (error) {
    console.error("Error linking API key to waitlist:", error);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
