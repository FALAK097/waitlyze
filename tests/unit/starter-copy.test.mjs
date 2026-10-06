import test from "node:test";
import assert from "node:assert/strict";
import { snapshotTemplate } from "../../src/lib/templates/catalog.mjs";
import { findUnchangedStarterCopy } from "../../src/lib/templates/starter-copy.mjs";

test("starter copy review identifies unchanged visitor-facing template text", () => {
  const snapshot = snapshotTemplate("saas");
  const unchanged = findUnchangedStarterCopy(snapshot);

  assert.ok(unchanged.some(({ value }) => value === "Introduce your product and the problem it solves."));
  assert.ok(unchanged.some(({ value }) => value === "Describe the product in a sentence."));
  assert.ok(!unchanged.some(({ value }) => value === "Email address"));
});

test("starter copy review stops flagging lines after they are edited and follows reordered sections", () => {
  const snapshot = snapshotTemplate("saas");
  snapshot.sections.reverse();
  snapshot.sections.find((section) => section.type === "hero").body = "A clear introduction for our new product.";

  const unchanged = findUnchangedStarterCopy(snapshot);

  assert.ok(!unchanged.some(({ label }) => label === "Introduction copy"));
  assert.ok(unchanged.some(({ label }) => label === "Introduction headline"));
  assert.ok(unchanged.some(({ label }) => label === "Highlight 1 description"));
});
