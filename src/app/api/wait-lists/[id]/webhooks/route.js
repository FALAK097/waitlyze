import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env.mjs";
import { webhookAccess } from "@/lib/webhooks/access";
import { createWebhookSecret, encryptSecret, validateWebhookUrl } from "@/lib/webhooks/security.mjs";

const EVENTS = new Set(["signup.created", "signup.verified"]);
const select = { id: true, name: true, url: true, eventTypes: true, enabled: true, createdAt: true, lastDeliveredAt: true, deliveries: { select: { id: true, eventType: true, status: true, attempts: true, responseStatus: true, lastErrorCode: true, createdAt: true, deliveredAt: true }, orderBy: { createdAt: "desc" }, take: 10 } };

export async function GET(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id, "viewCampaign");
  if (access.response) return access.response;
  const rows = await prisma.webhookSubscription.findMany({ where: { waitListId: id }, select, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ data: rows.map((row) => ({ ...row, url: validateWebhookUrl(row.url).safeUrl })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) return NextResponse.json({ error: "Webhook secret encryption is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 80) return NextResponse.json({ error: "Give this endpoint a name (up to 80 characters)." }, { status: 400 });
    if (!Array.isArray(body.events) || !body.events.length || body.events.length > EVENTS.size || body.events.some((event) => !EVENTS.has(event))) return NextResponse.json({ error: "Choose at least one supported event." }, { status: 400 });
    const { url, safeUrl } = validateWebhookUrl(body.url);
    const secret = createWebhookSecret();
    const encrypted = encryptSecret(secret);
    const subscription = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "wait_lists" WHERE "id" = ${id} FOR UPDATE`;
      if (await tx.webhookSubscription.count({ where: { waitListId: id } }) >= 5) {
        const error = new Error("A waitlist can have up to five webhook endpoints.");
        error.status = 409;
        throw error;
      }
      return tx.webhookSubscription.create({ data: { waitListId: id, name: body.name.trim(), url: url.toString(), eventTypes: body.events, ...Object.fromEntries(Object.entries(encrypted).map(([key, value]) => [`secret${key[0].toUpperCase()}${key.slice(1)}`, value])) }, select: { id: true, name: true, url: true, eventTypes: true, enabled: true, createdAt: true } });
    });
    return NextResponse.json({ data: { ...subscription, url: safeUrl, secret } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create webhook endpoint." }, { status: error.status || 400 });
  }
}
