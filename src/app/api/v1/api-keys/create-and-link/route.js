import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { selectedWorkspaceId } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
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
    });

    if (!user) {
      return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
    }

    const { name, waitlistId, expiresInDays = 90 } = await request.json();

    if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 64) {
      return NextResponse.json(
        { error: { message: "Name must be between 3 and 64 characters" } },
        { status: 400 },
      );
    }

    if (!waitlistId) {
      return NextResponse.json({ error: { message: "Waitlist ID is required" } }, { status: 400 });
    }

    if (![30, 90, 365, null].includes(expiresInDays)) {
      return NextResponse.json(
        { error: { message: "Choose an expiry of 30, 90, 365 days, or no expiry" } },
        { status: 400 },
      );
    }

    const workspaceId = await selectedWorkspaceId(user.id);
    const waitlist = await prisma.waitList.findFirst({
      where: {
        id: waitlistId,
        ...campaignScope(user.id, "manageConnections", workspaceId || undefined),
      },
      select: { id: true, name: true, workspaceId: true },
    });

    if (!waitlist) {
      return NextResponse.json({ error: { message: "Waitlist not found" } }, { status: 404 });
    }

    const newApiKey = await createApiKey({
      name: name.trim(),
      userId: user.id,
      waitlistId,
      expiresAt:
        expiresInDays === null ? null : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      scopes: ["waitlist:write"],
    });
    await recordAuditEvent(prisma, {
      workspaceId: waitlist.workspaceId,
      userId: user.id,
      action: AUDIT_ACTIONS.API_KEY_CREATED,
      resourceType: "api_key",
      resourceId: newApiKey.id,
      resourceName: name.trim(),
      detail: `For waitlist ${waitlist.name || waitlist.id}`,
    });

    const responseData = {
      apiKey: {
        ...newApiKey,
        key: "••••••••••••••••",
        apiKey: newApiKey.apiKey,
      },
    };

    return NextResponse.json({
      data: responseData,
    });
  } catch (error) {
    console.error("Error creating and linking API key:", error);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
