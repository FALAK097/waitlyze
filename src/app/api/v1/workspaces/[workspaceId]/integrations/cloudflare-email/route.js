import {
  authenticateV1,
  resolveV1Workspace,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { encryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma.js";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";

const PROVIDER = "CLOUDFLARE_EMAIL";

function formatCloudflareConnection(row) {
  if (!row) return { connected: false };
  const cfg =
    row.providerConfig && typeof row.providerConfig === "object" ? row.providerConfig : {};
  return {
    connected: true,
    id: row.id,
    provider: PROVIDER,
    status: row.status,
    fromEmail: row.fromEmail,
    accountId: cfg.accountId || null,
    lastTestedAt: row.lastTestedAt,
    lastErrorCode: row.lastErrorCode,
    updatedAt: row.updatedAt,
  };
}

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
    where: { workspaceId_provider: { workspaceId: wsCheck.workspaceId, provider: PROVIDER } },
    select: {
      id: true,
      status: true,
      fromEmail: true,
      providerConfig: true,
      lastTestedAt: true,
      lastErrorCode: true,
      updatedAt: true,
    },
  });
  return v1Json(formatCloudflareConnection(row), { budget });
}

export async function PUT(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageConnections");
  if (wsCheck.error) return wsCheck.error;

  if (!process.env.WEBHOOK_SECRET_ENCRYPTION_KEY) {
    return v1Error(
      503,
      "NOT_CONFIGURED",
      "Secret encryption is not configured.",
      undefined,
      budget,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const accountId = typeof body?.accountId === "string" ? body.accountId.trim() : "";
  const apiToken = typeof body?.apiToken === "string" ? body.apiToken.trim() : "";
  const fromEmail = typeof body?.fromEmail === "string" ? body.fromEmail.trim() : "";

  if (!/^[a-f0-9]{32}$/i.test(accountId)) {
    return v1Error(
      400,
      "INVALID_ACCOUNT_ID",
      "Enter a valid 32-char Cloudflare account ID.",
      undefined,
      budget,
    );
  }
  if (
    fromEmail.length > 254 ||
    /[\r\n]/.test(fromEmail) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fromEmail)
  ) {
    return v1Error(400, "INVALID_EMAIL", "Enter a valid sender email address.", undefined, budget);
  }

  const existing = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId: wsCheck.workspaceId, provider: PROVIDER } },
    select: { id: true },
  });
  if (!apiToken && !existing) {
    return v1Error(400, "API_TOKEN_REQUIRED", "Enter a Cloudflare API token.", undefined, budget);
  }
  if (apiToken && (apiToken.length < 20 || apiToken.length > 512 || /\s/.test(apiToken))) {
    return v1Error(
      400,
      "INVALID_API_TOKEN",
      "Enter a valid Cloudflare API token.",
      undefined,
      budget,
    );
  }

  const secret = apiToken ? encryptIntegrationSecret(apiToken) : undefined;
  const connection = await prisma.workspaceIntegration.upsert({
    where: { workspaceId_provider: { workspaceId: wsCheck.workspaceId, provider: PROVIDER } },
    create: {
      workspaceId: wsCheck.workspaceId,
      provider: PROVIDER,
      fromEmail,
      providerConfig: { accountId: accountId.toLowerCase() },
      ...secret,
    },
    update: {
      fromEmail,
      providerConfig: { accountId: accountId.toLowerCase() },
      status: "NEEDS_TEST",
      lastErrorCode: null,
      ...secret,
    },
    select: {
      id: true,
      status: true,
      fromEmail: true,
      providerConfig: true,
      lastTestedAt: true,
      lastErrorCode: true,
      updatedAt: true,
    },
  });

  await recordAuditEvent(prisma, {
    workspaceId: wsCheck.workspaceId,
    userId: authContext.userId,
    action: AUDIT_ACTIONS.CLOUDFLARE_EMAIL_CONNECTED,
    resourceType: "integration",
    resourceName: `Cloudflare Email · ${fromEmail}`,
  });

  return v1Json(formatCloudflareConnection(connection), { budget });
}

export async function DELETE(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageConnections");
  if (wsCheck.error) return wsCheck.error;

  const deleted = await prisma.workspaceIntegration.deleteMany({
    where: { workspaceId: wsCheck.workspaceId, provider: PROVIDER },
  });
  if (deleted.count > 0) {
    await recordAuditEvent(prisma, {
      workspaceId: wsCheck.workspaceId,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.CLOUDFLARE_EMAIL_DISCONNECTED,
      resourceType: "integration",
      resourceName: "Cloudflare Email",
    });
  }
  return v1Json({ disconnected: deleted.count > 0 }, { budget });
}
