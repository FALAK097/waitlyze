import { NextResponse } from "next/server";
import { Resend } from "resend";

import {
  recordVerifiedProviderEvent,
  WebhookWorkspaceMismatchError,
} from "@/lib/email/suppression.mjs";
import { decryptWebhookSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

async function readLimitedText(request, maxBytes) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

export async function POST(request, { params }) {
  const { workspaceId } = await params;
  if (typeof workspaceId !== "string" || workspaceId.length > 128)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  const connection = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider: "RESEND" } },
  });
  if (!connection?.webhookSecretCiphertext)
    return NextResponse.json({ message: "Not found" }, { status: 404 });

  const payload = await readLimitedText(request, MAX_WEBHOOK_BODY_BYTES);
  if (payload === null)
    return NextResponse.json({ message: "Webhook payload too large" }, { status: 413 });

  const headers = {
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
  };
  let event;
  try {
    event = new Resend("re_webhook_signature_only").webhooks.verify({
      payload,
      headers,
      webhookSecret: decryptWebhookSecret(connection),
    });
  } catch {
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
  }
  if (!["email.bounced", "email.complained"].includes(event.type))
    return NextResponse.json({ received: true });
  try {
    await recordVerifiedProviderEvent(prisma, event, headers.id, workspaceId);
  } catch (error) {
    // A provider account shared by several workspaces delivers each event to
    // every endpoint. Acknowledge the other workspaces' events with 2xx so the
    // provider does not retry and disable the endpoint.
    if (error instanceof WebhookWorkspaceMismatchError)
      return NextResponse.json({ received: true, ignored: true });
    if (error instanceof TypeError)
      return NextResponse.json({ message: "Invalid event payload" }, { status: 400 });
    throw error;
  }
  return NextResponse.json({ received: true });
}
