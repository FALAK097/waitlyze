import assert from "node:assert/strict";
import { test } from "node:test";

import { listTemplates, snapshotTemplate, templateSnapshotSchema } from "./catalog.mjs";

test("leaves every v2 starter snapshot unchanged", () => {
  for (const { snapshot } of listTemplates()) {
    assert.deepEqual(templateSnapshotSchema.parse(snapshot), snapshot);
  }
});

test("rejects excessive blocks and edits that remove the last visible signup form", () => {
  const snapshot = snapshotTemplate("simple");
  snapshot.sections[0].showForm = false;
  const parsed = templateSnapshotSchema.safeParse(snapshot);
  assert.equal(parsed.success, false);
  assert.ok(
    parsed.error.issues.some(
      (issue) => issue.message === "Add a visible signup form before publishing.",
    ),
  );
  snapshot.sections[0].showForm = true;
  snapshot.sections = Array.from({ length: 25 }, (_, index) => ({
    ...snapshot.sections[0],
    id: `hero-${index}`,
  }));
  assert.equal(templateSnapshotSchema.safeParse(snapshot).success, false);
});

test("accepts persisted Google Font family names", () => {
  const snapshot = snapshotTemplate("simple");
  snapshot.brand.headingFont = "DM Sans";
  snapshot.brand.bodyFont = "Source Serif 4";
  const parsed = templateSnapshotSchema.parse(snapshot);
  assert.equal(parsed.brand.headingFont, "DM Sans");
  assert.equal(parsed.brand.bodyFont, "Source Serif 4");
});
