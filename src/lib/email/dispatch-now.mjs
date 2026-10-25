import { Resend } from "resend";

import { dispatchPendingOutboxEvents } from "@/lib/email/outbox.mjs";
import { env } from "@/lib/env.mjs";
import { createWorkspaceResendSender } from "@/lib/integrations/resend-sender.mjs";
import prisma from "@/lib/prisma";

// Sends one queued signup verification email inside the signup request, so
// visitors do not depend on an external scheduler. Failures are logged and left
// PENDING/RETRY in the outbox; the signup itself still succeeds.
export async function dispatchVerificationNow(eventKey) {
  if (!eventKey) return;
  try {
    const sendEmail = createWorkspaceResendSender({
      db: prisma,
      defaults: {
        apiKey: env.RESEND_API_KEY,
        fromEmail: env.RESEND_FROM_EMAIL,
        replyTo: env.RESEND_REPLY_TO,
      },
      createClient: (apiKey) => new Resend(apiKey),
    });
    await dispatchPendingOutboxEvents(prisma, { send: sendEmail, eventKeys: [eventKey] });
  } catch (error) {
    console.error("Verification email dispatch failed", error);
  }
}

// Best-effort immediate send for bulk-offboard goodbyes. Only the first page
// goes out inline so a 1,000-recipient batch cannot blow the request budget;
// the scheduler delivers whatever is still pending. Failures stay queued.
export async function dispatchOffboardNow(eventKeys) {
  const keys = [
    ...new Set((eventKeys ?? []).filter((key) => typeof key === "string" && key)),
  ].slice(0, 25);
  if (!keys.length) return;
  try {
    const sendEmail = createWorkspaceResendSender({
      db: prisma,
      defaults: {
        apiKey: env.RESEND_API_KEY,
        fromEmail: env.RESEND_FROM_EMAIL,
        replyTo: env.RESEND_REPLY_TO,
      },
      createClient: (apiKey) => new Resend(apiKey),
    });
    await dispatchPendingOutboxEvents(prisma, {
      send: sendEmail,
      eventKeys: keys,
      batchSize: keys.length,
    });
  } catch (error) {
    console.error("Offboard email dispatch failed", error);
  }
}
