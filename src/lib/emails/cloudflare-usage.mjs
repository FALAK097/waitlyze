import { createHash, randomUUID } from "node:crypto";

import { isUniqueConstraintError } from "@/lib/db/sqlite-helpers.mjs";

const PLATFORM_SEND_LIMIT = 2500;
const SAFETY_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

function usageKey(idempotencyKey) {
  const source = idempotencyKey || randomUUID();
  return createHash("sha256").update(String(source)).digest("hex");
}

function uncertainError() {
  return Object.assign(
    new Error("Email delivery outcome is uncertain; refusing a duplicate send."),
    {
      code: "PLATFORM_EMAIL_DELIVERY_UNCERTAIN",
      statusCode: 409,
    },
  );
}

/** Reserve sends before hitting Cloudflare so app traffic stays below its 3K/mo included quota. */
export async function reserveCloudflarePlatformEmail(db, idempotencyKey, now = new Date()) {
  const key = usageKey(idempotencyKey);
  const cutoff = new Date(now.getTime() - SAFETY_WINDOW_MS);

  await db.cloudflareEmailUsage.deleteMany({ where: { createdAt: { lt: cutoff } } });

  const prior = await db.cloudflareEmailUsage.findUnique({ where: { idempotencyKey: key } });
  if (prior?.messageId) return { key, duplicate: true, messageId: prior.messageId };
  if (prior) throw uncertainError();

  const recent = await db.cloudflareEmailUsage.count({ where: { createdAt: { gte: cutoff } } });
  if (recent >= PLATFORM_SEND_LIMIT) {
    throw Object.assign(new Error("Waitlyze transactional email safety limit reached."), {
      code: "PLATFORM_EMAIL_SAFETY_LIMIT",
      statusCode: 429,
    });
  }

  try {
    await db.cloudflareEmailUsage.create({ data: { idempotencyKey: key, createdAt: now } });
    return { key, duplicate: false, messageId: null };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const raced = await db.cloudflareEmailUsage.findUnique({ where: { idempotencyKey: key } });
    if (raced?.messageId) return { key, duplicate: true, messageId: raced.messageId };
    throw uncertainError();
  }
}

export async function recordCloudflarePlatformEmail(db, key, messageId) {
  await db.cloudflareEmailUsage.update({
    where: { idempotencyKey: key },
    data: { messageId },
  });
}

/** A documented API rejection was not accepted and does not consume the safety allowance. */
export async function releaseCloudflarePlatformEmail(db, key) {
  await db.cloudflareEmailUsage.deleteMany({ where: { idempotencyKey: key } });
}
