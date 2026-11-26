import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { VALID_API_KEY_SCOPES } from "@/lib/db/sqlite-helpers.mjs";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { selectedWorkspaceId } from "@/lib/workspaces/current";
import { campaignScope, AccessError, createWorkspaceService } from "@/lib/workspaces/service.mjs";
import { createApiKey } from "@/services/api-key";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: { message: "Invalid JSON body" } }, { status: 400 });
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: { message: "Invalid JSON body" } }, { status: 400 });
    }
    const {
      name,
      waitlistId = null,
      workspaceId: inputWorkspaceId = null,
      expiresInDays = 90,
      scopes,
    } = body;

    if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 64) {
      return NextResponse.json(
        { error: { message: "Name must be between 3 and 64 characters" } },
        { status: 400 },
      );
    }

    if (![30, 90, 365, null].includes(expiresInDays)) {
      return NextResponse.json(
        { error: { message: "Choose an expiry of 30, 90, 365 days, or no expiry" } },
        { status: 400 },
      );
    }

    const effectiveScopes = Array.isArray(scopes)
      ? scopes
      : waitlistId
        ? ["waitlist:write"]
        : ["mcp:write"];
    if (
      !effectiveScopes.length ||
      effectiveScopes.some((scope) => !VALID_API_KEY_SCOPES.has(scope))
    ) {
      return NextResponse.json(
        { error: { message: "Choose at least one valid API key scope" } },
        { status: 400 },
      );
    }

    const workspaceId = inputWorkspaceId || (await selectedWorkspaceId(user.id));

    let waitlist = null;
    let targetWorkspaceId = workspaceId;
    if (waitlistId) {
      waitlist = await prisma.waitList.findFirst({
        where: {
          id: waitlistId,
          ...campaignScope(user.id, "manageConnections", workspaceId || undefined),
        },
        select: { id: true, name: true, workspaceId: true },
      });
      if (!waitlist) {
        return NextResponse.json({ error: { message: "Waitlist not found" } }, { status: 404 });
      }
      targetWorkspaceId = waitlist.workspaceId;
    } else if (targetWorkspaceId) {
      await createWorkspaceService(prisma).requireAccess(
        user.id,
        targetWorkspaceId,
        "manageConnections",
      );
    } else {
      return NextResponse.json(
        { error: { message: "Select a waitlist or workspace" } },
        { status: 400 },
      );
    }

    const newApiKey = await createApiKey({
      name: name.trim(),
      userId: user.id,
      waitlistId: waitlist?.id || null,
      workspaceId: targetWorkspaceId,
      expiresAt:
        expiresInDays === null ? null : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      scopes: effectiveScopes,
    });

    await recordAuditEvent(prisma, {
      workspaceId: targetWorkspaceId,
      userId: user.id,
      action: AUDIT_ACTIONS.API_KEY_CREATED,
      resourceType: "api_key",
      resourceId: newApiKey.id,
      resourceName: name.trim(),
      detail: waitlist
        ? `For waitlist ${waitlist.name || waitlist.id}`
        : "Workspace-scoped API key",
    });

    const responseData = {
      apiKey: {
        ...newApiKey,
        key: newApiKey.keyId ? `wl2_${newApiKey.keyId.slice(0, 6)}••••••••` : "••••••••••••••••",
        apiKey: newApiKey.apiKey,
      },
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: error.status === 404 ? 404 : 403 },
      );
    }
    console.error("Error creating and linking API key:", error);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
