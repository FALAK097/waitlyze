import { NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env.mjs";

export const runtime = "nodejs";

export async function POST(request) {
  if (!env.RESEND_WEBHOOK_SECRET) return NextResponse.json({ message: "Webhook is not configured" }, { status: 503 });
  const payload = await request.text();
  const headers = {
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
  };
  let event;
  try {
    event = new Resend(env.RESEND_API_KEY).webhooks.verify({ payload, headers, webhookSecret: env.RESEND_WEBHOOK_SECRET });
  } catch {
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
  }
  if (!["email.bounced", "email.complained"].includes(event.type)) return NextResponse.json({ received: true });
  const messageId = event.data?.email_id;
  const eventId = headers.id;
  const to = Array.isArray(event.data?.to) ? event.data.to : [event.data?.to];
  if (!eventId || !messageId) return NextResponse.json({ message: "Invalid event payload" }, { status: 400 });
  const isPermanent = event.type === "email.complained" || event.data?.bounce?.type === "Permanent";
  await prisma.emailProviderEvent.upsert({
    where: { providerEventId: eventId },
    create: { providerEventId: eventId, providerMessageId: messageId, type: event.type, isPermanent },
    update: {},
  });
  if (!isPermanent) return NextResponse.json({ received: true });
  const delivery = await prisma.outboxEvent.findFirst({ where: { providerMessageId: messageId }, select: { waitListId: true, payload: true } });
  if (delivery?.waitListId) {
    const waitList = await prisma.waitList.findUnique({ where: { id: delivery.waitListId }, select: { workspaceId: true } });
    const signUpId = typeof delivery.payload?.signUpId === "string" ? delivery.payload.signUpId : null;
    const signUp = signUpId ? await prisma.signUp.findUnique({ where: { id: signUpId }, select: { email: true, emailNormalized: true } }) : null;
    const emailNormalized = (signUp?.emailNormalized || signUp?.email || "").trim().toLowerCase();
    const matchesRecipient = to.some((recipient) => typeof recipient === "string" && recipient.trim().toLowerCase() === emailNormalized);
    if (waitList?.workspaceId && emailNormalized && matchesRecipient) {
      await prisma.emailSuppression.upsert({
        where: { workspaceId_emailNormalized: { workspaceId: waitList.workspaceId, emailNormalized } },
        create: { workspaceId: waitList.workspaceId, emailNormalized, reason: event.type === "email.complained" ? "COMPLAINT" : "BOUNCE" },
        update: { reason: event.type === "email.complained" ? "COMPLAINT" : "BOUNCE" },
      });
    }
  }
  return NextResponse.json({ received: true });
}
