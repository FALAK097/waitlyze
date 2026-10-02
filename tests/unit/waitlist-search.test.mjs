import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWaitlistSearch, waitlistSearchWhere, WAITLIST_SEARCH_LIMIT, normalizeWaitlistStatus, waitlistStatusWhere } from "../../src/lib/waitlist-search.mjs";

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

test("waitlist status filters accept only known campaign states", () => {
  assert.equal(normalizeWaitlistStatus(undefined), "");
  assert.equal(normalizeWaitlistStatus("PUBLISHED"), "PUBLISHED");
  assert.equal(normalizeWaitlistStatus("ADMIN"), "");
  assert.deepEqual(waitlistStatusWhere(""), {});
  assert.deepEqual(waitlistStatusWhere("PAUSED"), { status: "PAUSED" });
});
