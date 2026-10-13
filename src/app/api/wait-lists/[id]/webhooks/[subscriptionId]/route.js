import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { webhookAccess } from "@/lib/webhooks/access";
import { validateWebhookUrl } from "@/lib/webhooks/security.mjs";

const EVENTS = new Set(["signup.created", "signup.verified"]);

export async function PATCH(request, { params }) {
  const { id, subscriptionId } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  try {
    const body = await request.json();
    const current = await prisma.webhookSubscription.findFirst({ where: { id: subscriptionId, waitListId: id }, select: { id: true } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = {};
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 80) return NextResponse.json({ error: "Invalid endpoint name." }, { status: 400 });
      data.name = body.name.trim();
    }
    if (body.url !== undefined) data.url = validateWebhookUrl(body.url).url.toString();
    if (body.events !== undefined) {
      if (!Array.isArray(body.events) || !body.events.length || body.events.length > EVENTS.size || body.events.some((event) => !EVENTS.has(event))) return NextResponse.json({ error: "Choose at least one supported event." }, { status: 400 });
      data.eventTypes = body.events;
    }
    if (body.enabled !== undefined) {
      if (typeof body.enabled !== "boolean") return NextResponse.json({ error: "Invalid enabled state." }, { status: 400 });
      data.enabled = body.enabled;
    }
    await prisma.$transaction(async (tx) => {
      await tx.webhookSubscription.update({ where: { id: subscriptionId }, data });
      if (data.enabled === true) await tx.webhookDelivery.updateMany({ where: { subscriptionId, status: "PAUSED" }, data: { status: "PENDING", availableAt: new Date(), lastErrorCode: null } });
      if (data.enabled === false) await tx.webhookDelivery.updateMany({ where: { subscriptionId, status: "PENDING" }, data: { status: "PAUSED" } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error.message || "Unable to update endpoint." }, { status: 400 }); }
}
