import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env.mjs";
import { dispatchPendingOutboxEvents } from "@/lib/email/outbox.mjs";
import { createWorkspaceResendSender } from "@/lib/integrations/resend-sender.mjs";

// Sends one queued signup verification email inside the signup request, so
// visitors do not depend on an external scheduler. Failures are logged and left
// PENDING/RETRY in the outbox; the signup itself still succeeds.
export async function dispatchVerificationNow(eventKey) {
  if (!eventKey) return;
  try {
    const sendEmail = createWorkspaceResendSender({
      db: prisma,
      defaults: { apiKey: env.RESEND_API_KEY, fromEmail: env.RESEND_FROM_EMAIL, replyTo: env.RESEND_REPLY_TO },
      createClient: (apiKey) => new Resend(apiKey),
    });
    await dispatchPendingOutboxEvents(prisma, { send: sendEmail, eventKeys: [eventKey] });
  } catch (error) {
    console.error("Verification email dispatch failed", error);
  }
}
