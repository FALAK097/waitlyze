import { Resend } from "resend";
import { env } from "@/lib/env.mjs";

// Platform email: always sent from Waitlyze's own verified sender. Use this for
// product emails that must deliver regardless of a workspace's own integration
// (workspace invitations, welcome, account notices). Subscriber/campaign email
// uses the workspace's connected provider via createWorkspaceResendSender.
let client;

/** Reuses a single Resend client for platform-sent product email. */
function getClient() {
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

/** Sends platform email with an optional reply address and file attachments. */
export async function sendPlatformEmail({ to, subject, html, replyTo, idempotencyKey, attachments }) {
  const resend = getClient();
  const { error } = await resend.emails.send(
    {
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      replyTo: replyTo || env.RESEND_REPLY_TO,
      html,
      ...(attachments?.length ? { attachments } : {}),
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) throw new Error(`Platform email rejected: ${error.name || "provider error"}`);
  return true;
}
