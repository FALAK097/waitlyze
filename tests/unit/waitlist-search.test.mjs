import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWaitlistSearch, waitlistSearchWhere, WAITLIST_SEARCH_LIMIT } from "../../src/lib/waitlist-search.mjs";

test("waitlist search trims empty input and bounds user supplied queries", () => {
  assert.equal(normalizeWaitlistSearch(undefined), "");
  assert.equal(normalizeWaitlistSearch("   "), "");
  assert.equal(normalizeWaitlistSearch("  Launch  "), "Launch");
  assert.equal(normalizeWaitlistSearch("x".repeat(WAITLIST_SEARCH_LIMIT + 1)).length, WAITLIST_SEARCH_LIMIT);
});

test("waitlist search adds only a case-insensitive name predicate", () => {
  assert.deepEqual(waitlistSearchWhere(""), {});
  assert.deepEqual(waitlistSearchWhere("Launch"), { name: { contains: "Launch", mode: "insensitive" } });
});
