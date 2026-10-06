import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { campaignScope, createWorkspaceService } from "../../src/lib/workspaces/service.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });

test("custom domains remain workspace-scoped and globally unique", async (t) => {
  const [owner, admin, member, outsider] = Array.from({ length: 4 }, () => `fixture-${randomUUID()}`);
  const ids = [owner, admin, member, outsider];
  t.after(async () => {
    await db.waitList.deleteMany({ where: { userId: { in: ids } } });
    await db.workspace.deleteMany({ where: { personalOwnerId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  });
  for (const id of ids) await db.user.create({ data: { id, email: `${id}@example.invalid` } });
  const workspace = await createWorkspaceService(db).ensurePersonal(owner);
  await db.workspaceMember.createMany({ data: [
    { workspaceId: workspace.id, userId: admin, role: "ADMIN" },
    { workspaceId: workspace.id, userId: member, role: "MEMBER" },
  ] });
  const first = await db.waitList.create({ data: { userId: owner, workspaceId: workspace.id, name: "First", publicSlug: `domain-${randomUUID()}` } });
  const second = await db.waitList.create({ data: { userId: owner, workspaceId: workspace.id, name: "Second", publicSlug: `domain-${randomUUID()}` } });
  const otherWorkspace = await createWorkspaceService(db).ensurePersonal(outsider);
  const other = await db.waitList.create({ data: { userId: outsider, workspaceId: otherWorkspace.id, name: "Other", publicSlug: `domain-${randomUUID()}` } });
  const hostname = `launch-${randomUUID()}.example.invalid`;
  const domain = await db.customDomain.create({ data: { hostname, workspaceId: workspace.id, waitListId: first.id } });
  assert.equal(domain.status, "NEEDS_DNS");
  await assert.rejects(db.customDomain.create({ data: { hostname, workspaceId: workspace.id, waitListId: second.id } }), { code: "P2002" });
  await assert.rejects(db.customDomain.create({ data: { hostname: `other-${randomUUID()}.example.invalid`, workspaceId: workspace.id, waitListId: first.id } }), { code: "P2002" });
  await assert.rejects(db.customDomain.create({ data: { hostname, workspaceId: otherWorkspace.id, waitListId: other.id } }), { code: "P2002" });

  for (const actor of [owner, admin]) {
    assert.ok(await db.waitList.findFirst({ where: { id: first.id, ...campaignScope(actor, "manageConnections", workspace.id) } }));
  }
  for (const actor of [member, outsider]) {
    assert.equal(await db.waitList.findFirst({ where: { id: first.id, ...campaignScope(actor, "manageConnections", workspace.id) } }), null);
  }
  const ready = await db.customDomain.update({ where: { id: domain.id }, data: { status: "ACTIVE", lastCheckedAt: new Date() } });
  assert.equal(ready.status, "ACTIVE");
});
