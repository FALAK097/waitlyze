import assert from "node:assert/strict";
import { test } from "node:test";

import { assessWaitlistReadiness } from "../campaigns/readiness.mjs";
import { listTemplates, snapshotTemplate, templateSnapshotSchema } from "./catalog.mjs";

function legacySnapshot(templateId = "newsletter") {
  return {
    schemaVersion: 1,
    templateId,
    templateVersion: 3,
    sections: [
      { type: "hero", heading: "Our original heading", body: "Our original introduction" },
      { type: "features", items: [{ title: "Benefit", body: "A custom benefit" }] },
      { type: "faq", items: [{ question: "When?", answer: "Soon." }] },
      { type: "form", label: "Your best email", buttonText: "Count me in" },
      { type: "footer", note: "Original footer" },
    ],
    theme: { surface: "white", text: "ink", action: "lime", font: "geist" },
    form: { fields: ["email"], referrals: false, verification: false },
    thankYou: { heading: "Welcome aboard!", body: "Keep an eye on your inbox." },
    email: { enabled: false, subject: "Saved subject", body: "Saved email body" },
  };
}

test("reads every legacy template and section without losing saved content", () => {
  for (const templateId of [
    "saas",
    "mobile",
    "ai",
    "community",
    "consumer",
    "newsletter",
    "blank",
  ]) {
    const original = legacySnapshot(templateId);
    const source = structuredClone(original);
    const migrated = templateSnapshotSchema.parse(original);
    assert.equal(migrated.schemaVersion, 2);
    assert.equal(
      migrated.templateId,
      { consumer: "commerce", newsletter: "creator" }[templateId] || templateId,
    );
    assert.equal(migrated.templateVersion, original.templateVersion);
    assert.deepEqual(
      migrated.sections.map((section) => section.type),
      original.sections.map((section) => section.type),
    );
    assert.equal(migrated.sections[0].heading, original.sections[0].heading);
    assert.equal(migrated.sections[0].body, original.sections[0].body);
    assert.deepEqual(migrated.sections[1].items, original.sections[1].items);
    assert.deepEqual(migrated.sections[2].items, original.sections[2].items);
    assert.equal(migrated.sections[4].note, original.sections[4].note);
    assert.equal(migrated.form.label, original.sections[3].label);
    assert.equal(migrated.form.buttonText, original.sections[3].buttonText);
    assert.equal(migrated.form.verification, false);
    assert.equal(migrated.statusPage.heading, original.thankYou.heading);
    assert.equal(migrated.statusPage.body, original.thankYou.body);
    assert.equal(migrated.statusPage.showReferralLink, false);
    assert.ok(migrated.sections.every((section) => section.visible));
    assert.equal(
      new Set(migrated.sections.map((section) => section.id)).size,
      original.sections.length,
    );
    assert.deepEqual(migrated.legacy, original);
    const readiness = assessWaitlistReadiness({
      id: "legacy",
      status: "DRAFT",
      templateSnapshot: original,
    });
    assert.equal(readiness.find((check) => check.key === "signup-form").status, "ready");
    assert.deepEqual(original, source);
    assert.deepEqual(templateSnapshotSchema.parse(migrated), migrated);
  }
});

test("leaves every v2 starter snapshot unchanged", () => {
  for (const { snapshot } of listTemplates()) {
    assert.deepEqual(templateSnapshotSchema.parse(snapshot), snapshot);
  }
});

test("rejects malformed legacy content rather than replacing it with defaults", () => {
  const original = legacySnapshot();
  original.sections[1].items[0].body = "";
  assert.equal(templateSnapshotSchema.safeParse(original).success, false);
  original.sections.splice(1, 1);
  original.email.enabled = true;
  assert.equal(templateSnapshotSchema.safeParse(original).success, false);
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
