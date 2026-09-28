import test from "node:test";
import assert from "node:assert/strict";
import { audienceWhere, csvCell, parseAudienceFilters, subscriberCsvRow } from "../../src/lib/audience-query.mjs";

test("audience filters validate bounded search and known statuses", () => {
  assert.deepEqual(parseAudienceFilters(new URLSearchParams("q=hello&status=verified")), { query: "hello", status: "verified" });
  assert.equal(parseAudienceFilters(new URLSearchParams(`q=${"x".repeat(121)}`)).error, "Search must be 120 characters or fewer.");
  assert.equal(parseAudienceFilters(new URLSearchParams("status=admin")).error, "Invalid subscriber status.");
});

test("audience queries always combine campaign, workspace scope, and requested status", () => {
  const scope = { workspaceId: "workspace-1", workspace: { members: { some: { userId: "owner-1" } } } };
  assert.deepEqual(audienceWhere("waitlist-1", scope, { query: "a@b.test", status: "pending" }), {
    waitListId: "waitlist-1", waitList: scope, verifiedAt: null,
    email: { contains: "a@b.test", mode: "insensitive" },
  });
  assert.deepEqual(audienceWhere("waitlist-1", scope, { query: "", status: "verified" }), {
    waitListId: "waitlist-1", waitList: scope, verifiedAt: { not: null },
  });
});

test("CSV cells quote delimiters and neutralize spreadsheet formulas", () => {
  assert.equal(csvCell('hello,"world"'), '"hello,""world"""');
  for (const payload of ["=1+1", "+SUM(A1:A2)", "-cmd", "@SUM(1,2)", " \t=1+1", "\r@x", "\ufeff=1+1"]) {
    assert.equal(csvCell(payload).startsWith("\"'"), true, payload);
  }
  const row = subscriberCsvRow({ email: "=HYPERLINK(\"x\")", verifiedAt: null, createdAt: new Date("2026-01-01T00:00:00.000Z") });
  assert.equal(row, '"\'=HYPERLINK(""x"")","Needs confirmation","2026-01-01T00:00:00.000Z"');
});
