import { createHmac } from "node:crypto";
import { isIP } from "node:net";

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

/** Trust only Vercel's overwritten edge header; other hosts share a safe fallback. */
export function publicClientIdentity(headers, { vercel = process.env.VERCEL === "1" } = {}) {
  const value = vercel ? headers.get("x-vercel-forwarded-for")?.trim() : null;
  if (!value || !isIP(value)) return "untrusted-client";
  return isIP(value) === 6 ? new URL(`http://[${value}]/`).hostname.slice(1, -1) : value;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const policies = {
  signup: { global: [5000, DAY], campaign: [1000, DAY], client: [20, HOUR], recipient: [3, DAY] },
  impression: { global: [20000, HOUR], campaign: [5000, HOUR], client: [120, HOUR] },
  share: { global: [10000, HOUR], campaign: [2000, HOUR], client: [60, HOUR] },
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
};

/** Atomic PostgreSQL counters shared by all instances; failure never permits a send. */
export async function consumePublicBudget(
  db,
  { kind, campaignId, headers, email, actorId },
  {
    now = new Date(),
    vercel = process.env.VERCEL === "1",
    secret = process.env.BETTER_AUTH_SECRET,
  } = {},
) {
  const policy = policies[kind];
  if (
    !policy ||
    typeof campaignId !== "string" ||
    !campaignId ||
    campaignId.length > 128 ||
    !secret
  )
    throw new PublicRateLimitError(503);
  if (policy.authenticated && (typeof actorId !== "string" || !actorId || actorId.length > 128))
    throw new PublicRateLimitError(503);
  if (policy.recipient && (typeof email !== "string" || email.length > 320))
    throw new PublicRateLimitError(503);
  const hash = (value) => createHmac("sha256", secret).update(value).digest("hex");
  const buckets = [
    [`public:${kind}:global`, ...policy.global],
    [`public:${kind}:campaign:${hash(campaignId)}`, ...policy.campaign],
    [
      `public:${kind}:client:${hash(policy.authenticated ? `actor:${actorId}` : publicClientIdentity(headers, { vercel }))}`,
      ...policy.client,
    ],
    ...(policy.recipient
      ? [[`public:${kind}:recipient:${hash(email.trim().toLowerCase())}`, ...policy.recipient]]
      : []),
  ];
  try {
    await db.$transaction(
      async (tx) => {
        // Serialize the short counter transaction before cleanup to avoid lock-order
        // inversions across expired buckets. The lock is shared across instances.
        // Cast the void-returning lock to a bool: Prisma cannot deserialize a
        // `void` column and would fail the whole transaction.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('waitlyze-public-budget')) IS NULL AS acquired`;
        // Bounded cleanup; global admission limits bound new rows even under rotation.
        await tx.$executeRaw`
        DELETE FROM "rate_limit_buckets" WHERE "key" IN (
          SELECT "key" FROM "rate_limit_buckets" WHERE "expiresAt" <= ${now}
          ORDER BY "expiresAt" LIMIT 200 FOR UPDATE SKIP LOCKED
        )`;
        // Global first serializes admissions and prevents per-identity cardinality abuse.
        for (const [key, limit, window] of buckets) {
          const expiresAt = new Date(now.getTime() + window);
          const rows = await tx.$queryRaw`
          INSERT INTO "rate_limit_buckets" ("key", "count", "expiresAt", "updatedAt")
          VALUES (${key}, 1, ${expiresAt}, ${now})
          ON CONFLICT ("key") DO UPDATE SET
            "count" = CASE WHEN "rate_limit_buckets"."expiresAt" <= ${now} THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
            "expiresAt" = CASE WHEN "rate_limit_buckets"."expiresAt" <= ${now} THEN ${expiresAt} ELSE "rate_limit_buckets"."expiresAt" END,
            "updatedAt" = ${now}
          WHERE "rate_limit_buckets"."expiresAt" <= ${now} OR "rate_limit_buckets"."count" < ${limit}
          RETURNING "count"`;
          if (rows.length !== 1) throw new PublicRateLimitError();
        }
      },
      { timeout: 5000 },
    );
  } catch (error) {
    if (error instanceof PublicRateLimitError) throw error;
    // Do not expose raw database/connection details or silently bypass the guard.
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
