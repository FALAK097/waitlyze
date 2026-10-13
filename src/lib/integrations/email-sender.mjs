import { decryptIntegrationSecret } from "./secrets.mjs";

export async function resolveWorkspaceEmailSender(db, workspaceId, fallback) {
  if (!workspaceId) return fallback;
  const connection = await db.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider: "RESEND" } },
  });
  if (!connection || connection.status !== "CONNECTED") return fallback;
  try {
    return { apiKey: decryptIntegrationSecret(connection), fromEmail: connection.fromEmail };
  } catch {
    await db.workspaceIntegration.update({ where: { id: connection.id }, data: { status: "NEEDS_ATTENTION", lastErrorCode: "SECRET_DECRYPTION_FAILED" } });
    return fallback;
  }
}
