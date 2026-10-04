import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env.mjs";
import { webhookAccess } from "@/lib/webhooks/access";
import { createWebhookSecret, encryptSecret } from "@/lib/webhooks/security.mjs";

export async function POST(request, { params }) {
  const { id, subscriptionId } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) return NextResponse.json({ error: "Webhook secret encryption is not configured." }, { status: 503 });
  const existing = await prisma.webhookSubscription.findFirst({ where: { id: subscriptionId, waitListId: id }, select: { id: true, secretCiphertext: true, secretIv: true, secretTag: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const secret = createWebhookSecret(), encrypted = encryptSecret(secret);
  const now = new Date();
  const data = { secretCiphertext: encrypted.ciphertext, secretIv: encrypted.iv, secretTag: encrypted.tag, previousSecretCiphertext: existing.secretCiphertext, previousSecretIv: existing.secretIv, previousSecretTag: existing.secretTag, previousSecretValidUntil: new Date(now.getTime() + 24 * 60 * 60_000) };
  await prisma.webhookSubscription.update({ where: { id: subscriptionId }, data });
  return NextResponse.json({ data: { secret, previousSecretValidUntil: data.previousSecretValidUntil } }, { headers: { "Cache-Control": "no-store" } });
}
