import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { createDraft } from "../../src/lib/campaigns/create-draft.mjs";
import { saveDraftSnapshot } from "../../src/lib/campaigns/save-draft-snapshot.mjs";
import { pauseCampaign, PublicationConflict, publishCampaign, rollbackCampaign } from "../../src/lib/campaigns/publication.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });

test("publications freeze edits, pause safely, and restore immutable versions", async (t) => {
  const actor = `fixture-${randomUUID()}`;
  const outsider = `fixture-${randomUUID()}`;
  const admin = `fixture-${randomUUID()}`;
  const member = `fixture-${randomUUID()}`;
  t.after(async () => {
    await db.waitList.deleteMany({ where: { userId: { in: [actor, outsider, admin, member] } } });
    await db.workspace.deleteMany({ where: { personalOwnerId: { in: [actor, outsider, admin, member] } } });
    await db.user.deleteMany({ where: { id: { in: [actor, outsider, admin, member] } } });
    await db.$disconnect();
  });
  for (const id of [actor, outsider, admin, member]) await db.user.create({ data: { id, email: `${id}@example.invalid` } });
  const workspace = await createWorkspaceService(db).ensurePersonal(actor);
  await db.workspaceMember.createMany({ data: [
    { workspaceId: workspace.id, userId: admin, role: "ADMIN" },
    { workspaceId: workspace.id, userId: member, role: "MEMBER" },
  ] });
  const draft = await createDraft(db, actor, workspace.id, { name: "Versioned launch", description: "Public page", publicSlug: `launch-${randomUUID()}`, templateId: "saas", creationKey: randomUUID() });
  await assert.rejects(publishCampaign(db, outsider, undefined, draft.id, 1), { status: 404 });
  await assert.rejects(publishCampaign(db, member, undefined, draft.id, 1), { status: 404 });

  const first = await publishCampaign(db, admin, undefined, draft.id, 1);
  assert.deepEqual(first, { revision: 1, unchanged: false });
  const publishedOne = await db.waitListPublicationRevision.findUnique({ where: { waitListId_revision: { waitListId: draft.id, revision: 1 } } });
  const changedSnapshot = structuredClone(draft.templateSnapshot);
  changedSnapshot.sections[0].heading = "A better launch";
  await saveDraftSnapshot(db, actor, workspace.id, draft.id, 1, changedSnapshot);
  assert.deepEqual((await db.waitListPublicationRevision.findUnique({ where: { waitListId_revision: { waitListId: draft.id, revision: 1 } } })).snapshot, publishedOne.snapshot);
  await assert.rejects(publishCampaign(db, actor, undefined, draft.id, 1), PublicationConflict);
  assert.deepEqual(await publishCampaign(db, actor, undefined, draft.id, 2), { revision: 2, unchanged: false });

  await pauseCampaign(db, actor, undefined, draft.id);
  const paused = await db.waitList.findUnique({ where: { id: draft.id } });
  assert.equal(paused.status, "PAUSED");
  assert.equal(paused.publishedRevision, 2);
  const restored = await rollbackCampaign(db, actor, undefined, draft.id);
  assert.equal(restored.revision, 1);
  assert.equal((await db.waitList.findUnique({ where: { id: draft.id } })).status, "PAUSED");
  assert.equal(restored.templateRevision, 3);
  assert.equal(restored.snapshot.sections[0].heading, draft.templateSnapshot.sections[0].heading);
  assert.deepEqual(await publishCampaign(db, actor, undefined, draft.id, 3), { revision: 3, unchanged: false });
  assert.equal((await db.waitList.findUnique({ where: { id: draft.id } })).status, "PUBLISHED");
  assert.equal(await db.waitListPublicationRevision.count({ where: { waitListId: draft.id } }), 3);
});
