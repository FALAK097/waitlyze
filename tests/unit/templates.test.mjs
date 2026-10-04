import test from "node:test";
import assert from "node:assert/strict";
import { listTemplates, snapshotTemplate, templateSnapshotSchema } from "../../src/lib/templates/catalog.mjs";

test("seven purposeful starters have valid versions and safe feature defaults", () => {
  assert.deepEqual(listTemplates().map((item) => item.id), ["saas", "mobile", "ai", "community", "consumer", "newsletter", "blank"]);
  for (const { snapshot } of listTemplates()) {
    assert.equal(templateSnapshotSchema.safeParse(snapshot).success, true);
    assert.equal(snapshot.form.referrals, false);
    assert.equal(snapshot.form.verification, false);
    assert.equal(snapshot.email.enabled, false);
  }
});

test("applied snapshots and catalog consumers cannot change future starters", () => {
  const first = snapshotTemplate("saas");
  first.sections[0].heading = "Edited by a founder";
  listTemplates()[0].snapshot.sections[0].heading = "Edited catalog copy";
  assert.notEqual(snapshotTemplate("saas").sections[0].heading, first.sections[0].heading);
});

test("unknown templates, injected section payloads and invalid forms fail validation", () => {
  assert.throws(() => snapshotTemplate("untrusted"));
  const snapshot = snapshotTemplate("blank");
  assert.equal(templateSnapshotSchema.safeParse({ ...snapshot, userId: "forged" }).success, false);
  assert.equal(templateSnapshotSchema.safeParse({ ...snapshot, sections: [{ type: "html", html: "<script>bad()</script>" }] }).success, false);
  assert.equal(templateSnapshotSchema.safeParse({ ...snapshot, sections: [snapshot.sections[0], snapshot.sections[1], snapshot.sections[1]] }).success, false);
  assert.equal(templateSnapshotSchema.safeParse({ ...snapshot, form: { ...snapshot.form, referrals: true } }).success, false);
});
