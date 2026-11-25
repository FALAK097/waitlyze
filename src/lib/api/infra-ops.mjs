import { randomUUID } from "node:crypto";

import { Resend } from "resend";

import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import { parseJsonStringArray, serializeJsonStringArray } from "@/lib/db/sqlite-helpers.mjs";
import {
  createCloudflareHostname,
  deleteCloudflareHostname,
  getCloudflareHostname,
  normalizeDomain,
} from "@/lib/domains/provider.mjs";
import {
  CustomerSenderNotConnectedError,
  resolveEmailSender,
} from "@/lib/email/sender-resolution.mjs";
import { env } from "@/lib/env.mjs";
import {
  CHAT_TRIGGERS,
  isSupportedChatProvider,
  postDiscordMessage,
  postSlackMessage,
  validateChatWebhookUrl,
  validChatTriggers,
} from "@/lib/integrations/chat-notifiers.mjs";
import { listResendDomains } from "@/lib/integrations/resend-domains.mjs";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
  encryptWebhookSecret,
} from "@/lib/integrations/secrets.mjs";
import { updateResendTestResult } from "@/lib/integrations/test-result.mjs";
import prisma from "@/lib/prisma.js";
import { isSupportedWebhookEvent, WEBHOOK_EVENT_TYPES } from "@/lib/webhooks/delivery.mjs";
import {
  createWebhookSecret,
  encryptSecret,
  validateWebhookUrl,
} from "@/lib/webhooks/security.mjs";
import { sampleWebhookSubscriber } from "@/lib/webhooks/subscriber.mjs";
import {
  AUDIT_ACTIONS,
  recordAuditEvent,
  recordWaitlistAuditEvent,
} from "@/lib/workspaces/audit.mjs";

export function formatSafeDomain(row) {
  if (!row) return null;
  const hasCloudflareHostname = Boolean(row.providerId);
  return {
    id: row.id,
    hostname: row.hostname,
    status: hasCloudflareHostname ? row.status : row.status === "ACTIVE" ? "NEEDS_DNS" : row.status,
    verification: hasCloudflareHostname ? row.verification : [],
    dnsRecords: hasCloudflareHostname
      ? row.dnsRecords
      : [
          {
            type: "CNAME",
            name: row.hostname,
            value: process.env.CLOUDFLARE_CUSTOM_HOSTNAME_TARGET || "customers.waitlyze.com",
          },
        ],
    lastCheckedAt: row.lastCheckedAt,
    lastErrorCode: row.lastErrorCode,
  };
}

export async function connectCustomDomainOp({ waitlist, rawHostname }) {
  const hostname = normalizeDomain(rawHostname);
  if (await prisma.customDomain.findUnique({ where: { waitListId: waitlist.id } })) {
    throw Object.assign(new Error("Remove the current domain before connecting another."), {
      status: 409,
    });
  }
  if (!waitlist.workspaceId) {
    throw Object.assign(new Error("This waitlist is not in a workspace."), { status: 409 });
  }
  const entitlements = await getWorkspaceEntitlements(prisma, waitlist.workspaceId);
  if (!entitlements.customDomains) {
    throw Object.assign(
      new Error("Custom domains are a Pro feature. Upgrade this workspace to connect a domain."),
      { status: 402 },
    );
  }
  const reserved = await prisma.customDomain.create({
    data: {
      hostname,
      workspaceId: waitlist.workspaceId,
      waitListId: waitlist.id,
      status: "NEEDS_DNS",
    },
  });
  let current;
  try {
    await deleteCloudflareHostname({ providerId: null, hostname });
    current = await createCloudflareHostname(hostname);
  } catch (error) {
    await prisma.customDomain.delete({ where: { id: reserved.id } });
    throw error;
  }
  const row = await prisma.customDomain.update({
    where: { id: reserved.id },
    data: {
      providerId: current.id,
      status: current.status,
      verification: current.verification,
      dnsRecords: current.dnsRecords,
    },
  });
  return formatSafeDomain(row);
}

