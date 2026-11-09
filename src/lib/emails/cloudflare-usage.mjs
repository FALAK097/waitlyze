import { createHash, randomUUID } from "node:crypto";

const PLATFORM_SEND_LIMIT = 2500;
const SAFETY_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

function usageKey(idempotencyKey) {
  const source = idempotencyKey || randomUUID();
  return createHash("sha256").update(String(source)).digest("hex");
}

/** Reserve sends before hitting Cloudflare so app traffic stays below its 3K/mo included quota. */
export async function reserveCloudflarePlatformEmail(db, idempotencyKey, now = new Date()) {
  const key = usageKey(idempotencyKey);
  const cutoff = new Date(now.getTime() - SAFETY_WINDOW_MS);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('waitlyze-cloudflare-email-usage')) IS NULL AS acquired`;
    await tx.cloudflareEmailUsage.deleteMany({ where: { createdAt: { lt: cutoff } } });
    const prior = await tx.cloudflareEmailUsage.findUnique({ where: { idempotencyKey: key } });
    if (prior?.messageId) return { key, duplicate: true, messageId: prior.messageId };
    if (prior)
      throw Object.assign(
        new Error("Email delivery outcome is uncertain; refusing a duplicate send."),
        {
          code: "PLATFORM_EMAIL_DELIVERY_UNCERTAIN",
          statusCode: 409,
        },
      );

    const recent = await tx.cloudflareEmailUsage.count({ where: { createdAt: { gte: cutoff } } });
    if (recent >= PLATFORM_SEND_LIMIT)
      throw Object.assign(new Error("Waitlyze transactional email safety limit reached."), {
        code: "PLATFORM_EMAIL_SAFETY_LIMIT",
        statusCode: 429,
      });

    await tx.cloudflareEmailUsage.create({ data: { idempotencyKey: key, createdAt: now } });
    return { key, duplicate: false, messageId: null };
  });
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

export const CLOUDFLARE_PLATFORM_EMAIL_SEND_LIMIT = PLATFORM_SEND_LIMIT;
