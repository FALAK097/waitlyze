import { NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env.mjs";
import { decryptWebhookSecret } from "@/lib/integrations/secrets.mjs";
import { recordVerifiedProviderEvent, WebhookWorkspaceMismatchError } from "@/lib/email/suppression.mjs";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const { workspaceId } = await params;
  if (typeof workspaceId !== "string" || workspaceId.length > 128) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const connection = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider: "RESEND" } },
  });
  if (!connection?.webhookSecretCiphertext) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const headers = {
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
  };
  let event;
  try {
    event = new Resend(env.RESEND_API_KEY).webhooks.verify({ payload: await request.text(), headers, webhookSecret: decryptWebhookSecret(connection) });
  } catch {
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
  }
  if (!["email.bounced", "email.complained"].includes(event.type)) return NextResponse.json({ received: true });
  try {
    await recordVerifiedProviderEvent(prisma, event, headers.id, workspaceId);
  } catch (error) {
    // A provider account shared by several workspaces delivers each event to
    // every endpoint. Acknowledge the other workspaces' events with 2xx so the
    // provider does not retry and disable the endpoint.
    if (error instanceof WebhookWorkspaceMismatchError) return NextResponse.json({ received: true, ignored: true });
    if (error instanceof TypeError) return NextResponse.json({ message: "Invalid event payload" }, { status: 400 });
    throw error;
  }
  return NextResponse.json({ received: true });
}
