import { randomUUID } from "node:crypto";
import https from "node:https";

import {
  canonicalJson,
  decryptSecret,
  resolvePublicTarget,
  signWebhook,
  validateWebhookUrl,
} from "./security.mjs";

const MAX_ATTEMPTS = 6;
const MAX_RESPONSE_BYTES = 64 * 1024;
const RETRYABLE = new Set([408, 425, 429]);

// Single source of truth for customer-facing webhook event types. Dashboard
// routes validate subscriptions against this set; delivery code enqueues one
// of these types. Payload contract for every event:
//
//   { id, type, version: 1, occurredAt, waitlistId, data }
//
// - signup.created / signup.verified: data = { signupId }
// - referral.completed: data = { signupId, referredSignupId } where signupId
//   is the inviter who earned credit and referredSignupId is the invitee
//   whose verification completed the referral. Build reward rules on top of
//   this event; it fires under the same gate as the points ledger (invitee
//   verified, review CLEAR/APPROVED, not farm-suspect). Queue-position
//   counting additionally requires the inviter to be verified - that rule
//   lives in the position query, not in this event.
// - milestone.reached: data = { count, triggeringSignupId? } where count is
//   one of 1/10/100/1000 and triggeringSignupId is the signup that tripped
//   the count, when known. Reward-tier unlocks reuse this type with
//   data = { signupId, count, reward, triggeringSignupId } where count is the
//   crossed referral threshold, reward is the tier label, signupId is the
//   referrer who earns the tier, and triggeringSignupId is the invitee whose
//   verification crossed it. Milestones use a
//   deterministic event id (milestone:{waitlistId}:{count}) so concurrent
//   trips collapse to one delivery via skipDuplicates instead of
//   double-firing; tier unlocks use reward-tier:{waitlistId}:{signup}:{count}
//   so the two families never collide.
export const WEBHOOK_EVENT_TYPES = Object.freeze([
  "signup.created",
  "signup.verified",
  "referral.completed",
  "milestone.reached",
]);

export function isSupportedWebhookEvent(value) {
  return WEBHOOK_EVENT_TYPES.includes(value);
}

function deliveryRows(subscriptions, event) {
  const id = typeof event.eventId === "string" && event.eventId ? event.eventId : randomUUID();
  const payload = {
    id,
    type: event.eventType,
    version: 1,
    occurredAt: event.now.toISOString(),
    waitlistId: event.waitListId,
    data:
      event.test || event.signupId === undefined
        ? { ...(event.test ? { test: true } : {}), ...event.extra }
        : { signupId: event.signupId, ...event.extra },
  };
  return subscriptions.map(({ id: subscriptionId }) => ({
    subscriptionId,
    eventId: id,
    eventKey: `${subscriptionId}:${id}`,
    eventType: event.eventType,
    payload,
    availableAt: event.now,
  }));
}

export async function enqueueWebhookEvent(tx, event) {
  const normalized = { test: false, now: new Date(), ...event };
  const subscriptions = await tx.webhookSubscription.findMany({
    where: {
      waitListId: normalized.waitListId,
      enabled: true,
      eventTypes: { has: normalized.eventType },
    },
    select: { id: true },
  });
  if (!subscriptions.length) return 0;
  await tx.webhookDelivery.createMany({
    data: deliveryRows(subscriptions, normalized),
    skipDuplicates: true,
  });
  return subscriptions.length;
}

// Batch related events that share a waitlist and type. This keeps transaction
// fan-out to one subscription read and one insert while preserving each
// event's own idempotency key and payload.
export async function enqueueWebhookEventBatch(tx, events) {
  if (!Array.isArray(events) || events.length === 0) return 0;
  const normalized = events.map((event) => ({ test: false, now: new Date(), ...event }));
  const { waitListId, eventType } = normalized[0];
  if (
    normalized.some((event) => event.waitListId !== waitListId || event.eventType !== eventType)
  ) {
    throw new TypeError("Batched webhook events must share a waitlist and event type.");
  }
  const subscriptions = await tx.webhookSubscription.findMany({
    where: { waitListId, enabled: true, eventTypes: { has: eventType } },
    select: { id: true },
  });
  if (!subscriptions.length) return 0;
  const data = normalized.flatMap((event) => deliveryRows(subscriptions, event));
  const result = await tx.webhookDelivery.createMany({ data, skipDuplicates: true });
  return result.count;
}

function postPinned(url, addresses, body, headers) {
  return new Promise((resolve, reject) => {
    const chosen = addresses[0];
    const req = https.request(
      url,
      {
        method: "POST",
        agent: new https.Agent({
          keepAlive: false,
          lookup: (_host, _options, callback) => callback(null, chosen.address, chosen.family),
        }),
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
          ...headers,
        },
        timeout: 10_000,
      },
      (res) => {
        let size = 0;
        res.on("data", (chunk) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) req.destroy(new Error("response_too_large"));
        });
        res.on("end", () => resolve({ status: res.statusCode || 0 }));
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end(body);
  });
}

