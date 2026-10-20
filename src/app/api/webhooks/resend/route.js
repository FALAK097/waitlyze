import { NextResponse } from "next/server";
import { Resend } from "resend";

import { recordVerifiedProviderEvent } from "@/lib/email/suppression.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  if (!env.RESEND_WEBHOOK_SECRET)
    return NextResponse.json({ message: "Webhook is not configured" }, { status: 503 });
  const payload = await request.text();
  const headers = {
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
  };
  let event;
  try {
    event = new Resend(env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers,
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    });
  } catch {
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
  }
  if (!["email.bounced", "email.complained"].includes(event.type))
    return NextResponse.json({ received: true });
  try {
    await recordVerifiedProviderEvent(prisma, event, headers.id);
  } catch (error) {
    if (error instanceof TypeError)
      return NextResponse.json({ message: "Invalid event payload" }, { status: 400 });
    throw error;
  }
  return NextResponse.json({ received: true });
}
