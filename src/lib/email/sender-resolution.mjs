import { resolveWorkspaceEmailSender } from "@/lib/integrations/email-sender.mjs";
import { decryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";

function senderNeedsAttention() {
  throw Object.assign(new Error("Connected email sender needs attention"), {
    code: "SENDER_NEEDS_ATTENTION",
    statusCode: 503,
  });
}

async function resolveWaitlistSender(db, waitListId) {
  const sender = await db.waitlistEmailSender.findUnique({ where: { waitListId } });
  if (!sender) return null;
  // Fail closed: a configured-but-broken per-waitlist sender must never
  // silently fall back to the workspace or deployment sender.
  if (sender.status !== "CONNECTED") senderNeedsAttention();
  try {
    return {
      apiKey: decryptIntegrationSecret(sender),
      fromEmail: sender.fromEmail,
      replyTo: sender.fromEmail,
      source: "waitlist",
    };
  } catch {
    await db.waitlistEmailSender.update({
      where: { id: sender.id },
      data: { status: "NEEDS_ATTENTION", lastErrorCode: "SECRET_DECRYPTION_FAILED" },
    });
    senderNeedsAttention();
  }
}

/**
 * Phase 7c BYOK sender resolution — the single seam every sending path
 * should adopt. Order: per-waitlist sender → workspace connection →
 * deployment default. A configured-but-unusable sender fails closed
 * (throws SENDER_NEEDS_ATTENTION) instead of falling back.
 *
 * TODO (Phase 7c follow-up): thread waitListId through the remaining
 * sending paths so they resolve per-waitlist instead of per-workspace.
 * Still workspace-scoped today:
 * - src/lib/email/outbox.mjs (broadcast + offboard sends; waitList.id is
 *   in scope at both send() call sites — pass waitListId through)
 * - src/lib/email/dispatch-now.mjs
 * - src/app/actions/emails.js (test sends; resolveWorkspaceEmailSender
 *   call should become resolveEmailSender with the waitlist id)
 * - broadcast/automation enqueue paths that snapshot the sender
 */
export async function resolveEmailSender(db, { workspaceId, waitListId, defaults }) {
  if (waitListId) {
    const sender = await resolveWaitlistSender(db, waitListId);
    if (sender) return sender;
  }
  if (workspaceId) {
    const workspace = await resolveWorkspaceEmailSender(db, workspaceId, null);
    if (workspace) return { ...workspace, source: "workspace" };
  }
  return defaults ? { ...defaults, source: "default" } : defaults;
}
