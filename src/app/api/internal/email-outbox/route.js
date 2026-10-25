import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { Resend } from "resend";

import { dispatchPendingOutboxEvents } from "@/lib/email/outbox.mjs";
import { createPlatformSender } from "@/lib/emails/platform.mjs";
import { env } from "@/lib/env.mjs";
import { createWorkspaceResendSender } from "@/lib/integrations/resend-sender.mjs";
import prisma from "@/lib/prisma";
import { dispatchPendingWebhooks } from "@/lib/webhooks/delivery.mjs";

export const runtime = "nodejs";

function authorized(request) {
  const secret = env.OUTBOX_DISPATCH_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || !/^Bearer\s+/i.test(request.headers.get("authorization") || "")) return false;
  const suppliedBytes = Buffer.from(supplied);
  const secretBytes = Buffer.from(secret);
  return suppliedBytes.length === secretBytes.length && timingSafeEqual(suppliedBytes, secretBytes);
}

export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const sendEmail = createWorkspaceResendSender({
    db: prisma,
    defaults: {
      apiKey: env.RESEND_API_KEY,
      fromEmail: env.RESEND_FROM_EMAIL,
      replyTo: env.RESEND_REPLY_TO,
    },
    createClient: (apiKey) => new Resend(apiKey),
  });
  const result = await dispatchPendingOutboxEvents(prisma, {
    send: sendEmail,
    sendPlatform: createPlatformSender(),
  });
  const webhooks = await dispatchPendingWebhooks(prisma);
  return NextResponse.json({ ...result, webhooks });
}
