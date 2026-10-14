import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env.mjs";
import { webhookAccess } from "@/lib/webhooks/access";
import { decryptSecret } from "@/lib/webhooks/security.mjs";

export async function POST(request, { params }) {
  const { id, subscriptionId } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) return NextResponse.json({ error: "Webhook secret encryption is not configured." }, { status: 503 });
  const existing = await prisma.webhookSubscription.findFirst({ where: { id: subscriptionId, waitListId: id }, select: { secretCiphertext: true, secretIv: true, secretTag: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const secret = decryptSecret({ ciphertext: existing.secretCiphertext, iv: existing.secretIv, tag: existing.secretTag });
    return NextResponse.json({ data: { secret } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The signing secret could not be read." }, { status: 500 });
  }
}
