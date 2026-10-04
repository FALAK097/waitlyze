import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { createDraft } from "../../src/lib/campaigns/create-draft.mjs";
import { runLaunchRehearsal } from "../../src/lib/campaigns/launch-rehearsal.mjs";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });

test("launch rehearsals save isolated checks without creating signups or outbox work", async (t) => {
  const userId = `rehearsal-${randomUUID()}`;
  let draft;
  t.after(async () => {
    if (draft) await db.waitList.delete({ where: { id: draft.id } });
    await db.workspace.deleteMany({ where: { personalOwnerId: userId } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: userId, email: `${userId}@example.invalid` } });
  const workspace = await createWorkspaceService(db).ensurePersonal(userId);
  draft = await createDraft(db, userId, workspace.id, {
    name: "Rehearsal fixture", description: "Isolated launch check", publicSlug: `rehearsal-${randomUUID().slice(0, 8)}`,
    templateId: "saas", creationKey: randomUUID(),
  });
  const before = {
    signups: await db.signUp.count({ where: { waitListId: draft.id } }),
    outbox: await db.outboxEvent.count(),
    verifications: await db.signUpVerification.count(),
  };
  const run = await runLaunchRehearsal(db, draft.id);
  assert.equal(run.status, "PASSED");
  assert.equal(run.checksPassed, 3);
  assert.equal(run.checksFailed, 0);
  assert.deepEqual((await db.launchRehearsal.findMany({ where: { waitListId: draft.id } })).map(({ status }) => status), ["PASSED"]);
  assert.deepEqual({
    signups: await db.signUp.count({ where: { waitListId: draft.id } }),
    outbox: await db.outboxEvent.count(),
    verifications: await db.signUpVerification.count(),
  }, before);

  await db.waitList.update({ where: { id: draft.id }, data: { templateSnapshot: { invalid: true } } });
  const retry = await runLaunchRehearsal(db, draft.id);
  assert.equal(retry.status, "NEEDS_ATTENTION");
  assert.equal(retry.checksFailed, 2);
  assert.equal((await db.signUp.count({ where: { waitListId: draft.id } })), before.signups);
  assert.equal((await db.outboxEvent.count()), before.outbox);
});
