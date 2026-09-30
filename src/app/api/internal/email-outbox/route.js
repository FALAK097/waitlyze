import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env.mjs";
import { dispatchPendingOutboxEvents } from "@/lib/email/outbox.mjs";

export const runtime = "nodejs";

function authorized(request) {
  const secret = env.OUTBOX_DISPATCH_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || supplied.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
}

export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const resend = new Resend(env.RESEND_API_KEY);
  const result = await dispatchPendingOutboxEvents(prisma, {
    send: ({ to, subject, html, headers, idempotencyKey }) => resend.emails.send({ from: env.RESEND_FROM_EMAIL, to, subject, replyTo: env.RESEND_REPLY_TO, html, ...(headers ? { headers } : {}) }, { idempotencyKey }),
  });
  return NextResponse.json(result);
}
