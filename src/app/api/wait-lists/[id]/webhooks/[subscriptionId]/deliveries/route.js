import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { webhookAccess } from "@/lib/webhooks/access";

export async function POST(request, { params }) {
  const { id, subscriptionId } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const { deliveryId } = await request.json();
  if (typeof deliveryId !== "string") return NextResponse.json({ error: "Invalid delivery." }, { status: 400 });
  const delivery = await prisma.webhookDelivery.findFirst({ where: { id: deliveryId, subscriptionId, subscription: { waitListId: id } }, select: { id: true, status: true, subscription: { select: { enabled: true } } } });
  if (!delivery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (delivery.status !== "FAILED") return NextResponse.json({ error: "Only failed deliveries can be replayed." }, { status: 409 });
  if (!delivery.subscription.enabled) return NextResponse.json({ error: "Enable this endpoint before replaying." }, { status: 409 });
  const result = await prisma.webhookDelivery.updateMany({ where: { id: deliveryId, status: "FAILED" }, data: { status: "PENDING", attempts: 0, replayCount: { increment: 1 }, availableAt: new Date(), lockedAt: null, processedAt: null, deliveredAt: null, responseStatus: null, lastErrorCode: null } });
  return NextResponse.json({ ok: result.count === 1 }, { status: result.count === 1 ? 202 : 409 });
}