export async function verifyCustomDomainOp(waitlistId) {
  const existing = await prisma.customDomain.findUnique({ where: { waitListId: waitlistId } });
  if (!existing) throw Object.assign(new Error("No domain is connected."), { status: 404 });
  let current = await getCloudflareHostname({
    providerId: existing.providerId,
    hostname: existing.hostname,
  });
  if (!current) current = await createCloudflareHostname(existing.hostname);
  const domain = await prisma.customDomain.update({
    where: { id: existing.id },
    data: {
      providerId: current.id,
      status: current.status,
      verification: current.verification,
      dnsRecords: current.dnsRecords,
      lastCheckedAt: new Date(),
      lastErrorCode: null,
    },
  });
  return formatSafeDomain(domain);
}

export async function removeCustomDomainOp(waitlistId) {
  const existing = await prisma.customDomain.findUnique({ where: { waitListId: waitlistId } });
  if (!existing) throw Object.assign(new Error("No domain is connected."), { status: 404 });
  await deleteCloudflareHostname({
    providerId: existing.providerId,
    hostname: existing.hostname,
  });
  await prisma.customDomain.delete({ where: { id: existing.id } });
  return { deleted: true, hostname: existing.hostname };
}

export function formatSafeWebhook(sub) {
  if (!sub) return null;
  let safeUrl = sub.url;
  try {
    const parsed = new URL(sub.url);
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    safeUrl = parsed.toString();
  } catch {
    // Keep original string if URL parsing fails
  }
  return {
    id: sub.id,
    name: sub.name,
    url: safeUrl,
    eventTypes: parseJsonStringArray(sub.eventTypes),
    enabled: sub.enabled,
    includeSubscriberData: sub.includeSubscriberData,
    lastDeliveredAt: sub.lastDeliveredAt ?? null,
    createdAt: sub.createdAt,
  };
}

export async function createWebhookSubscriptionOp({
  waitlistId,
  name,
  url,
  events,
  includeSubscriberData = false,
}) {
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) {
    throw Object.assign(new Error("Webhook secret encryption is not configured."), { status: 503 });
  }
  if (typeof name !== "string" || !name.trim() || name.length > 80) {
    throw new TypeError("Give this endpoint a name (up to 80 characters).");
  }
  if (
    !Array.isArray(events) ||
    !events.length ||
    events.length > WEBHOOK_EVENT_TYPES.length ||
    events.some((event) => !isSupportedWebhookEvent(event))
  ) {
    throw new TypeError(`Choose supported events: ${WEBHOOK_EVENT_TYPES.join(", ")}.`);
  }
  const { url: validatedUrl, safeUrl } = validateWebhookUrl(url);
  if ((await prisma.webhookSubscription.count({ where: { waitListId: waitlistId } })) >= 5) {
    throw Object.assign(new Error("A waitlist can have up to five webhook endpoints."), {
      status: 409,
    });
  }
  const secret = createWebhookSecret();
  const encrypted = encryptSecret(secret);
  const sub = await prisma.webhookSubscription.create({
    data: {
      waitListId: waitlistId,
      name: name.trim(),
      url: validatedUrl.toString(),
      eventTypes: serializeJsonStringArray(events, ["signup.created"]),
      includeSubscriberData: Boolean(includeSubscriberData),
      ...Object.fromEntries(
        Object.entries(encrypted).map(([key, value]) => [
          `secret${key[0].toUpperCase()}${key.slice(1)}`,
          value,
        ]),
      ),
    },
    select: {
      id: true,
      name: true,
      url: true,
      eventTypes: true,
      enabled: true,
      includeSubscriberData: true,
      createdAt: true,
    },
  });
  return {
    ...sub,
    eventTypes: parseJsonStringArray(sub.eventTypes),
    url: safeUrl,
    secret,
  };
}

