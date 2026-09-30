import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { createDraft } from "../../src/lib/campaigns/create-draft.mjs";
import { DraftRevisionConflict, saveDraftSnapshot } from "../../src/lib/campaigns/save-draft-snapshot.mjs";
import bcrypt from "bcryptjs";
import { validatePublishedApiKey } from "../../src/lib/campaigns/api-key.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });

test("draft migration preserves existing publication and changes only new defaults", async () => {
  const schema = `fixture_migration_${randomUUID().replaceAll("-", "")}`;
  const sql = await readFile(new URL("../../prisma/migrations/20260927161500_campaign_drafts/migration.sql", import.meta.url), "utf8");
  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
    await tx.$executeRawUnsafe('CREATE TABLE wait_lists (id TEXT PRIMARY KEY, "workspaceId" TEXT)');
    await tx.$executeRawUnsafe("INSERT INTO wait_lists (id) VALUES ('legacy-id')");
    for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter((part) => part.trim())) await tx.$executeRawUnsafe(statement);
    await tx.$executeRawUnsafe("INSERT INTO wait_lists (id) VALUES ('new-id')");
    const rows = await tx.$queryRawUnsafe('SELECT id, status::text AS status, "publicSlug", "templateSnapshot" FROM wait_lists ORDER BY id');
    assert.deepEqual(rows, [
      { id: "legacy-id", status: "PUBLISHED", publicSlug: null, templateSnapshot: null },
      { id: "new-id", status: "DRAFT", publicSlug: null, templateSnapshot: null },
    ]);
    await tx.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  });
});

