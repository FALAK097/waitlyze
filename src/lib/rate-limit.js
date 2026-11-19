import { createHash } from "node:crypto";

import { toSqliteIso } from "@/lib/db/sqlite-helpers.mjs";

/** Atomic SQLite / Cloudflare D1 sliding-window rate limiter. */
export async function checkRateLimit(db, userId, limit = 10, windowMs = 60 * 60 * 1000) {
  if (
    !db?.$queryRaw ||
    typeof userId !== "string" ||
    !userId ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isFinite(windowMs) ||
    windowMs < 1
  ) {
    throw new TypeError("Rate limit configuration is invalid.");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  const nowIso = toSqliteIso(now);
  const expiresIso = toSqliteIso(expiresAt);
  const userKey = createHash("sha256").update(userId).digest("hex");
  const key = `user-action:${userKey}`;

  try {
    // SQLite equivalent of positive-number CEIL(x):
    // CAST(x AS INTEGER) + CASE WHEN x > CAST(x AS INTEGER) THEN 1 ELSE 0 END
    const rows = await db.$queryRaw`
      INSERT INTO "rate_limit_buckets" ("key", "count", "expiresAt", "updatedAt")
      VALUES (${key}, 1, ${expiresIso}, ${nowIso})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = (
          CAST(
            CAST("rate_limit_buckets"."count" AS REAL) * MIN(
              1.0,
              MAX(
                0.0,
                (CAST(${windowMs} AS REAL) - ((julianday(${nowIso}) - julianday("rate_limit_buckets"."updatedAt")) * 86400000.0))
                / CAST(${windowMs} AS REAL)
              )
            ) AS INTEGER
          )
          + CASE
              WHEN (
                CAST("rate_limit_buckets"."count" AS REAL) * MIN(
                  1.0,
                  MAX(
                    0.0,
                    (CAST(${windowMs} AS REAL) - ((julianday(${nowIso}) - julianday("rate_limit_buckets"."updatedAt")) * 86400000.0))
                    / CAST(${windowMs} AS REAL)
                  )
                )
              ) > CAST(
                CAST("rate_limit_buckets"."count" AS REAL) * MIN(
                  1.0,
                  MAX(
                    0.0,
                    (CAST(${windowMs} AS REAL) - ((julianday(${nowIso}) - julianday("rate_limit_buckets"."updatedAt")) * 86400000.0))
                    / CAST(${windowMs} AS REAL)
                  )
                ) AS INTEGER
              ) THEN 1 ELSE 0 END
          + 1
        ),
        "expiresAt" = ${expiresIso},
        "updatedAt" = ${nowIso}
      WHERE (
        CAST(
          CAST("rate_limit_buckets"."count" AS REAL) * MIN(
            1.0,
            MAX(
              0.0,
              (CAST(${windowMs} AS REAL) - ((julianday(${nowIso}) - julianday("rate_limit_buckets"."updatedAt")) * 86400000.0))
              / CAST(${windowMs} AS REAL)
            )
          ) AS INTEGER
        )
        + CASE
            WHEN (
              CAST("rate_limit_buckets"."count" AS REAL) * MIN(
                1.0,
                MAX(
                  0.0,
                  (CAST(${windowMs} AS REAL) - ((julianday(${nowIso}) - julianday("rate_limit_buckets"."updatedAt")) * 86400000.0))
                  / CAST(${windowMs} AS REAL)
                )
              )
            ) > CAST(
              CAST("rate_limit_buckets"."count" AS REAL) * MIN(
                1.0,
                MAX(
                  0.0,
                  (CAST(${windowMs} AS REAL) - ((julianday(${nowIso}) - julianday("rate_limit_buckets"."updatedAt")) * 86400000.0))
                  / CAST(${windowMs} AS REAL)
                )
              ) AS INTEGER
            ) THEN 1 ELSE 0 END
        + 1
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