export async function updateWebhookSubscriptionOp({ waitlistId, subscriptionId, updates }) {
  const current = await prisma.webhookSubscription.findFirst({
    where: { id: subscriptionId, waitListId: waitlistId },
    select: { id: true },
  });
  if (!current) throw Object.assign(new Error("Webhook subscription not found."), { status: 404 });
  const data = {};
  if (updates.name !== undefined) {
    if (typeof updates.name !== "string" || !updates.name.trim() || updates.name.length > 80) {
      throw new TypeError("Invalid endpoint name.");
    }
    data.name = updates.name.trim();
  }
  if (updates.url !== undefined) data.url = validateWebhookUrl(updates.url).url.toString();
  if (updates.events !== undefined) {
    if (
      !Array.isArray(updates.events) ||
      !updates.events.length ||
      updates.events.some((event) => !isSupportedWebhookEvent(event))
    ) {
      throw new TypeError("Choose at least one supported event.");
    }
    data.eventTypes = serializeJsonStringArray(updates.events, ["signup.created"]);
  }
  if (updates.enabled !== undefined) data.enabled = Boolean(updates.enabled);
  if (updates.includeSubscriberData !== undefined)
    data.includeSubscriberData = Boolean(updates.includeSubscriberData);

  await prisma.$transaction([
    prisma.webhookSubscription.update({ where: { id: subscriptionId }, data }),
    ...(data.enabled === true
      ? [
          prisma.webhookDelivery.updateMany({
            where: { subscriptionId, status: "PAUSED" },
            data: { status: "PENDING", availableAt: new Date(), lastErrorCode: null },
          }),
        ]
      : []),
    ...(data.enabled === false
      ? [
          prisma.webhookDelivery.updateMany({
            where: { subscriptionId, status: "PENDING" },
            data: { status: "PAUSED" },
          }),
        ]
      : []),
  ]);
  return { updated: true };
}

export async function testWebhookSubscriptionOp({ waitlistId, subscriptionId }) {
  const subscription = await prisma.webhookSubscription.findFirst({
    where: { id: subscriptionId, waitListId: waitlistId },
    select: { id: true, enabled: true, includeSubscriberData: true },
  });
  if (!subscription) throw Object.assign(new Error("Webhook not found."), { status: 404 });
  if (!subscription.enabled) {
    throw Object.assign(new Error("Enable this endpoint before sending a test."), { status: 409 });
  }
  const eventId = randomUUID();
  const now = new Date();
  const payload = {
    id: eventId,
    type: "signup.created",
    version: 1,
    occurredAt: now.toISOString(),
    waitlistId,
    data: {
      test: true,
      ...(subscription.includeSubscriberData ? { subscriber: sampleWebhookSubscriber() } : {}),
    },
  };
  const delivery = await prisma.webhookDelivery.create({
    data: {
      subscriptionId,
      eventId,
      eventKey: `${subscriptionId}:${eventId}`,
      eventType: "signup.created",
      payload,
    },
  });
  return { id: delivery.id, status: delivery.status };
}

export async function rotateWebhookSecretOp({ waitlistId, subscriptionId }) {
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) {
    throw Object.assign(new Error("Webhook secret encryption is not configured."), { status: 503 });
  }
  const existing = await prisma.webhookSubscription.findFirst({
    where: { id: subscriptionId, waitListId: waitlistId },
    select: { id: true, secretCiphertext: true, secretIv: true, secretTag: true },
  });
  if (!existing) throw Object.assign(new Error("Webhook not found."), { status: 404 });
  const secret = createWebhookSecret();
  const encrypted = encryptSecret(secret);
  const previousSecretValidUntil = new Date(Date.now() + 24 * 60 * 60_000);
  await prisma.webhookSubscription.update({
    where: { id: subscriptionId },
    data: {
      secretCiphertext: encrypted.ciphertext,
      secretIv: encrypted.iv,
      secretTag: encrypted.tag,
      previousSecretCiphertext: existing.secretCiphertext,
      previousSecretIv: existing.secretIv,
      previousSecretTag: existing.secretTag,
      previousSecretValidUntil,
    },
  });
  return { secret, previousSecretValidUntil };
}

export async function replayWebhookDeliveryOp({ waitlistId, subscriptionId, deliveryId }) {
  const delivery = await prisma.webhookDelivery.findFirst({
    where: { id: deliveryId, subscriptionId, subscription: { waitListId: waitlistId } },
    select: { id: true, status: true, subscription: { select: { enabled: true } } },
  });
  if (!delivery) throw Object.assign(new Error("Delivery not found."), { status: 404 });
  if (delivery.status !== "FAILED") {
    throw Object.assign(new Error("Only failed deliveries can be replayed."), { status: 409 });
  }
  if (!delivery.subscription.enabled) {
    throw Object.assign(new Error("Enable this endpoint before replaying."), { status: 409 });
  }
  const result = await prisma.webhookDelivery.updateMany({
    where: { id: deliveryId, status: "FAILED" },
    data: {
      status: "PENDING",
      attempts: 0,
      replayCount: { increment: 1 },
      availableAt: new Date(),
      lockedAt: null,
      processedAt: null,
      deliveredAt: null,
      responseStatus: null,
      lastErrorCode: null,
    },
  });
  return { replayed: result.count === 1 };
}

