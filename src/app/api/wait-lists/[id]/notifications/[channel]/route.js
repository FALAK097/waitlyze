import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env.mjs";
import {
  isSupportedChatProvider,
  postDiscordMessage,
  postSlackMessage,
  validateChatWebhookUrl,
} from "@/lib/integrations/chat-notifiers.mjs";
import { decryptIntegrationSecret, encryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";
import { webhookAccess } from "@/lib/webhooks/access";
import { AUDIT_ACTIONS, recordWaitlistAuditEvent } from "@/lib/workspaces/audit.mjs";

const safeSelect = {
  id: true,
  waitListId: true,
  provider: true,
  status: true,
  lastTestedAt: true,
  lastErrorCode: true,
  updatedAt: true,
};

function providerOf(channel) {
  const provider = String(channel || "").toUpperCase();
  return isSupportedChatProvider(provider) ? provider : null;
}

// Slack/Discord milestone notifications per waitlist. POST sends a live test
// message through the saved webhook and activates the channel only on
// success - same save-and-test-to-activate contract as email senders.
export async function GET(request, { params }) {
  const { id, channel } = await params;
  const access = await webhookAccess(request, id, "viewCampaign");
  if (access.response) return access.response;
  const provider = providerOf(channel);
  if (!provider)
    return NextResponse.json({ error: "Unknown notification channel." }, { status: 404 });
  const record = await prisma.waitlistNotificationChannel.findUnique({
    where: { waitListId_provider: { waitListId: id, provider } },
    select: safeSelect,
  });
  return NextResponse.json({ data: record }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request, { params }) {
  const { id, channel } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const provider = providerOf(channel);
  if (!provider)
    return NextResponse.json({ error: "Unknown notification channel." }, { status: 404 });
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY)
    return NextResponse.json({ error: "Secret encryption is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    const { url, error } = validateChatWebhookUrl(
      provider,
      typeof body.webhookUrl === "string" ? body.webhookUrl : "",
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    const secret = encryptIntegrationSecret(url);
    const record = await prisma.waitlistNotificationChannel.upsert({
      where: { waitListId_provider: { waitListId: id, provider } },
      create: { waitListId: id, provider, ...secret },
      update: { status: "NEEDS_TEST", lastErrorCode: null, ...secret },
      select: safeSelect,
    });
    const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
    await recordWaitlistAuditEvent(prisma, {
      userId: session?.user?.id || null,
      waitListId: id,
      action: AUDIT_ACTIONS.CHAT_NOTIFICATION_CONNECTED,
      resourceType: "chat_notification",
      resourceName: provider,
    });
    return NextResponse.json({ data: record }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Enter a valid webhook URL." }, { status: 400 });
    return NextResponse.json(
      { error: "Unable to save the notification channel." },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { id, channel } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const provider = providerOf(channel);
  if (!provider)
    return NextResponse.json({ error: "Unknown notification channel." }, { status: 404 });
  await prisma.waitlistNotificationChannel.deleteMany({ where: { waitListId: id, provider } });
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  await recordWaitlistAuditEvent(prisma, {
    userId: session?.user?.id || null,
    waitListId: id,
    action: AUDIT_ACTIONS.CHAT_NOTIFICATION_DISCONNECTED,
    resourceType: "chat_notification",
    resourceName: provider,
  });
  return NextResponse.json({ ok: true });
}

export async function POST(request, { params }) {
  const { id, channel } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const provider = providerOf(channel);
  if (!provider)
    return NextResponse.json({ error: "Unknown notification channel." }, { status: 404 });
  try {
    const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
    await consumePublicBudget(prisma, {
      kind: "chatTest",
      campaignId: id,
      actorId: session?.user?.id,
    });
  } catch (error) {
    if (error instanceof PublicRateLimitError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const record = await prisma.waitlistNotificationChannel.findUnique({
    where: { waitListId_provider: { waitListId: id, provider } },
  });
  if (!record)
    return NextResponse.json({ error: "Save a webhook URL before testing it." }, { status: 409 });
  let url;
  try {
    url = decryptIntegrationSecret(record);
  } catch {
    await prisma.waitlistNotificationChannel.update({
      where: { id: record.id },
      data: { status: "NEEDS_ATTENTION", lastErrorCode: "SECRET_DECRYPTION_FAILED" },
    });
    return NextResponse.json(
      { error: "The channel needs attention. Save it again and retest." },
      { status: 503 },
    );
  }
  const now = new Date();
  try {
    const post = provider === "SLACK" ? postSlackMessage : postDiscordMessage;
    await post(url, "Waitlyze test: milestone notifications for this waitlist will arrive here.");
    const updated = await prisma.waitlistNotificationChannel.updateMany({
      where: {
        id: record.id,
        status: record.status,
        secretCiphertext: record.secretCiphertext,
        secretIv: record.secretIv,
        secretTag: record.secretTag,
      },
      data: { status: "CONNECTED", lastTestedAt: now, lastErrorCode: null },
    });
    if (!updated.count)
      return NextResponse.json(
        { error: "The channel changed while it was being tested. Save and test it again." },
        { status: 409 },
      );
    return NextResponse.json(
      { data: { status: "CONNECTED", lastTestedAt: now } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    await prisma.waitlistNotificationChannel.updateMany({
      where: { id: record.id },
      data: { status: "NEEDS_ATTENTION", lastTestedAt: now, lastErrorCode: "DELIVERY_FAILED" },
    });
    return NextResponse.json(
      { error: "The test message could not be delivered. Check the webhook URL and try again." },
      { status: 502 },
    );
  }
}
