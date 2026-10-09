import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { webhookAccess } from "@/lib/webhooks/access";

export async function POST(request, { params }) {
  const { id, subscriptionId } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const subscription = await prisma.webhookSubscription.findFirst({ where: { id: subscriptionId, waitListId: id }, select: { id: true, enabled: true } });
  if (!subscription) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!subscription.enabled) return NextResponse.json({ error: "Enable this endpoint before sending a test." }, { status: 409 });
  const eventId = randomUUID(), now = new Date();
  const payload = { id: eventId, type: "signup.created", version: 1, occurredAt: now.toISOString(), waitlistId: id, data: { test: true } };
  const delivery = await prisma.webhookDelivery.create({ data: { subscriptionId, eventId, eventKey: `${subscriptionId}:${eventId}`, eventType: "signup.created", payload } });
  return NextResponse.json({ data: { id: delivery.id, status: delivery.status } }, { status: 202, headers: { "Cache-Control": "no-store" } });
}
