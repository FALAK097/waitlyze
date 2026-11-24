import { NextResponse } from "next/server";

import {
  authenticateV1,
  resolveV1Workspace,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { VALID_API_KEY_SCOPES } from "@/lib/db/sqlite-helpers.mjs";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { selectedWorkspaceId } from "@/lib/workspaces/current";
import { campaignScope, createWorkspaceService } from "@/lib/workspaces/service.mjs";
import { createApiKey, listUserApiKeys } from "@/services/api-key";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request) {
  try {
    const authResult = await authenticateV1(request, "workspace:read");
    if (authResult.response) return authResult.response;
    const { authContext, budget: _budget } = authResult;

    const requestedWs = request.nextUrl.searchParams.get("workspaceId");
    const workspaceId =
      authContext.workspaceId ||
      requestedWs ||
      (authContext.authType === "session" ? await selectedWorkspaceId(authContext.userId) : null);

    if (workspaceId && !authContext.waitlistId) {
      await createWorkspaceService(prisma).requireAccess(
        authContext.userId,
        workspaceId,
        "manageConnections",
      );
    }

    const waitlists = await prisma.waitList.findMany({
      where: {
        ...campaignScope(authContext.userId, "manageConnections", workspaceId || undefined),
        ...(authContext.waitlistId ? { id: authContext.waitlistId } : {}),
      },
      select: { id: true },
    });

    const apiKeys = await listUserApiKeys(
      authContext.userId,
      waitlists.map(({ id }) => id),
      workspaceId && !authContext.waitlistId ? [workspaceId] : [],
    );

    const apiKeysWithMaskedKeys = apiKeys.map(
      ({
        id,
        name,
        keyId,
        scopes,
        expiresAt,
        lastUsedAt,
        createdAt,
        waitlistId,
        workspaceId: wsId,
        waitlist,
        workspace,
      }) => ({
        id,
        name,
        keyId,
        scopes,
        expiresAt,
        lastUsedAt,
        createdAt,
        waitlistId,
        workspaceId: wsId,
        waitlist,
        workspace,
        key: keyId ? `wl2_${keyId.slice(0, 6)}••••••••` : "••••••••••••••••",
      }),
    );

    return v1Json(apiKeysWithMaskedKeys, { budget });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return v1Error(500, "server_error", "Internal server error");
  }
}

export async function POST(request) {
  try {
    const authResult = await authenticateV1(request, "workspace:write");
    if (authResult.response) return authResult.response;
    const { authContext, budget: _budget } = authResult;

    if (authContext.authType === "api_key" && authContext.waitlistId) {
      return v1Error(403, "forbidden", "Waitlist-scoped API keys cannot create new API keys.");
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return v1Error(400, "invalid_request", "JSON body is required.");
    }

    const {
      name,
      waitlistId = null,
      workspaceId: inputWorkspaceId = null,
      expiresInDays = 90,
    } = body;
    if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 64) {
      return v1Error(400, "invalid_name", "Name must be between 3 and 64 characters.");
    }
    if (![30, 90, 365, null].includes(expiresInDays)) {
      return v1Error(
        400,
        "invalid_expiry",
        "Choose an expiry of 30, 90, 365 days, or null (no expiry).",
      );
    }

    const scopes = Array.isArray(body.scopes)
      ? body.scopes
      : waitlistId
        ? ["waitlist:write"]
        : ["mcp:write"];
    if (!scopes.length || scopes.some((s) => !VALID_API_KEY_SCOPES.has(s))) {
      return v1Error(
        400,
        "invalid_scopes",
        `Scopes must be non-empty and chosen from: ${[...VALID_API_KEY_SCOPES].join(", ")}.`,
      );
    }

    let resolvedWorkspaceId = null;
    let resolvedWaitlist = null;
    if (waitlistId) {
      resolvedWaitlist = await prisma.waitList.findFirst({
        where: {
          id: waitlistId,
          ...campaignScope(
            authContext.userId,
            "manageConnections",
            authContext.workspaceId || inputWorkspaceId || undefined,
          ),
        },
        select: { id: true, name: true, workspaceId: true },
      });
      if (!resolvedWaitlist) {
        return v1Error(404, "not_found", "Waitlist not found.");
      }
      resolvedWorkspaceId = resolvedWaitlist.workspaceId;
    } else {
      const ws = await resolveV1Workspace(authContext, inputWorkspaceId, "manageConnections");
      if (ws.error) return ws.error;
      resolvedWorkspaceId = ws.workspaceId;
    }

    const newApiKey = await createApiKey({
      name: name.trim(),
      userId: authContext.userId,
      waitlistId: resolvedWaitlist?.id || null,
      workspaceId: resolvedWorkspaceId,
      expiresAt:
        expiresInDays === null ? null : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      scopes,
    });

    await recordAuditEvent(prisma, {
      workspaceId: resolvedWorkspaceId,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.API_KEY_CREATED,
      resourceType: "api_key",
      resourceId: newApiKey.id,
      resourceName: name.trim(),
      detail: resolvedWaitlist
        ? `For waitlist ${resolvedWaitlist.name || resolvedWaitlist.id}`
        : "Workspace-scoped API key",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newApiKey,
          key: `wl2_${newApiKey.keyId.slice(0, 6)}••••••••`,
        },
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return v1Error(500, "server_error", "Internal server error", { budget: undefined });
  }
}
