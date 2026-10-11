import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { validatePublishedApiKey } from "../../src/lib/campaigns/api-key.mjs";
import { createCampaignSignup } from "../../src/lib/campaigns/signups.mjs";

const keyId = "a".repeat(32);
const secret = "b".repeat(43);
const apiKey = `wl2_${keyId}_${secret}`;
const keyRecord = { id: "key", keyId, keyHash: createHash("sha256").update(secret).digest("hex"), userId: "issuer", waitlistId: "campaign", scopes: ["waitlist:write"] };

function keyDatabase(authorized) {
  let marked = false;
  return {
    apiKey: { findUnique: async () => keyRecord, updateMany: async () => { marked = true; return { count: 1 }; } },
    waitList: { findFirst: async ({ where }) => {
      assert.equal(where.id, "campaign");
      assert.equal(where.status, "PUBLISHED");
      const member = where.OR[1].workspace.members.some;
      assert.equal(member.userId, "issuer");
      assert.deepEqual(member.role.in, ["OWNER", "ADMIN"]);
      assert.deepEqual(where.OR[0], { workspaceId: null, userId: "issuer" });
      return authorized ? { id: "campaign" } : null;
    } },
    marked: () => marked,
  };
}

test("a valid API secret cannot bypass removed/demoted issuer membership", async () => {
  const db = keyDatabase(false);
  assert.equal((await validatePublishedApiKey(apiKey, "campaign", db)).success, false);
  assert.equal(db.marked(), false);
});

test("a published scoped key with an authorized issuer remains usable", async () => {
  const db = keyDatabase(true);
  assert.equal((await validatePublishedApiKey(apiKey, "campaign", db)).success, true);
  assert.equal(db.marked(), true);
});

test("oversized API input is rejected before any database or bcrypt work", async () => {
  assert.equal((await validatePublishedApiKey("wl_" + "a".repeat(10000), "campaign", {})).success, false);
});

test("idempotent signup retries preserve unsubscribe and never grant new marketing consent", async () => {
  const existing = { id: "signup", email: "person@example.com", uniqueUserId: "public-browser", marketingConsentAt: null, marketingUnsubscribedAt: new Date(), referrals: [] };
  const tx = {
    $queryRaw: async () => [{ id: "campaign", showReferrals: true }],
    signUp: { findUnique: async () => existing, update: async () => { throw new Error("Retry must not mutate consent"); } },
    marketingConsentEvent: { create: async () => { throw new Error("Retry must not record consent"); } },
  };
  const db = { $transaction: async (callback) => callback(tx), $queryRaw: async () => [{ id: existing.id, position: 1n }] };
  const result = await createCampaignSignup(db, { waitListId: "campaign", uniqueUserId: "public-browser", email: "person@example.com", marketingConsent: true });
  assert.equal(result.marketingConsentAt, null);
  assert.equal(result.marketingUnsubscribedAt, existing.marketingUnsubscribedAt);
});