export async function getWaitlistEmailSenderOp(waitlist) {
  const sender = await prisma.waitlistEmailSender.findUnique({
    where: { waitListId: waitlist.id },
    select: {
      id: true,
      waitListId: true,
      status: true,
      fromEmail: true,
      lastTestedAt: true,
      lastErrorCode: true,
      updatedAt: true,
    },
  });
  let resolved = null;
  try {
    const provider = await resolveEmailSender(prisma, {
      workspaceId: waitlist.workspaceId,
      waitListId: waitlist.id,
    });
    if (provider) resolved = { source: provider.source, fromEmail: provider.fromEmail };
  } catch (error) {
    resolved = {
      source:
        error instanceof CustomerSenderNotConnectedError ? "not-connected" : "needs-attention",
      fromEmail: sender?.fromEmail || null,
    };
  }
  return { sender, resolved };
}

export async function configureWaitlistEmailSenderOp({ userId, waitlistId, fromEmail, apiKey }) {
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) {
    throw Object.assign(new Error("Secret encryption is not configured."), { status: 503 });
  }
  const email = typeof fromEmail === "string" ? fromEmail.trim() : "";
  const key = typeof apiKey === "string" ? apiKey.trim() : "";
  if (
    email.length > 254 ||
    /[\r\n]/.test(email) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)
  ) {
    throw new TypeError("Enter a valid sender email address.");
  }
  const existing = await prisma.waitlistEmailSender.findUnique({
    where: { waitListId: waitlistId },
    select: { id: true },
  });
  if (!key && !existing) throw new TypeError("Enter a Resend sending API key.");
  if (key && (!key.startsWith("re_") || key.length < 12 || key.length > 512 || /\s/.test(key))) {
    throw new TypeError("Enter a valid Resend API key.");
  }
  const secret = key ? encryptIntegrationSecret(key) : undefined;
  const sender = await prisma.waitlistEmailSender.upsert({
    where: { waitListId: waitlistId },
    create: { waitListId: waitlistId, fromEmail: email, ...secret },
    update: { fromEmail: email, status: "NEEDS_TEST", lastErrorCode: null, ...secret },
    select: {
      id: true,
      waitListId: true,
      status: true,
      fromEmail: true,
      lastTestedAt: true,
      lastErrorCode: true,
      updatedAt: true,
    },
  });
  await recordWaitlistAuditEvent(prisma, {
    userId,
    waitListId: waitlistId,
    action: AUDIT_ACTIONS.WAITLIST_SENDER_CONNECTED,
    resourceType: "waitlist_sender",
    resourceName: email,
  });
  return sender;
}

export async function testWaitlistEmailSenderOp({ waitlistId, recipientEmail }) {
  if (!recipientEmail) {
    throw Object.assign(new Error("A recipient email address is required to test."), {
      status: 400,
    });
  }
  const sender = await prisma.waitlistEmailSender.findUnique({ where: { waitListId: waitlistId } });
  if (!sender) {
    throw Object.assign(new Error("Save a waitlist sender before testing it."), { status: 409 });
  }
  const apiKey = decryptIntegrationSecret(sender);
  const now = new Date();
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send(
    {
      from: sender.fromEmail,
      to: recipientEmail,
      subject: "Your Waitlyze waitlist sender is ready",
      html: "<p>This test confirms Waitlyze can send email for this waitlist through its own Resend connection.</p>",
    },
    { idempotencyKey: `waitlyze-waitlist-sender-test:${sender.id}:${randomUUID()}` },
  );
  if (error || !data?.id) throw error || new Error("Provider did not accept the test email.");
  const updated = await prisma.waitlistEmailSender.updateMany({
    where: {
      id: sender.id,
      status: sender.status,
      fromEmail: sender.fromEmail,
      secretCiphertext: sender.secretCiphertext,
      secretIv: sender.secretIv,
      secretTag: sender.secretTag,
    },
    data: { status: "CONNECTED", lastTestedAt: now, lastErrorCode: null },
  });
  if (!updated.count) {
    throw Object.assign(
      new Error("The sender changed while it was being tested. Save and test again."),
      {
        status: 409,
      },
    );
  }
  return { status: "CONNECTED", lastTestedAt: now, sentTo: recipientEmail };
}

