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
    // Sliding-window counter: each request decays the stored count by the
    // fraction of the window elapsed since the previous request (measured
    // from `updatedAt`, the last touch) and then adds itself. Discounting
    // against a fixed `expiresAt` would re-shrink the same old count on every
    // call: near the end of the window it floors at 2 forever and unlimited
    // traffic slips through, whereas keying the decay to the last update
    // keeps recent requests weighted at ~1, decays idle counters toward zero,
    // and still stays a single atomic statement shared by every Worker
    // isolate. `expiresAt` is only a TTL for the idle-row sweep.
    // Sliding-window counter with retry lockout prevention: decay is evaluated
    // against the time since the last accepted update. If the decayed count
    // is already at or above limit, the attempt is rejected without advancing
    // updatedAt or incrementing count, so retries cannot keep users locked out.
    const rows = await db.$queryRaw`
      INSERT INTO "rate_limit_buckets" ("key", "count", "expiresAt", "updatedAt")
      VALUES (${key}, 1, ${expiresAt}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = (
          CEIL(
            "rate_limit_buckets"."count"::double precision
            * LEAST(
              1.0::double precision,
              GREATEST(
                0.0::double precision,
                (${windowMs}::double precision
                  - (EXTRACT(EPOCH FROM (${now}::timestamptz - "rate_limit_buckets"."updatedAt")) * 1000.0)::double precision)
                / ${windowMs}::double precision
              )
            )
          )::int + 1
        ),
        "expiresAt" = ${expiresAt},
        "updatedAt" = ${now}
      WHERE (
        CEIL(
          "rate_limit_buckets"."count"::double precision
          * LEAST(
            1.0::double precision,
            GREATEST(
              0.0::double precision,
              (${windowMs}::double precision
                - (EXTRACT(EPOCH FROM (${now}::timestamptz - "rate_limit_buckets"."updatedAt")) * 1000.0)::double precision)
              / ${windowMs}::double precision
            )
          )
        ) + 1
      ) <= ${limit}
      RETURNING "count"
    `;
    return rows.length > 0;
  } catch (error) {
    console.error("Rate limit storage unavailable", error?.code || error?.name || "unknown error");
    throw Object.assign(new Error("Rate limiting is temporarily unavailable."), {
      code: "RATE_LIMIT_UNAVAILABLE",
    });
  }
}
