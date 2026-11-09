import { decryptIntegrationSecret } from "./secrets.mjs";

export async function resolveWorkspaceEmailSender(db, workspaceId, fallback) {
  if (!workspaceId) return fallback;
  const connection = await db.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider: "RESEND" } },
  });
  if (!connection) return fallback;
  // Once a workspace chooses its own sender, a broken connection must not
  // silently switch campaigns back to the platform's From address.
  if (connection.status !== "CONNECTED")
    throw Object.assign(new Error("Connected email sender needs attention"), {
      code: "SENDER_NEEDS_ATTENTION",
      statusCode: 503,
    });
  try {
    return {
      provider: "RESEND",
      apiKey: decryptIntegrationSecret(connection),
      fromEmail: connection.fromEmail,
      replyTo: connection.fromEmail,
    };
  } catch {
    await db.workspaceIntegration.update({
      where: { id: connection.id },
      data: { status: "NEEDS_ATTENTION", lastErrorCode: "SECRET_DECRYPTION_FAILED" },
    });
    throw Object.assign(new Error("Connected email sender needs attention"), {
      code: "SENDER_NEEDS_ATTENTION",
      statusCode: 503,
    });
  }
}

/** Cloudflare Email Sending BYOK is used only by transactional sending paths. */
export async function resolveWorkspaceCloudflareEmailSender(db, workspaceId) {
  if (!workspaceId) return null;
  const connection = await db.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider: "CLOUDFLARE_EMAIL" } },
  });
  if (!connection) return null;
  // A saved-but-untested connection stays dormant so verification falls back
  // to the workspace Resend or platform sender while setup is in progress.
  // A configured-but-broken connection still fails closed.
  if (connection.status === "NEEDS_TEST") return null;
  if (connection.status !== "CONNECTED")
    throw Object.assign(new Error("Connected Cloudflare email sender needs attention"), {
      code: "SENDER_NEEDS_ATTENTION",
      statusCode: 503,
    });
  const accountId =
    connection.providerConfig && typeof connection.providerConfig === "object"
      ? connection.providerConfig.accountId
      : null;
  if (typeof accountId !== "string" || !accountId)
    throw Object.assign(new Error("Connected Cloudflare email sender needs attention"), {
      code: "SENDER_NEEDS_ATTENTION",
      statusCode: 503,
    });
  try {
    return {
      provider: "CLOUDFLARE_EMAIL",
      apiToken: decryptIntegrationSecret(connection),
      accountId,
      fromEmail: connection.fromEmail,
      replyTo: connection.fromEmail,
      source: "workspace-cloudflare",
    };
  } catch {
    await db.workspaceIntegration.update({
      where: { id: connection.id },
      data: { status: "NEEDS_ATTENTION", lastErrorCode: "SECRET_DECRYPTION_FAILED" },
    });
    throw Object.assign(new Error("Connected Cloudflare email sender needs attention"), {
      code: "SENDER_NEEDS_ATTENTION",
      statusCode: 503,
    });
  }
}