export async function configureWorkspaceResendOp({
  workspaceId,
  userId,
  fromEmail,
  apiKey,
  webhookSecret,
}) {
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) {
    throw Object.assign(new Error("Secret encryption is not configured."), { status: 503 });
  }
  const email = typeof fromEmail === "string" ? fromEmail.trim() : "";
  const key = typeof apiKey === "string" ? apiKey.trim() : "";
  const wh = typeof webhookSecret === "string" ? webhookSecret.trim() : "";
  if (
    email.length > 254 ||
    /[\r\n]/.test(email) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)
  ) {
    throw new TypeError("Enter a valid sender email address.");
  }
  const existing = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider: "RESEND" } },
    select: { id: true },
  });
  if (!key && !existing) throw new TypeError("Enter a Resend sending API key.");
  if (key && (!key.startsWith("re_") || key.length < 12 || key.length > 512 || /\s/.test(key))) {
    throw new TypeError("Enter a valid Resend API key.");
  }
  if (wh && (!wh.startsWith("whsec_") || wh.length < 16 || wh.length > 512 || /\s/.test(wh))) {
    throw new TypeError("Enter a valid Resend webhook signing secret (whsec_...).");
  }
  const secret = key ? encryptIntegrationSecret(key) : undefined;
  const webhook = wh ? encryptWebhookSecret(wh) : undefined;
  const connection = await prisma.workspaceIntegration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "RESEND" } },
    create: { workspaceId, provider: "RESEND", fromEmail: email, ...secret, ...webhook },
    update: { fromEmail: email, status: "NEEDS_TEST", lastErrorCode: null, ...secret, ...webhook },
    select: {
      id: true,
      workspaceId: true,
      provider: true,
      status: true,
      fromEmail: true,
      lastTestedAt: true,
      lastErrorCode: true,
      updatedAt: true,
      webhookSecretCiphertext: true,
    },
  });
  await recordAuditEvent(prisma, {
    workspaceId,
    userId,
    action: AUDIT_ACTIONS.RESEND_CONNECTED,
    resourceType: "integration",
    resourceName: `Resend · ${email}`,
  });
  return {
    id: connection.id,
    workspaceId: connection.workspaceId,
    provider: connection.provider,
    status: connection.status,
    fromEmail: connection.fromEmail,
    lastTestedAt: connection.lastTestedAt,
    lastErrorCode: connection.lastErrorCode,
    updatedAt: connection.updatedAt,
    webhookConfigured: Boolean(connection.webhookSecretCiphertext),
  };
}

export async function testWorkspaceResendOp({ workspaceId, recipientEmail }) {
  const connection = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider: "RESEND" } },
  });
  if (!connection) {
    throw Object.assign(new Error("Save a Resend connection before testing it."), { status: 409 });
  }
  const now = new Date();
  const resend = new Resend(decryptIntegrationSecret(connection));
  const { data, error } = await resend.emails.send(
    {
      from: connection.fromEmail,
      to: recipientEmail,
      subject: "Your Waitlyze email connection is ready",
      html: "<p>This test confirms Waitlyze can send email through the Resend connection configured for your workspace.</p>",
    },
    { idempotencyKey: `waitlyze-resend-test:${connection.id}:${randomUUID()}` },
  );
  if (error || !data?.id) throw error || new Error("Provider did not accept the test email.");
  await updateResendTestResult(prisma, connection, {
    status: "CONNECTED",
    lastTestedAt: now,
    lastErrorCode: null,
  });
  return { status: "CONNECTED", lastTestedAt: now, sentTo: recipientEmail };
}

