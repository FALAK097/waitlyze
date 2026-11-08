import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CLOUDFLARE_PLATFORM_EMAIL_SEND_LIMIT,
  reserveCloudflarePlatformEmail,
} from "./cloudflare-usage.mjs";

function createFakeDb({ existing = new Map(), recent = 0 } = {}) {
  return {
    $transaction: (callback) =>
      callback({
        $queryRaw: async () => [],
        cloudflareEmailUsage: {
          deleteMany: async () => ({ count: 0 }),
          findUnique: async ({ where }) => existing.get(where.idempotencyKey) || null,
          count: async () => recent + existing.size,
          create: async ({ data }) => {
            const row = { id: "usage-id", ...data, messageId: null };
            existing.set(data.idempotencyKey, row);
            return row;
          },
        },
      }),
  };
}

test("reserves one row per idempotency key for platform sends", async () => {
  const existing = new Map();
  const db = createFakeDb({ existing });
  const first = await reserveCloudflarePlatformEmail(db, "founder-notice-1");
  existing.get(first.key).messageId = "cf-message-1";
  const retry = await reserveCloudflarePlatformEmail(db, "founder-notice-1");

  assert.equal(first.duplicate, false);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.messageId, "cf-message-1");
  assert.equal(first.key, retry.key);
  assert.equal(CLOUDFLARE_PLATFORM_EMAIL_SEND_LIMIT, 2500);
});

test("fails closed before the free Email Sending allowance is exhausted", async () => {
  const db = createFakeDb({ recent: CLOUDFLARE_PLATFORM_EMAIL_SEND_LIMIT });
  await assert.rejects(
    () => reserveCloudflarePlatformEmail(db, "limit-test"),
    (error) => error.code === "PLATFORM_EMAIL_SAFETY_LIMIT" && error.statusCode === 429,
  );
});
