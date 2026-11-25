import { configureWorkspaceResendOp } from "@/lib/api/infra-ops.mjs";
import {
  authenticateV1,
  resolveV1Workspace,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import prisma from "@/lib/prisma.js";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageConnections");
  if (wsCheck.error) return wsCheck.error;

  const row = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId: wsCheck.workspaceId, provider: "RESEND" } },
    select: {
      id: true,
      provider: true,
      status: true,
      fromEmail: true,
      lastTestedAt: true,
      lastErrorCode: true,
      webhookSecretCiphertext: true,
      updatedAt: true,
    },
  });

  if (!row) {
    return v1Json({ connected: false }, { budget });
  }

  return v1Json(
    {
      connected: true,
      id: row.id,
      provider: row.provider,
      fromEmail: row.fromEmail,
      status: row.status,
      webhookConfigured: Boolean(row.webhookSecretCiphertext),
      lastTestedAt: row.lastTestedAt,
      lastErrorCode: row.lastErrorCode,
      updatedAt: row.updatedAt,
    },
    { budget },
  );
}

export async function PUT(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageConnections");
  if (wsCheck.error) return wsCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  try {
    const res = await configureWorkspaceResendOp({
      workspaceId: wsCheck.workspaceId,
      userId: authContext.userId,
      fromEmail: body?.fromEmail,
      apiKey: body?.apiKey,
      webhookSecret: body?.webhookSecret,
    });
    return v1Json(res, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function DELETE(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageConnections");
  if (wsCheck.error) return wsCheck.error;

  const deleted = await prisma.workspaceIntegration.deleteMany({
    where: { workspaceId: wsCheck.workspaceId, provider: "RESEND" },
  });
  if (deleted.count > 0) {
    await recordAuditEvent(prisma, {
      workspaceId: wsCheck.workspaceId,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.RESEND_DISCONNECTED,
      resourceType: "integration",
      resourceName: "Resend",
    });
  }

  return v1Json({ disconnected: deleted.count > 0 }, { budget });
}
