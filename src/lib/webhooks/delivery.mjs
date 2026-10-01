import https from "node:https";
import { randomUUID } from "node:crypto";
import { canonicalJson, decryptSecret, resolvePublicTarget, signWebhook, validateWebhookUrl } from "./security.mjs";

const MAX_ATTEMPTS = 6;
const MAX_RESPONSE_BYTES = 64 * 1024;
const RETRYABLE = new Set([408, 425, 429]);

export async function enqueueWebhookEvent(tx, { waitListId, eventType, signupId, test = false, now = new Date() }) {
  const subscriptions = await tx.webhookSubscription.findMany({
    where: { waitListId, enabled: true, eventTypes: { has: eventType } },
    select: { id: true },
  });
  if (!subscriptions.length) return 0;
  const eventId = randomUUID();
  const payload = { id: eventId, type: eventType, version: 1, occurredAt: now.toISOString(), waitlistId, data: test ? { test: true } : { signupId } };
  await tx.webhookDelivery.createMany({
    data: subscriptions.map(({ id }) => ({ subscriptionId: id, eventId, eventKey: `${id}:${eventId}`, eventType, payload, availableAt: now })),
    skipDuplicates: true,
  });
  return subscriptions.length;
}

function postPinned(url, addresses, body, headers) {
  return new Promise((resolve, reject) => {
    const chosen = addresses[0];
    const req = https.request(url, {
      method: "POST",
      agent: new https.Agent({ keepAlive: false, lookup: (_host, _options, callback) => callback(null, chosen.address, chosen.family) }),
      headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body), ...headers },
      timeout: 10_000,
    }, (res) => {
      let size = 0;
      res.on("data", (chunk) => { size += chunk.length; if (size > MAX_RESPONSE_BYTES) req.destroy(new Error("response_too_large")); });
      res.on("end", () => resolve({ status: res.statusCode || 0 }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end(body);
  });
}

function errorCode(error) {
  const code = typeof error?.code === "string" ? error.code : "delivery_error";
  return /^[A-Z0-9_]{1,48}$/.test(code) ? code : "delivery_error";
}

export async function deliverWebhook(prisma, deliveryId, { now = new Date(), send = postPinned, resolve = resolvePublicTarget } = {}) {
  const delivery = await prisma.webhookDelivery.findUnique({ where: { id: deliveryId }, include: { subscription: true } });
  if (!delivery || !["PENDING", "FAILED", "PROCESSING"].includes(delivery.status)) return { skipped: true };
  if (!delivery.subscription.enabled) {
    await prisma.webhookDelivery.updateMany({ where: { id: deliveryId, status: delivery.status }, data: { status: "PAUSED", lockedAt: null } });
    return { paused: true };
  }
  const claimed = await prisma.webhookDelivery.updateMany({
    where: { id: deliveryId, OR: [{ status: "PENDING" }, { status: "FAILED" }, { status: "PROCESSING", lockedAt: { lt: new Date(now.getTime() - 60_000) } }] },
    data: { status: "PROCESSING", lockedAt: now, attempts: { increment: 1 } },
  });
  if (claimed.count !== 1) return { skipped: true };
  const attempt = delivery.attempts + 1;
  try {
    const { url } = validateWebhookUrl(delivery.subscription.url);
    const addresses = await resolve(url.hostname);
    const timestamp = Math.floor(now.getTime() / 1000).toString();
    const body = canonicalJson(delivery.payload);
    const currentSecret = decryptSecret({ ciphertext: delivery.subscription.secretCiphertext, iv: delivery.subscription.secretIv, tag: delivery.subscription.secretTag });
    const signatures = [`v1=${signWebhook(currentSecret, timestamp, delivery.payload)}`];
    if (delivery.subscription.previousSecretValidUntil > now && delivery.subscription.previousSecretCiphertext) {
      const previous = decryptSecret({ ciphertext: delivery.subscription.previousSecretCiphertext, iv: delivery.subscription.previousSecretIv, tag: delivery.subscription.previousSecretTag });
      signatures.push(`v1=${signWebhook(previous, timestamp, delivery.payload)}`);
    }
    const response = await send(url, addresses, body, { "x-waitlyze-timestamp": timestamp, "x-waitlyze-signature": `t=${timestamp},${signatures.join(",")}`, "x-waitlyze-event-id": delivery.eventId, "x-waitlyze-event-type": delivery.eventType, "idempotency-key": delivery.eventId });
    const success = response.status >= 200 && response.status < 300;
    const retry = RETRYABLE.has(response.status) || response.status >= 500;
    const status = success ? "DELIVERED" : retry && attempt < MAX_ATTEMPTS ? "PENDING" : "FAILED";
    const delayMs = Math.min(60 * 60_000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 1000);
    await prisma.$transaction([
      prisma.webhookDelivery.update({ where: { id: deliveryId }, data: { status, responseStatus: response.status, lastErrorCode: success ? null : `http_${response.status}`, lockedAt: null, processedAt: now, deliveredAt: success ? now : null, availableAt: success ? now : new Date(now.getTime() + delayMs) } }),
      ...(success ? [prisma.webhookSubscription.update({ where: { id: delivery.subscriptionId }, data: { lastDeliveredAt: now } })] : []),
    ]);
    return { status };
  } catch (error) {
    const retry = !["ERR_INVALID_URL", "WEBHOOK_URL_INVALID", "TARGET_BLOCKED"].includes(error?.code) && attempt < MAX_ATTEMPTS;
    const delayMs = Math.min(60 * 60_000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 1000);
    await prisma.webhookDelivery.update({ where: { id: deliveryId }, data: { status: retry ? "PENDING" : "FAILED", lastErrorCode: errorCode(error), responseStatus: null, lockedAt: null, processedAt: now, availableAt: new Date(now.getTime() + delayMs) } });
    return { status: retry ? "PENDING" : "FAILED" };
  }
}

export async function dispatchPendingWebhooks(prisma, { limit = 50, now = new Date() } = {}) {
  const rows = await prisma.webhookDelivery.findMany({ where: { status: "PENDING", availableAt: { lte: now } }, select: { id: true }, orderBy: { availableAt: "asc" }, take: limit });
  const results = await Promise.all(rows.map(({ id }) => deliverWebhook(prisma, id, { now })));
  return { considered: rows.length, delivered: results.filter((x) => x.status === "DELIVERED").length, failed: results.filter((x) => x.status === "FAILED").length };
}
