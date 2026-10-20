import assert from "node:assert/strict";
import { test } from "node:test";

import { ZodError } from "zod";

import { snapshotTemplate } from "../templates/catalog.mjs";
import {
  DraftRevisionConflict,
  replaceInvalidDraftSnapshot,
  saveDraftSnapshot,
} from "./save-draft-snapshot.mjs";

function database(snapshot, revision = 1, count = 1) {
  const updates = [],
    history = [];
  const current = { id: "waitlist", templateRevision: revision, templateSnapshot: snapshot };
  const tx = {
    waitList: {
      findFirst: async ({ where }) => {
        assert.equal(where.workspaceId, "workspace");
        assert.equal(where.workspace.members.some.userId, "actor");
        return current;
      },
      updateMany: async (update) => {
        updates.push(update);
        return { count };
      },
    },
    waitListRevision: {
      create: async ({ data }) => {
        history.push(data);
      },
      deleteMany: async () => {},
    },
  };
  return { $transaction: async (run) => run(tx), updates, history };
}
const save = (db, snapshot, revision = 1) =>
  saveDraftSnapshot(db, "actor", "workspace", "waitlist", revision, snapshot);
const replace = (db, snapshot, revision = 1) =>
  replaceInvalidDraftSnapshot(db, "actor", "workspace", "waitlist", revision, snapshot);

test("autosave refuses invalid stored snapshots without writing anything", async () => {
  for (const stored of [
    null,
    {},
    { schemaVersion: 1 },
    { ...snapshotTemplate("simple"), sections: [] },
  ]) {
    const db = database(stored);
    await assert.rejects(save(db, snapshotTemplate("simple")), ZodError);
    assert.equal(db.updates.length, 0);
    assert.equal(db.history.length, 0);
  }
});

test("explicit replacement preserves the unreadable record in revision history", async () => {
  const stored = { schemaVersion: 1, sections: ["unreadable original"] };
  const db = database(stored);
  const replacement = snapshotTemplate("simple");
  const result = await replace(db, replacement);
  assert.deepEqual(result, { revision: 2, snapshot: replacement, unchanged: false });
  assert.deepEqual(db.history, [{ waitListId: "waitlist", revision: 1, snapshot: stored }]);
  assert.equal(db.updates[0].where.templateRevision, 1);
});

test("replacement rejects invalid input, valid stored pages, and stale revisions", async () => {
  const valid = snapshotTemplate("simple");
  const validDb = database(valid);
  await assert.rejects(replace(validDb, valid), /now valid/);
  assert.equal(validDb.updates.length, 0);
  const invalidDb = database({});
  await assert.rejects(replace(invalidDb, {}), ZodError);
  assert.equal(invalidDb.updates.length, 0);
  const staleDb = database({}, 2);
  await assert.rejects(replace(staleDb, valid), DraftRevisionConflict);
  assert.equal(staleDb.updates.length, 0);
});

test("ordinary saves retain no-op, conflict, and revision-history behavior", async () => {
  const original = snapshotTemplate("simple");
  const unchanged = database(original);
  assert.equal((await save(unchanged, original)).unchanged, true);
  assert.equal(unchanged.updates.length, 0);
  const edited = structuredClone(original);
  edited.seo.title = "Our launch";
  const db = database(original);
  assert.equal((await save(db, edited)).revision, 2);
  assert.deepEqual(db.history[0].snapshot, original);
  const stale = database(original, 2);
  await assert.rejects(save(stale, edited), DraftRevisionConflict);
  assert.equal(stale.updates.length, 0);
  const raced = database(original, 1, 0);
  await assert.rejects(save(raced, edited), DraftRevisionConflict);
  assert.equal(raced.history.length, 0);
});

test("reads and saves a legacy draft while retaining the original in history", async () => {
  const legacy = {
    schemaVersion: 1,
    templateId: "newsletter",
    templateVersion: 1,
    sections: [
      { type: "hero", heading: "Original", body: "Original content" },
      { type: "form", label: "Your email", buttonText: "Subscribe" },
    ],
    theme: { surface: "white", text: "ink", action: "lime", font: "geist" },
    form: { fields: ["email"], referrals: false, verification: false },
    thankYou: { heading: "Thank you", body: "Original message" },
    email: { enabled: false, subject: "Original subject", body: "Original email" },
  };
  const db = database(legacy);
  const result = await save(db, legacy);
  assert.equal(result.snapshot.schemaVersion, 2);
  assert.equal(result.snapshot.form.label, "Your email");
  assert.equal(result.snapshot.statusPage.heading, "Thank you");
  assert.deepEqual(result.snapshot.legacy, legacy);
  assert.deepEqual(db.history[0].snapshot, legacy);
});

test("explicit replacement also handles a missing snapshot without an invalid JSON history write", async () => {
  const db = database(null);
  assert.equal((await replace(db, snapshotTemplate("simple"))).revision, 2);
  assert.equal(db.history.length, 0);
});
