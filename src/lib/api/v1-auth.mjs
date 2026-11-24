import { NextResponse } from "next/server";

import { apiKeyHasScope } from "@/lib/campaigns/api-key.mjs";
import { resolveMcpAuth, resolveWorkspaceContext } from "@/lib/mcp/auth.js";
import prisma from "@/lib/prisma.js";
import { apiKeyRateLimitHeaders, consumeApiKeyBudget } from "@/lib/security/api-key-rate-limit.mjs";
import { PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";
import { campaignScope, createWorkspaceService } from "@/lib/workspaces/service.mjs";

const DEFAULT_HEADERS = {
  "Cache-Control": "private, no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key, Idempotency-Key",
};

export function v1CorsResponse() {
  return new NextResponse(null, { status: 204, headers: DEFAULT_HEADERS });
}

export function applyBudgetHeaders(response, budget) {
  const headers = apiKeyRateLimitHeaders(budget);
  for (const [k, v] of Object.entries(headers)) {
    response.headers.set(k, String(v));
  }
  return response;
}

export function v1Json(data, { status = 200, budget = null, pagination = undefined } = {}) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(pagination !== undefined ? { pagination } : {}),
    },
    {
      status,
      headers: {
        ...DEFAULT_HEADERS,
        ...apiKeyRateLimitHeaders(budget),
      },
    },
  );
}

export function v1Error(status, code, message, extra = {}, budget = null) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
      message,
      ...(extra && typeof extra === "object" ? extra : {}),
    },
    {
      status,
      headers: {
        ...DEFAULT_HEADERS,
        ...apiKeyRateLimitHeaders(budget),
      },
    },
  );
}

export async function authenticateV1(request, requiredScope) {
  const authContext = await resolveMcpAuth(request);
  if (!authContext?.authenticated || !authContext?.userId) {
    return {
      response: v1Error(401, "unauthorized", authContext?.error || "Authentication required."),
    };
  }
  if (requiredScope && !apiKeyHasScope(authContext.scopes, requiredScope)) {
    return {
      response: v1Error(
        403,
        "insufficient_scope",
        `This endpoint requires the '${requiredScope}' scope.`,
      ),
    };
  }
  let budget = null;
  if (authContext.authType === "api_key" && authContext.rawToken) {
    try {
      budget = await consumeApiKeyBudget(prisma, authContext.rawToken, {
        limit: 10000,
      });
    } catch (error) {
      if (error instanceof PublicRateLimitError) {
        return {
          response: NextResponse.json(
            {
              success: false,
              error: {
                code: error.status === 429 ? "rate_limit_exceeded" : "service_unavailable",
                message: error.message,
              },
              message: error.message,
            },
            {
              status: error.status,
              headers: {
                ...DEFAULT_HEADERS,
                "Retry-After": String(error.retryAfterSeconds ?? 60),
              },
            },
          ),
        };
      }
      throw error;
    }
  }
  return { authContext, budget };
}

export async function resolveV1Workspace(
  authContext,
  inputWorkspaceId = null,
  permission = "viewCampaign",
) {
  if (authContext.waitlistId) {
    return {
      error: v1Error(
        403,
        "waitlist_scoped_key",
        "Waitlist-scoped API keys cannot perform workspace-wide operations.",
      ),
    };
  }
  try {
    const ws = await resolveWorkspaceContext(authContext, inputWorkspaceId);
    await createWorkspaceService(prisma).requireAccess(
      authContext.userId,
      ws.workspaceId,
      permission,
    );
    return { workspaceId: ws.workspaceId, workspaceName: ws.workspaceName, role: ws.role };
  } catch (error) {
    const msg = error?.message || "Forbidden";
    const status = msg.includes("Unauthorized") || msg.includes("Forbidden") ? 403 : 404;
    return { error: v1Error(status, "forbidden", msg) };
  }
}

export async function requireV1Waitlist(
  authContext,
  waitlistId,
  permission = "viewCampaign",
  select = undefined,
) {
  if (typeof waitlistId !== "string" || !waitlistId || waitlistId.length > 128) {
    return { error: v1Error(400, "invalid_waitlist_id", "A valid waitlist ID is required.") };
  }
  if (authContext.waitlistId && authContext.waitlistId !== waitlistId) {
    return {
      error: v1Error(403, "forbidden", "Scoped API key does not have access to this waitlist."),
    };
  }
  const scope = campaignScope(authContext.userId, permission, authContext.workspaceId || undefined);
  const waitlist = await prisma.waitList.findFirst({
    where: { id: waitlistId, ...scope },
    ...(select ? { select } : {}),
  });
  if (!waitlist) {
    return { error: v1Error(404, "not_found", "Waitlist not found or access denied.") };
  }
  return { waitlist, scope };
}
