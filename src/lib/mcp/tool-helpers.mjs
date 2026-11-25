import { WorkspacePlanError } from "@/lib/billing/plans.mjs";
import { apiKeyHasScope } from "@/lib/campaigns/api-key.mjs";
import { DraftCreationError } from "@/lib/campaigns/create-draft.mjs";
import { PublicationConflict } from "@/lib/campaigns/publication.mjs";
import { DraftRevisionConflict } from "@/lib/campaigns/save-draft-snapshot.mjs";
import {
  DuplicateSignupError,
  FraudLimitError,
  InvalidCampaignError,
} from "@/lib/campaigns/signups.mjs";
import { CustomerSenderNotConnectedError } from "@/lib/email/sender-resolution.mjs";
import { resolveWorkspaceContext } from "@/lib/mcp/auth.js";
import prisma from "@/lib/prisma.js";
import { AccessError, campaignScope, createWorkspaceService } from "@/lib/workspaces/service.mjs";

export function jsonResult(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function errorResult(message, code = "ERROR", extra = {}) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: { code, message, ...extra } }, null, 2),
      },
    ],
  };
}

export function assertScope(authContext, requiredScope) {
  if (!authContext?.authenticated || !authContext?.userId) {
    throw Object.assign(new Error("Authentication required."), { code: "UNAUTHORIZED" });
  }
  if (requiredScope && !apiKeyHasScope(authContext.scopes, requiredScope)) {
    throw Object.assign(new Error(`Missing required scope '${requiredScope}'.`), {
      code: "INSUFFICIENT_SCOPE",
    });
  }
}

export async function requireWaitlistAccess(
  authContext,
  waitlistId,
  requiredScope,
  permission = "viewCampaign",
  select = undefined,
) {
  assertScope(authContext, requiredScope);
  if (typeof waitlistId !== "string" || !waitlistId.trim()) {
    throw Object.assign(new TypeError("waitlistId is required."), { code: "INVALID_WAITLIST_ID" });
  }
  const id = waitlistId.trim();
  if (authContext.waitlistId && authContext.waitlistId !== id) {
    throw Object.assign(
      new Error(`This API key is scoped to waitlist '${authContext.waitlistId}', not '${id}'.`),
      { code: "WAITLIST_SCOPE_MISMATCH" },
    );
  }
  const scope = campaignScope(authContext.userId, permission, authContext.workspaceId || undefined);
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...scope },
    select,
  });
  if (!waitlist) {
    throw Object.assign(new Error(`Waitlist '${id}' not found or not accessible.`), {
      code: "NOT_FOUND",
    });
  }
  return { waitlist, scope };
}

export async function requireWorkspaceAccess(
  authContext,
  workspaceId,
  requiredScope,
  permission = "viewCampaign",
) {
  assertScope(authContext, requiredScope);
  if (authContext.waitlistId) {
    throw Object.assign(
      new Error("Waitlist-scoped API keys cannot perform workspace-wide operations."),
      { code: "WAITLIST_SCOPED_KEY" },
    );
  }
  const ws = await resolveWorkspaceContext(authContext, workspaceId || null);
  await createWorkspaceService(prisma).requireAccess(
    authContext.userId,
    ws.workspaceId,
    permission,
  );
  return ws;
}

export async function runTool(fn) {
  try {
    return jsonResult(await fn());
  } catch (error) {
    if (error instanceof AccessError) {
      return errorResult(error.message, "FORBIDDEN");
    }
    if (error instanceof WorkspacePlanError) {
      return errorResult(error.message, error.code || "PLAN_REQUIRED", { feature: error.feature });
    }
    if (error instanceof DraftCreationError) {
      return errorResult(error.message, error.code || "INVALID_REQUEST");
    }
    if (error instanceof DraftRevisionConflict || error instanceof PublicationConflict) {
      return errorResult(error.message, error.code || "CONFLICT");
    }
    if (error instanceof DuplicateSignupError) {
      return errorResult(error.message, "DUPLICATE_SIGNUP");
    }
    if (error instanceof InvalidCampaignError) {
      return errorResult(error.message, "NOT_FOUND");
    }
    if (error instanceof FraudLimitError) {
      return errorResult(error.message, "RATE_LIMITED");
    }
    if (
      error instanceof CustomerSenderNotConnectedError ||
      error?.code === "SENDER_NEEDS_ATTENTION"
    ) {
      return errorResult(error.message, error.code || "SENDER_NOT_CONFIGURED");
    }
    return errorResult(error?.message || "Unexpected error.", error?.code || "OPERATION_FAILED");
  }
}
