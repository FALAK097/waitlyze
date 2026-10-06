import test from "node:test";
import assert from "node:assert/strict";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { createWorkspaceService, campaignScope, AccessError } from "../../src/lib/workspaces/service.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });
const service = createWorkspaceService(db);

test("workspace migration and authorization with real PostgreSQL", async (t) => {
  const ids = Array.from({ length: 4 }, () => `fixture-${randomUUID()}`);
  const [owner, admin, member, outsider] = ids;
  const campaigns = [];
  t.after(async () => {
    await db.waitList.deleteMany({ where: { userId: { in: ids } } });
    await db.workspace.deleteMany({ where: { personalOwnerId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  });
  for (const id of ids) await db.user.create({ data: { id, email: `${id}@example.invalid` } });
  for (const userId of [owner, outsider]) campaigns.push(await db.waitList.create({ data: { userId, name: "Legacy fixture" } }));
  const signup = await db.signUp.create({ data: { uniqueUserId: "fixture-visitor", email: "subscriber@example.invalid", waitListId: campaigns[0].id } });
  const workspace = await service.ensurePersonal(owner);
  const otherWorkspace = await service.ensurePersonal(outsider);
  await db.workspaceMember.createMany({ data: [
    { workspaceId: workspace.id, userId: admin, role: "ADMIN" },
    { workspaceId: workspace.id, userId: member, role: "MEMBER" },
  ] });

  await t.test("backfill preserves campaign/signup IDs and is repeatable", async () => {
    assert.equal((await service.ensurePersonal(owner)).id, workspace.id);
    assert.equal(await db.workspace.count({ where: { personalOwnerId: owner } }), 1);
    assert.equal((await db.waitList.findUnique({ where: { id: campaigns[0].id } })).workspaceId, workspace.id);
    assert.equal((await db.signUp.findUnique({ where: { id: signup.id } })).waitListId, campaigns[0].id);
  });
  await t.test("role matrix covers audience, editing, sending and ownership", async () => {
    for (const permission of ["viewCampaign", "editCampaign", "viewAudience"]) {
      for (const id of [owner, admin, member]) assert.equal((await service.requireAccess(id, workspace.id, permission)).id, workspace.id);
    }
    for (const permission of ["manageAudience", "sendEmail", "deleteCampaign", "manageConnections"]) {
      for (const id of [owner, admin]) await service.requireAccess(id, workspace.id, permission);
      await assert.rejects(service.requireAccess(member, workspace.id, permission), { status: 404 });
    }
    await service.requireAccess(owner, workspace.id, "manageOwnership");
    for (const id of [admin, member, outsider]) await assert.rejects(service.requireAccess(id, workspace.id, "manageOwnership"), { status: 404 });
  });
  await t.test("workspace rename is scoped to owners and admins", async () => {
    assert.deepEqual(await service.renameWorkspace(admin, workspace.id, "  Launch team  "), { id: workspace.id, name: "Launch team" });
    assert.equal((await db.workspace.findUnique({ where: { id: workspace.id } })).name, "Launch team");
    await service.renameWorkspace(owner, workspace.id, "Founders");
    for (const id of [member, outsider]) {
      await assert.rejects(service.renameWorkspace(id, workspace.id, "Not yours"), { status: 404 });
    }
    await assert.rejects(service.renameWorkspace(owner, workspace.id, "  "), /1 to 80 characters/);
    await assert.rejects(service.renameWorkspace(owner, workspace.id, "x".repeat(81)), /1 to 80 characters/);
    assert.equal((await db.workspace.findUnique({ where: { id: workspace.id } })).name, "Founders");
  });
  await t.test("forged workspace/campaign IDs and anonymous actors fail closed", async () => {
    await assert.rejects(service.campaign(outsider, campaigns[0].id), { status: 404 });
    await assert.rejects(service.campaign(owner, campaigns[0].id, "viewCampaign", otherWorkspace.id), { status: 404 });
    await assert.rejects(service.requireAccess(owner, otherWorkspace.id, "viewCampaign"), { status: 404 });
    await assert.rejects(service.list(undefined), { status: 401 });
    assert.throws(() => campaignScope(null, "viewCampaign"), AccessError);
    assert.equal((await service.list(member)).length, 1);
  });
  await t.test("nested audience reads and mutations remain tenant/role scoped", async () => {
    const scope = (id, permission) => ({ waitList: campaignScope(id, permission) });
    assert.equal(await db.signUp.count({ where: scope(member, "viewAudience") }), 1);
    assert.equal(await db.signUp.count({ where: scope(outsider, "viewAudience") }), 0);
    assert.equal((await db.signUp.deleteMany({ where: { id: signup.id, ...scope(member, "manageAudience") } })).count, 0);
    assert.equal((await db.signUp.deleteMany({ where: { id: signup.id, ...scope(outsider, "manageAudience") } })).count, 0);
    assert.ok(await db.signUp.findUnique({ where: { id: signup.id } }));
  });
  await t.test("unlinked legacy records stay owner-only", async () => {
    const legacy = await db.waitList.create({ data: { userId: owner } });
    assert.equal((await service.campaign(owner, legacy.id)).id, legacy.id);
    await assert.rejects(service.campaign(admin, legacy.id), { status: 404 });
    await assert.rejects(service.campaign(owner, legacy.id, "viewCampaign", workspace.id), { status: 404 });
  });
  await t.test("historical ownership does not bypass revoked membership", async () => {
    await db.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: owner } } });
    await assert.rejects(service.campaign(owner, campaigns[0].id), { status: 404 });
    await assert.rejects(service.ensurePersonal(owner), /ownership requires review/);
    await db.workspaceMember.create({ data: { workspaceId: workspace.id, userId: owner, role: "MEMBER" } });
    await assert.rejects(service.ensurePersonal(owner), /ownership requires review/);
    assert.equal((await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: owner } } })).role, "MEMBER");
    await db.workspaceMember.update({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: owner } }, data: { role: "OWNER" } });
  });
  await t.test("concurrent personal workspace initialization produces one mapping", async () => {
    const initialized = await Promise.all(Array.from({ length: 3 }, () => service.ensurePersonal(admin)));
    assert.equal(new Set(initialized.map((item) => item.id)).size, 1);
    assert.equal(await db.workspace.count({ where: { personalOwnerId: admin } }), 1);
  });
});
