import { createHmac } from "node:crypto";
import { isIP } from "node:net";

import { toSqliteIso } from "@/lib/db/sqlite-helpers.mjs";

export class PublicRateLimitError extends Error {
  constructor(status = 429) {
    super(
      status === 429
        ? "Too many requests. Please try again later."
        : "Signups are temporarily unavailable. Please try again later.",
    );
    this.status = status;
  }
}

/** Trust Cloudflare's edge-overwritten client IP header, never a caller's forwarded-for value. */
export function publicClientIdentity(headers) {
  const value = headers.get("cf-connecting-ip")?.trim();
  if (!value || !isIP(value)) return "untrusted-client";
  return isIP(value) === 6 ? new URL(`http://[${value}]/`).hostname.slice(1, -1) : value;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const policies = {
  signup: { global: [5000, DAY], campaign: [1000, DAY], client: [20, HOUR], recipient: [3, DAY] },
  impression: { global: [20000, HOUR], campaign: [5000, HOUR], client: [120, HOUR] },
  share: { global: [10000, HOUR], campaign: [2000, HOUR], client: [60, HOUR] },
  leaderboard: { global: [10000, HOUR], campaign: [2000, HOUR], client: [60, HOUR] },
  widget: { global: [20000, HOUR], campaign: [5000, HOUR], client: [240, HOUR] },
  welcome: { global: [1000, DAY], campaign: [250, DAY], client: [10, HOUR], recipient: [1, DAY] },
  testEmail: {
    global: [1000, DAY],
    campaign: [100, DAY],
    client: [20, HOUR],
    recipient: [3, DAY],
    authenticated: true,
  },
  invitation: {
    global: [1000, DAY],
    campaign: [100, DAY],
    client: [20, HOUR],
    recipient: [3, DAY],
    authenticated: true,
  },
  chatTest: {
    global: [1000, DAY],
    campaign: [100, DAY],
    client: [20, HOUR],
    authenticated: true,
  },
  status: { global: [20000, HOUR], campaign: [5000, HOUR], client: [120, HOUR] },
  follow: { global: [10000, HOUR], campaign: [2000, HOUR], client: [60, HOUR] },
  points: { global: [20000, HOUR], campaign: [5000, HOUR], client: [120, HOUR] },
};

/** Atomic SQLite/D1 counters shared by all instances; failure never permits a send. */
export async function consumePublicBudget(
  db,
  { kind, campaignId, headers, email, actorId },
  { now = new Date(), secret = process.env.BETTER_AUTH_SECRET } = {},
) {
  const policy = policies[kind];
  if (
    !policy ||
    typeof campaignId !== "string" ||
    !campaignId ||
    campaignId.length > 128 ||
    !secret
  ) {
    throw new PublicRateLimitError(503);
  }
  if (policy.authenticated && (typeof actorId !== "string" || !actorId || actorId.length > 128)) {
    throw new PublicRateLimitError(503);
  }
  if (policy.recipient && (typeof email !== "string" || email.length > 320)) {
    throw new PublicRateLimitError(503);
  }

  const hash = (value) => createHmac("sha256", secret).update(value).digest("hex");
  // Check/consume narrowest buckets first (recipient -> client -> campaign -> global)
  // so a single abusive recipient/client cannot exhaust campaign or global budgets.
  const buckets = [
    ...(policy.recipient
      ? [[`public:${kind}:recipient:${hash(email.trim().toLowerCase())}`, ...policy.recipient]]
      : []),
    [
      `public:${kind}:client:${hash(policy.authenticated ? `actor:${actorId}` : publicClientIdentity(headers))}`,
      ...policy.client,
    ],
    [`public:${kind}:campaign:${hash(campaignId)}`, ...policy.campaign],
    [`public:${kind}:global`, ...policy.global],
  ];

  const nowIso = toSqliteIso(now);

  try {
    // Bounded cleanup of expired buckets without Postgres FOR UPDATE SKIP LOCKED.
    await db.$executeRaw`
      DELETE FROM "rate_limit_buckets"
      WHERE "key" IN (
        SELECT "key" FROM "rate_limit_buckets"
        WHERE julianday("expiresAt") <= julianday(${nowIso})
        ORDER BY "expiresAt" ASC
        LIMIT 200
      )`;

    // Pre-check existing active buckets before mutating so an already-exhausted
    // bucket does not advance sibling buckets.
    const existing = await db.rateLimitBucket.findMany({
      where: { key: { in: buckets.map(([key]) => key) } },
      select: { key: true, count: true, expiresAt: true },
    });
    const byKey = new Map(existing.map((row) => [row.key, row]));
    for (const [key, limit] of buckets) {
      const row = byKey.get(key);
      if (row && row.expiresAt > now && row.count >= limit) {
        throw new PublicRateLimitError();
      }
    }

    // Atomic per-bucket increment guarded by WHERE condition.
    for (const [key, limit, window] of buckets) {
      const expiresIso = toSqliteIso(new Date(now.getTime() + window));
      const rows = await db.$queryRaw`
        INSERT INTO "rate_limit_buckets" ("key", "count", "expiresAt", "updatedAt")
        VALUES (${key}, 1, ${expiresIso}, ${nowIso})
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE
            WHEN julianday("rate_limit_buckets"."expiresAt") <= julianday(${nowIso}) THEN 1
            ELSE "rate_limit_buckets"."count" + 1
          END,
          "expiresAt" = CASE
            WHEN julianday("rate_limit_buckets"."expiresAt") <= julianday(${nowIso}) THEN ${expiresIso}
            ELSE "rate_limit_buckets"."expiresAt"
          END,
          "updatedAt" = ${nowIso}
        WHERE julianday("rate_limit_buckets"."expiresAt") <= julianday(${nowIso})
           OR "rate_limit_buckets"."count" < ${limit}
        RETURNING "count"`;
      if (rows.length !== 1) throw new PublicRateLimitError();
    }
  } catch (error) {
    if (error instanceof PublicRateLimitError) throw error;
    console.error(
      "Public rate-limit check failed",
      kind,
      error?.code || error?.name || "unknown",
      "-",
      String(error?.message || "").slice(0, 400),
    );
    throw new PublicRateLimitError(503);
  }
}
