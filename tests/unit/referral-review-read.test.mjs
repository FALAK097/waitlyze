import test from "node:test";
import assert from "node:assert/strict";
import { loadReferralReviews } from "../../src/lib/campaigns/referral-review-read.mjs";

test("referral review read scopes the waitlist and returns bounded display fields", async () => {
  const reviews = [{ id: "review-1" }];
  let query;
  const result = await loadReferralReviews({ referral: { findMany: async (input) => { query = input; return reviews; } } }, "waitlist-1");

  assert.deepEqual(result, { reviews, failed: false });
  assert.deepEqual(query.where, { signUp: { is: { waitListId: "waitlist-1" } }, reviewStatus: { not: "CLEAR" } });
  assert.equal(query.take, 50);
  assert.equal(query.orderBy.createdAt, "desc");
});

test("referral review query failures stay isolated from the subscriber page", async () => {
  const result = await loadReferralReviews({ referral: { findMany: async () => { throw new Error("database unavailable"); } } }, "waitlist-1");
  assert.deepEqual(result, { reviews: [], failed: true });
});