export async function listResendDomainsForWorkspaceOp(workspaceId) {
  const connection = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider: "RESEND" } },
  });
  if (!connection) {
    throw Object.assign(new Error("Connect a Resend account first."), { status: 409 });
  }
  const apiKey = decryptIntegrationSecret(connection);
  return listResendDomains(apiKey);
}

export async function configureNotificationChannelOp({
  userId,
  waitlistId,
  channel,
  webhookUrl,
  triggers,
}) {
  const provider = String(channel || "").toUpperCase();
  if (!isSupportedChatProvider(provider)) {
    throw new TypeError("Channel must be SLACK or DISCORD.");
  }
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) {
    throw Object.assign(new Error("Secret encryption is not configured."), { status: 503 });
  }
  if (triggers !== undefined && !validChatTriggers(triggers)) {
    throw new TypeError(`Choose valid triggers: ${CHAT_TRIGGERS.join(", ")}.`);
  }
  const existing = await prisma.waitlistNotificationChannel.findUnique({
    where: { waitListId_provider: { waitListId: waitlistId, provider } },
  });
  const serializedTriggers = serializeJsonStringArray(triggers, [CHAT_TRIGGERS[0]]);
  if (!webhookUrl && existing && triggers !== undefined) {
    await prisma.waitlistNotificationChannel.update({
      where: { id: existing.id },
      data: { triggers: serializedTriggers },
    });
    const updated = await prisma.waitlistNotificationChannel.findUnique({
      where: { id: existing.id },
      select: {
        id: true,
        waitListId: true,
        provider: true,
        status: true,
        triggers: true,
        lastTestedAt: true,
        lastErrorCode: true,
        updatedAt: true,
      },
    });
    return { ...updated, triggers: parseJsonStringArray(updated.triggers, [CHAT_TRIGGERS[0]]) };
  }
  const validated = validateChatWebhookUrl(
    provider,
    typeof webhookUrl === "string" ? webhookUrl : "",
  );
  if (validated.error) throw new TypeError(validated.error);
  const secret = encryptIntegrationSecret(validated.url);
  const record = await prisma.waitlistNotificationChannel.upsert({
    where: { waitListId_provider: { waitListId: waitlistId, provider } },
    create: { waitListId: waitlistId, provider, triggers: serializedTriggers, ...secret },
    update: {
      status: "NEEDS_TEST",
      lastErrorCode: null,
      ...(triggers ? { triggers: serializedTriggers } : {}),
      ...secret,
    },
    select: {
      id: true,
      waitListId: true,
      provider: true,
      status: true,
      triggers: true,
      lastTestedAt: true,
      lastErrorCode: true,
      updatedAt: true,
    },
  });
  await recordWaitlistAuditEvent(prisma, {
    userId,
    waitListId: waitlistId,
    action: AUDIT_ACTIONS.CHAT_NOTIFICATION_CONNECTED,
    resourceType: "chat_notification",
    resourceName: provider,
  });
  return { ...record, triggers: parseJsonStringArray(record.triggers, [CHAT_TRIGGERS[0]]) };
}

export async function testNotificationChannelOp({ waitlistId, channel }) {
  const provider = String(channel || "").toUpperCase();
  if (!isSupportedChatProvider(provider)) {
    throw new TypeError("Channel must be SLACK or DISCORD.");
  }
  const record = await prisma.waitlistNotificationChannel.findUnique({
    where: { waitListId_provider: { waitListId: waitlistId, provider } },
  });
  if (!record) {
    throw Object.assign(new Error("Save a webhook URL before testing it."), { status: 409 });
  }
  const url = decryptIntegrationSecret(record);
  const validated = validateChatWebhookUrl(provider, url);
  if (validated.error) throw new TypeError(validated.error);
  const now = new Date();
  const post = provider === "SLACK" ? postSlackMessage : postDiscordMessage;
  await post(validated.url, "Waitlyze test: notifications for this waitlist will arrive here.");
  await prisma.waitlistNotificationChannel.update({
    where: { id: record.id },
    data: { status: "CONNECTED", lastTestedAt: now, lastErrorCode: null },
  });
  return { status: "CONNECTED", lastTestedAt: now };
}
