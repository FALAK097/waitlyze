import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env.mjs";
import { dispatchPendingOutboxEvents } from "@/lib/email/outbox.mjs";
import { dispatchPendingWebhooks } from "@/lib/webhooks/delivery.mjs";
import { createWorkspaceResendSender } from "@/lib/integrations/resend-sender.mjs";

export const runtime = "nodejs";

function authorized(request) {
  const secret = env.OUTBOX_DISPATCH_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || supplied.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
}

export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const sendEmail = createWorkspaceResendSender({ db: prisma, defaults: { apiKey: env.RESEND_API_KEY, fromEmail: env.RESEND_FROM_EMAIL, replyTo: env.RESEND_REPLY_TO }, createClient: (apiKey) => new Resend(apiKey) });
  const result = await dispatchPendingOutboxEvents(prisma, {
    send: sendEmail,
  });
  const webhooks = await dispatchPendingWebhooks(prisma);
  return NextResponse.json({ ...result, webhooks });
}
