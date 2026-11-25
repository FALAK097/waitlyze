import {
  authenticateV1,
  resolveV1Workspace,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import prisma from "@/lib/prisma.js";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { createWorkspaceService } from "@/lib/workspaces/service.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "workspace:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "viewCampaign");
  if (wsCheck.error) return wsCheck.error;

  const [workspace, entitlements, totalSignups, verifiedSignups, integrations] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: wsCheck.workspaceId },
      include: {
        _count: { select: { waitLists: true, members: true, emailSuppressions: true } },
      },
    }),
    getWorkspaceEntitlements(prisma, wsCheck.workspaceId),
    prisma.signUp.count({ where: { waitList: { workspaceId: wsCheck.workspaceId } } }),
    prisma.signUp.count({
      where: { waitList: { workspaceId: wsCheck.workspaceId }, verifiedAt: { not: null } },
    }),
    prisma.workspaceIntegration.findMany({
      where: { workspaceId: wsCheck.workspaceId },
      select: {
        provider: true,
        status: true,
        fromEmail: true,
        lastTestedAt: true,
        lastErrorCode: true,
        webhookSecretCiphertext: true,
        providerConfig: true,
      },
    }),
  ]);

  if (!workspace) {
    return v1Error(404, "NOT_FOUND", "Workspace not found.", undefined, budget);
  }

  const resendRow = integrations.find((i) => i.provider === "RESEND");
  const cfRow = integrations.find((i) => i.provider === "CLOUDFLARE_EMAIL");

  return v1Json(
    {
      id: workspace.id,
      name: workspace.name,
      role: wsCheck.role,
      isPersonal: Boolean(workspace.personalOwnerId),
      entitlements,
      usage: {
        waitlists: workspace._count.waitLists,
        members: workspace._count.members,
        suppressions: workspace._count.emailSuppressions,
        totalSignups,
        verifiedSignups,
      },
      integrations: {
        resend: resendRow
          ? {
              connected: true,
              fromEmail: resendRow.fromEmail,
              status: resendRow.status,
              webhookConfigured: Boolean(resendRow.webhookSecretCiphertext),
              lastTestedAt: resendRow.lastTestedAt,
              lastErrorCode: resendRow.lastErrorCode,
            }
          : { connected: false },
        cloudflareEmail: cfRow
          ? {
              connected: true,
              fromEmail: cfRow.fromEmail,
              status: cfRow.status,
              accountId: cfRow.providerConfig?.accountId ?? null,
              lastTestedAt: cfRow.lastTestedAt,
              lastErrorCode: cfRow.lastErrorCode,
            }
          : { connected: false },
      },
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    },
    { budget },
  );
}

export async function PATCH(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "workspace:manage");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageWorkspace");
  if (wsCheck.error) return wsCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) {
    return v1Error(
      400,
      "INVALID_NAME",
      "Enter a workspace name (1-80 characters).",
      undefined,
      budget,
    );
  }

  try {
    const updated = await createWorkspaceService(prisma).renameWorkspace(
      authContext.userId,
      wsCheck.workspaceId,
      name,
    );
    await recordAuditEvent(prisma, {
      workspaceId: wsCheck.workspaceId,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.WORKSPACE_RENAMED,
      resourceType: "workspace",
      resourceId: wsCheck.workspaceId,
      resourceName: name,
    });
    return v1Json(updated, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
