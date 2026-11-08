import { createHash } from "node:crypto";

/** Atomic PostgreSQL rate limiter shared across Cloudflare Worker isolates. */
export async function checkRateLimit(db, userId, limit = 10, windowMs = 60 * 60 * 1000) {
  if (
    !db?.$queryRaw ||
    typeof userId !== "string" ||
    !userId ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isFinite(windowMs) ||
    windowMs < 1
  )
    throw new TypeError("Rate limit configuration is invalid.");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  const userKey = createHash("sha256").update(userId).digest("hex");
  const key = `user-action:${userKey}`;
  try {
    const rows = await db.$queryRaw`
      INSERT INTO "rate_limit_buckets" ("key", "count", "expiresAt", "updatedAt")
      VALUES (${key}, 1, ${expiresAt}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limit_buckets"."expiresAt" <= ${now} THEN 1
          ELSE "rate_limit_buckets"."count" + 1
        END,
        "expiresAt" = CASE
          WHEN "rate_limit_buckets"."expiresAt" <= ${now} THEN ${expiresAt}
          ELSE "rate_limit_buckets"."expiresAt"
        END,
        "updatedAt" = ${now}
      RETURNING "count"
    `;
    return Number(rows[0]?.count) <= limit;
  } catch (error) {
    console.error("Rate limit storage unavailable", error?.code || error?.name || "unknown error");
    throw Object.assign(new Error("Rate limiting is temporarily unavailable."), {
      code: "RATE_LIMIT_UNAVAILABLE",
    });
  }
}