function errorCode(error) {
  const code = typeof error?.code === "string" ? error.code : "delivery_error";
  return /^[A-Z0-9_]{1,48}$/.test(code) ? code : "delivery_error";
}

export async function deliverWebhook(
  prisma,
  deliveryId,
  { now = new Date(), send = postPinned, resolve = resolvePublicTarget } = {},
) {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { subscription: true },
  });
  if (!delivery || !["PENDING", "FAILED", "PROCESSING"].includes(delivery.status))
    return { skipped: true };
  if (!delivery.subscription.enabled) {
    await prisma.webhookDelivery.updateMany({
      where: { id: deliveryId, status: delivery.status },
      data: { status: "PAUSED", lockedAt: null },
    });
    return { paused: true };
  }
  const claimed = await prisma.webhookDelivery.updateMany({
    where: {
      id: deliveryId,
      OR: [
        { status: "PENDING" },
        { status: "FAILED" },
        { status: "PROCESSING", lockedAt: { lt: new Date(now.getTime() - 60_000) } },
      ],
    },
    data: { status: "PROCESSING", lockedAt: now, attempts: { increment: 1 } },
  });
  if (claimed.count !== 1) return { skipped: true };
  const attempt = delivery.attempts + 1;
  try {
    const { url } = validateWebhookUrl(delivery.subscription.url);
    const addresses = await resolve(url.hostname);
    const timestamp = Math.floor(now.getTime() / 1000).toString();
    const body = canonicalJson(delivery.payload);
    const currentSecret = decryptSecret({
      ciphertext: delivery.subscription.secretCiphertext,
      iv: delivery.subscription.secretIv,
      tag: delivery.subscription.secretTag,
    });
    const signatures = [`v1=${signWebhook(currentSecret, timestamp, delivery.payload)}`];
    if (
      delivery.subscription.previousSecretValidUntil > now &&
      delivery.subscription.previousSecretCiphertext
    ) {
      const previous = decryptSecret({
        ciphertext: delivery.subscription.previousSecretCiphertext,
        iv: delivery.subscription.previousSecretIv,
        tag: delivery.subscription.previousSecretTag,
      });
      signatures.push(`v1=${signWebhook(previous, timestamp, delivery.payload)}`);
    }
    const response = await send(url, addresses, body, {
      "x-waitlyze-timestamp": timestamp,
      "x-waitlyze-signature": `t=${timestamp},${signatures.join(",")}`,
      "x-waitlyze-event-id": delivery.eventId,
      "x-waitlyze-event-type": delivery.eventType,
      "idempotency-key": delivery.eventId,
    });
    const success = response.status >= 200 && response.status < 300;
    const retry = RETRYABLE.has(response.status) || response.status >= 500;
    const status = success ? "DELIVERED" : retry && attempt < MAX_ATTEMPTS ? "PENDING" : "FAILED";
    const delayMs =
      Math.min(60 * 60_000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 1000);
    await prisma.$transaction([
      prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status,
          responseStatus: response.status,
          lastErrorCode: success ? null : `http_${response.status}`,
          lockedAt: null,
          processedAt: now,
          deliveredAt: success ? now : null,
          availableAt: success ? now : new Date(now.getTime() + delayMs),
        },
      }),
      ...(success
        ? [
            prisma.webhookSubscription.update({
              where: { id: delivery.subscriptionId },
              data: { lastDeliveredAt: now },
            }),
          ]
        : []),
    ]);
    return { status };
  } catch (error) {
    const retry =
      !["ERR_INVALID_URL", "WEBHOOK_URL_INVALID", "TARGET_BLOCKED"].includes(error?.code) &&
      attempt < MAX_ATTEMPTS;
    const delayMs =
      Math.min(60 * 60_000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 1000);
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: retry ? "PENDING" : "FAILED",
        lastErrorCode: errorCode(error),
        responseStatus: null,
        lockedAt: null,
        processedAt: now,
        availableAt: new Date(now.getTime() + delayMs),
      },
    });
    return { status: retry ? "PENDING" : "FAILED" };
  }
}

export async function dispatchPendingWebhooks(prisma, { limit = 50, now = new Date() } = {}) {
  const rows = await prisma.webhookDelivery.findMany({
    where: {
      availableAt: { lte: now },
      OR: [
        { status: "PENDING" },
        { status: "PROCESSING", lockedAt: { lt: new Date(now.getTime() - 60_000) } },
      ],
    },
    select: { id: true },
    orderBy: { availableAt: "asc" },
    take: limit,
  });
  const results = await Promise.all(rows.map(({ id }) => deliverWebhook(prisma, id, { now })));
  return {
    considered: rows.length,
    delivered: results.filter((x) => x.status === "DELIVERED").length,
    failed: results.filter((x) => x.status === "FAILED").length,
  };
}
