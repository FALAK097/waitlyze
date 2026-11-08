import { resolveWorkspaceEmailSender } from "@/lib/integrations/email-sender.mjs";
import { decryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";

function senderNeedsAttention() {
  throw Object.assign(new Error("Connected email sender needs attention"), {
    code: "SENDER_NEEDS_ATTENTION",
    statusCode: 503,
  });
}

export class CustomerSenderNotConnectedError extends Error {
  constructor() {
    super("Connect a Resend sender to this workspace before sending email to subscribers.");
    this.name = "CustomerSenderNotConnectedError";
    this.code = "CUSTOMER_SENDER_NOT_CONNECTED";
    this.statusCode = 424;
  }
}

async function resolveWaitlistSender(db, waitListId) {
  const sender = await db.waitlistEmailSender.findUnique({ where: { waitListId } });
  if (!sender) return null;
  // NEEDS_TEST stays dormant until verification succeeds, so a connected
  // workspace sender can serve this waitlist. A configured-but-broken sender
  // always fails closed.
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
 * Resolve customer mail only through a connected waitlist or workspace sender.
 * Waitlyze's deployment sender is deliberately not a fallback for subscribers.
 *
 * Founder notices remain on the platform sender by design; subscriber mail
 * and campaign test sends supply the waitlist id at the send boundary.
 */
export async function resolveEmailSender(db, { workspaceId, waitListId }) {
  if (waitListId) {
    const sender = await resolveWaitlistSender(db, waitListId);
    if (sender) return sender;
  }
  if (workspaceId) {
    const workspace = await resolveWorkspaceEmailSender(db, workspaceId, null);
    if (workspace) return { ...workspace, source: "workspace" };
  }
  throw new CustomerSenderNotConnectedError();
}

export async function hasCustomerEmailSender(db, { workspaceId, waitListId }) {
  try {
    await resolveEmailSender(db, { workspaceId, waitListId });
    return true;
  } catch (error) {
    if (
      error instanceof CustomerSenderNotConnectedError ||
      error?.code === "SENDER_NEEDS_ATTENTION"
    )
      return false;
    throw error;
  }
}
