import { createHmac } from "node:crypto";

import { PublicRateLimitError } from "./public-rate-limit.mjs";

const DAY = 24 * 60 * 60 * 1000;
// Generous per-key ceiling: the shared signup intake budget (5000/day
// globally) binds first, so this only isolates one noisy key from the rest.
export const API_KEY_DAILY_LIMIT = 5000;

/**
 * Consume one unit of a server-side API key's daily budget, stored in the
 * shared rate_limit_buckets table so every instance enforces the same
 * window. Returns { limit, remaining, reset } for X-RateLimit-* headers.
 * Throws PublicRateLimitError (429 with retryAfterSeconds, or 503 when the
 * limiter itself is misconfigured/unavailable).
 */
export async function consumeApiKeyBudget(
  db,
  apiKey,
  { limit = API_KEY_DAILY_LIMIT, now = new Date(), secret = process.env.BETTER_AUTH_SECRET } = {},
) {
  if (typeof apiKey !== "string" || !apiKey || !secret) throw new PublicRateLimitError(503);
  const fingerprint = createHmac("sha256", secret).update(`apikey:${apiKey}`).digest("hex");
  const bucketKey = `apikey:signup:${fingerprint}`;
  const reset = new Date(now.getTime() + DAY);
  try {
    const rows = await db.$queryRaw`
      INSERT INTO "rate_limit_buckets" ("key", "count", "expiresAt", "updatedAt")
      VALUES (${bucketKey}, 1, ${reset}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "rate_limit_buckets"."expiresAt" <= ${now} THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
        "expiresAt" = CASE WHEN "rate_limit_buckets"."expiresAt" <= ${now} THEN ${reset} ELSE "rate_limit_buckets"."expiresAt" END,
        "updatedAt" = ${now}
      WHERE "rate_limit_buckets"."expiresAt" <= ${now} OR "rate_limit_buckets"."count" < ${limit}
      RETURNING "count", "expiresAt"`;
    if (rows.length !== 1) {
      const error = new PublicRateLimitError(429);
      error.retryAfterSeconds = Math.max(1, Math.ceil((reset.getTime() - now.getTime()) / 1000));
      throw error;
    }
    const count = Number(rows[0].count);
    return {
      limit,
      remaining: Math.max(0, limit - count),
      reset: rows[0].expiresAt instanceof Date ? rows[0].expiresAt : reset,
    };
  } catch (error) {
    if (error instanceof PublicRateLimitError) throw error;
    console.error("API key rate-limit check failed", error?.code || error?.name || "unknown");
    throw new PublicRateLimitError(503);
  }
}

export function apiKeyRateLimitHeaders(budget) {
  if (!budget) return {};
  return {
    "X-RateLimit-Limit": String(budget.limit),
    "X-RateLimit-Remaining": String(budget.remaining),
    "X-RateLimit-Reset": String(Math.floor(new Date(budget.reset).getTime() / 1000)),
  };
}
