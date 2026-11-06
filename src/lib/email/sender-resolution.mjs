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
  // NEEDS_TEST stays dormant: fall back to the workspace or deployment
  // sender until a test succeeds (see content/docs/resend.mdx). Fail closed
  // only for a configured-but-broken sender, which must never silently fall
  // back.
  if (sender.status === "NEEDS_TEST") return null;
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
 * Phase 7c BYOK sender resolution - the single seam every sending path
 * should adopt. Order: per-waitlist sender → workspace connection →
 * deployment default. A broken sender fails closed
 * (throws SENDER_NEEDS_ATTENTION) instead of falling back; a NEEDS_TEST
 * sender stays dormant and falls back until its test succeeds.
 *
 * Founder notices remain on the platform sender by design; subscriber mail
 * and campaign test sends supply the waitlist id at the send boundary.
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
