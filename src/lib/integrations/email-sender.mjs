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