test("real database draft creation owns authority, retries and slug conflicts", async (t) => {
  const actor = `fixture-${randomUUID()}`;
  const outsider = `fixture-${randomUUID()}`;
  t.after(async () => {
    await db.waitList.deleteMany({ where: { userId: { in: [actor, outsider] } } });
    await db.workspace.deleteMany({ where: { personalOwnerId: { in: [actor, outsider] } } });
    await db.user.deleteMany({ where: { id: { in: [actor, outsider] } } });
    await db.$disconnect();
  });
  for (const id of [actor, outsider]) await db.user.create({ data: { id, email: `${id}@example.invalid` } });
  const workspace = await createWorkspaceService(db).ensurePersonal(actor);
  const input = { name: "Private launch", description: "A real draft", publicSlug: `launch-${randomUUID()}`, templateId: "saas", creationKey: randomUUID() };
  let draft;
  await t.test("parallel retries create one private draft with trusted safe defaults", async () => {
    const records = await Promise.all(Array.from({ length: 3 }, () => createDraft(db, actor, workspace.id, input)));
    assert.equal(new Set(records.map((item) => item.id)).size, 1);
    draft = records[0];
    assert.equal(draft.status, "DRAFT");
    assert.equal(draft.userId, actor);
    assert.equal(draft.workspaceId, workspace.id);
    assert.equal(draft.templateSnapshot.templateId, "saas");
    assert.equal(draft.sendEmailsToSubscribers, false);
    assert.equal(draft.showReferrals, false);
    assert.equal(draft.showSocialProof, false);
    assert.equal(await db.waitList.count({ where: { workspaceId: workspace.id } }), 1);
  });
  await t.test("autosave versions snapshots and recovers concurrent edits without lost updates", async () => {
    const initial = draft.templateSnapshot;
    const first = structuredClone(initial);
    first.sections[0].heading = "Saved first";
    const saved = await saveDraftSnapshot(db, actor, workspace.id, draft.id, 1, first);
    assert.equal(saved.revision, 2);
    assert.equal((await db.waitListRevision.findUnique({ where: { waitListId_revision: { waitListId: draft.id, revision: 1 } } })).snapshot.sections[0].heading, initial.sections[0].heading);
    const stale = structuredClone(initial);
    stale.sections[0].heading = "Stale edit";
    await assert.rejects(saveDraftSnapshot(db, actor, workspace.id, draft.id, 1, stale), DraftRevisionConflict);
    const left = structuredClone(first); left.sections[0].heading = "Concurrent left";
    const right = structuredClone(first); right.sections[0].heading = "Concurrent right";
    const results = await Promise.allSettled([
      saveDraftSnapshot(db, actor, workspace.id, draft.id, 2, left),
      saveDraftSnapshot(db, actor, workspace.id, draft.id, 2, right),
    ]);
    assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
    assert.equal(results.filter((item) => item.status === "rejected" && item.reason instanceof DraftRevisionConflict).length, 1);
    const latest = await db.waitList.findUnique({ where: { id: draft.id } });
    assert.equal(latest.templateRevision, 3);
    assert.ok(["Concurrent left", "Concurrent right"].includes(latest.templateSnapshot.sections[0].heading));
    const unchanged = await saveDraftSnapshot(db, actor, workspace.id, draft.id, 3, latest.templateSnapshot);
    assert.equal(unchanged.unchanged, true);
    await assert.rejects(saveDraftSnapshot(db, outsider, workspace.id, draft.id, 3, latest.templateSnapshot), { status: 404 });
  });
  await t.test("API-key ingestion rejects drafts and still accepts published legacy rows", async () => {
    const apiKey = `wl_${randomUUID()}`;
    await db.apiKey.create({ data: { name: "Draft test key", keyHash: await bcrypt.hash(apiKey, 4), userId: actor } });
    const rejected = await validatePublishedApiKey(apiKey, draft.id, db);
    assert.equal(rejected.success, false);
    await db.waitList.update({ where: { id: draft.id }, data: { status: "PUBLISHED" } });
    const accepted = await validatePublishedApiKey(apiKey, draft.id, db);
    assert.equal(accepted.success, true);
    assert.equal(accepted.waitlist.id, draft.id);
  });
  await t.test("v2 API keys are secret-hashed, scope-limited, waitlist-bound and revocable", async () => {
    const other = await db.waitList.create({ data: { userId: actor, workspaceId: workspace.id, status: "PUBLISHED", name: "Another launch" } });
    const keyId = randomBytes(16).toString("hex");
    const secret = randomBytes(32).toString("base64url");
    const token = `wl2_${keyId}_${secret}`;
    const key = await db.apiKey.create({ data: {
      name: "Launch integration",
      userId: actor,
      waitlistId: draft.id,
      keyId,
      keyHash: createHash("sha256").update(secret).digest("hex"),
      scopes: ["waitlist:write"],
      expiresAt: new Date(Date.now() + 60_000),
    } });
    assert.equal(key.keyHash.includes(secret), false);
    const accepted = await validatePublishedApiKey(token, draft.id, db);
    assert.equal(accepted.success, true);
    assert.deepEqual(accepted.scopes, ["waitlist:write"]);
    assert.equal((await db.apiKey.findUnique({ where: { id: key.id } })).lastUsedAt instanceof Date, true);
    assert.equal((await validatePublishedApiKey(token, other.id, db)).success, false);
    assert.equal((await validatePublishedApiKey(`${token}x`, draft.id, db)).success, false);
    await db.apiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() } });
    assert.equal((await validatePublishedApiKey(token, draft.id, db)).success, false);
  });
  await t.test("changed retry payload and duplicate address do not overwrite the draft", async () => {
    await assert.rejects(createDraft(db, actor, workspace.id, { ...input, name: "Changed" }), /request has changed/);
    await assert.rejects(createDraft(db, actor, workspace.id, { ...input, creationKey: randomUUID() }), (error) => error.field === "publicSlug");
    assert.equal((await db.waitList.findUnique({ where: { id: draft.id } })).name, input.name);
  });
  await t.test("forged workspace and revoked membership also deny retries", async () => {
    await assert.rejects(createDraft(db, outsider, workspace.id, input), { status: 404 });
    await db.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: actor } } });
    await assert.rejects(createDraft(db, actor, workspace.id, input), { status: 404 });
    assert.equal(await db.waitList.count({ where: { workspaceId: workspace.id } }), 1);
  });
});
