import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { validatePublishedApiKey } from "../../src/lib/campaigns/api-key.mjs";

function setup(overrides = {}) {
  const now = new Date("2026-09-30T12:00:00Z");
  const secret = randomBytes(32).toString("base64url");
  const keyId = randomBytes(16).toString("hex");
  const record = {
    id: "key-record",
    keyId,
    keyHash: createHash("sha256").update(secret).digest("hex"),
    userId: "creator",
    waitlistId: "waitlist-a",
    scopes: ["waitlist:write"],
    expiresAt: new Date(now.getTime() + 60_000),
    revokedAt: null,
    ...overrides,
  };
  const updates = [];
  const db = {
    apiKey: {
      findUnique: async ({ where }) => where.keyId === keyId ? record : null,
      findMany: async () => [],
      updateMany: async (args) => { updates.push(args); return { count: 1 }; },
    },
    waitList: { findFirst: async ({ where }) => where.id === record.waitlistId ? { id: record.waitlistId, name: "Launch", userId: record.userId } : null },
  };
  return { db, token: `wl2_${keyId}_${secret}`, record, updates, now };
}

test("v2 API key uses its identifier, digest, exact waitlist, write scope and expiry", async () => {
  const { db, token, updates, now } = setup();
  const accepted = await validatePublishedApiKey(token, "waitlist-a", db, { now });
  assert.equal(accepted.success, true);
  assert.equal(accepted.waitlist.id, "waitlist-a");
  assert.deepEqual(accepted.scopes, ["waitlist:write"]);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].data.lastUsedAt, now);
});

test("v2 API key rejects changed secrets, other waitlists, read-only scope, expiry, and revocation", async () => {
  for (const check of [
    async ({ db, token, now }) => validatePublishedApiKey(`${token.slice(0, -1)}x`, "waitlist-a", db, { now }),
    async ({ db, token, now }) => validatePublishedApiKey(token, "waitlist-b", db, { now }),
    async ({ record, ...state }) => { record.scopes = ["waitlist:read"]; return validatePublishedApiKey(state.token, "waitlist-a", state.db, { now: state.now }); },
    async ({ record, ...state }) => { record.expiresAt = new Date(state.now.getTime()); return validatePublishedApiKey(state.token, "waitlist-a", state.db, { now: state.now }); },
    async ({ record, ...state }) => { record.revokedAt = state.now; return validatePublishedApiKey(state.token, "waitlist-a", state.db, { now: state.now }); },
  ]) {
    const state = setup();
    assert.equal((await check(state)).success, false);
    assert.equal(state.updates.length, 0);
  }
});

test("legacy owner keys retain their prior published-waitlist contract", async () => {
  const token = `wl_${randomBytes(32).toString("base64url")}`;
  const db = {
    apiKey: {
      findMany: async () => [{ id: "legacy", keyHash: await bcrypt.hash(token, 4), userId: "creator", user: { waitLists: [{ id: "waitlist-a", name: "Launch", userId: "creator" }] } }],
      updateMany: async () => ({ count: 1 }),
    },
  };
  const result = await validatePublishedApiKey(token, "waitlist-a", db);
  assert.equal(result.success, true);
  assert.deepEqual(result.scopes, ["legacy:owner"]);
});
