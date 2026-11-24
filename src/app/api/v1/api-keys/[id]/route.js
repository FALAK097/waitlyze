import { NextResponse } from "next/server";

import { authenticateV1, v1CorsResponse, v1Error } from "@/lib/api/v1-auth.mjs";
import prisma from "@/lib/prisma";
import {
  AUDIT_ACTIONS,
  recordAuditEvent,
  recordWaitlistAuditEvent,
} from "@/lib/workspaces/audit.mjs";
import { campaignScope, createWorkspaceService } from "@/lib/workspaces/service.mjs";
import { revokeApiKey } from "@/services/api-key";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function DELETE(req, { params }) {
  const { id } = await params;

  try {
    const authResult = await authenticateV1(req, "workspace:write");
    if (authResult.response) return authResult.response;
    const { authContext } = authResult;

    if (authContext.authType === "api_key" && authContext.waitlistId) {
      return v1Error(403, "forbidden", "Waitlist-scoped API keys cannot revoke API keys.");
    }
    if (!id) {
      return v1Error(400, "invalid_input", "API key ID is required");
    }

    const key = await prisma.apiKey.findFirst({
      where: { OR: [{ id }, { keyId: id }] },
      select: {
        id: true,
        userId: true,
        waitlistId: true,
        workspaceId: true,
        name: true,
        revokedAt: true,
        waitlist: { select: { name: true, workspaceId: true } },
      },
    });
    if (!key || key.revokedAt) {
      return v1Error(404, "not_found", "API key not found or access denied");
    }

    if (key.waitlistId) {
      const accessibleWaitlist = await prisma.waitList.findFirst({
        where: {
          id: key.waitlistId,
          ...campaignScope(
            authContext.userId,
            "manageConnections",
            authContext.workspaceId || undefined,
          ),
        },
        select: { id: true },
      });
      if (!accessibleWaitlist) {
        return v1Error(404, "not_found", "API key not found or access denied");
      }
      const success = await revokeApiKey(key.id, authContext.userId, accessibleWaitlist.id);
      if (!success) return v1Error(404, "not_found", "API key not found or access denied");

      await recordWaitlistAuditEvent(prisma, {
        userId: authContext.userId,
        waitListId: accessibleWaitlist.id,
        action: AUDIT_ACTIONS.API_KEY_REVOKED,
        resourceType: "api_key",
        resourceId: key.id,
        resourceName: key.name || "API key",
        detail: key.waitlist
          ? `For waitlist ${key.waitlist.name || key.waitlistId}`
          : "Access revoked immediately",
      });
      return new Response(null, { status: 204 });
    }

    if (key.workspaceId) {
      if (authContext.workspaceId && authContext.workspaceId !== key.workspaceId) {
        return v1Error(404, "not_found", "API key not found or access denied");
      }
      await createWorkspaceService(prisma).requireAccess(
        authContext.userId,
        key.workspaceId,
        "manageConnections",
      );
      const success = await revokeApiKey(key.id, authContext.userId, null, key.workspaceId);
      if (!success) return v1Error(404, "not_found", "API key not found or access denied");
      await recordAuditEvent(prisma, {
        workspaceId: key.workspaceId,
        userId: authContext.userId,
        action: AUDIT_ACTIONS.API_KEY_REVOKED,
        resourceType: "api_key",
        resourceId: key.id,
        resourceName: key.name || "API key",
        detail: "Workspace API key revoked",
      });
      return new Response(null, { status: 204 });
    }

    if (key.userId !== authContext.userId) {
      return v1Error(404, "not_found", "API key not found or access denied");
    }
    const success = await revokeApiKey(key.id, authContext.userId);
    if (!success) return v1Error(404, "not_found", "API key not found or access denied");
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: { code: "server_error", message: "Failed to revoke API key" } },
      { status: 500 },
    );
  }
}
