import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { startFixtureServer, signedCookie } from "../support/http-fixture.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });
const service = createWorkspaceService(db);
const base = "http://127.0.0.1:3100";


test("real audience HTTP routes authenticate and enforce workspace permissions", async (t) => {
  const ids = Array.from({ length: 4 }, () => `fixture-${randomUUID()}`);
  const [owner, admin, member, outsider] = ids;
  let server;
  t.after(async () => {
    if (server && server.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
    await db.waitList.deleteMany({ where: { userId: { in: ids } } });
    await db.workspace.deleteMany({ where: { personalOwnerId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  });
  const cookies = {};
  for (const id of ids) {
    await db.user.create({ data: { id, email: `${id}@example.invalid` } });
    const token = randomUUID();
    await db.session.create({ data: { id: randomUUID(), token, userId: id, expiresAt: new Date(Date.now() + 60000) } });
    cookies[id] = signedCookie(token);
  }
  const workspace = await service.ensurePersonal(owner);
  await service.ensurePersonal(outsider);
  await db.workspaceMember.createMany({ data: [
    { workspaceId: workspace.id, userId: admin, role: "ADMIN" },
    { workspaceId: workspace.id, userId: member, role: "MEMBER" },
  ] });
  const campaign = await db.waitList.create({ data: { userId: owner, workspaceId: workspace.id, name: "API fixture" } });
  const signup = await db.signUp.create({ data: { waitListId: campaign.id, uniqueUserId: randomUUID(), email: "fixture-subscriber@example.invalid", ipAddress: "192.0.2.1" } });
  server = await startFixtureServer();
  const list = (cookie) => fetch(`${base}/api/signups?waitListId=${campaign.id}`, { headers: cookie ? { cookie } : {} });
  const remove = (cookie, id = signup.id) => fetch(`${base}/api/signups/${id}`, { method: "DELETE", headers: cookie ? { cookie } : {} });
  await t.test("anonymous and forged sessions cannot read or delete", async () => {
    assert.equal((await list()).status, 401);
    assert.equal((await remove()).status, 401);
    assert.equal((await list(signedCookie("no-persisted-session"))).status, 401);
    assert.equal((await list("ba.session_token=tampered.invalid")).status, 401);
  });
  await t.test("owner/member read the unchanged public response contract", async () => {
    for (const id of [owner, member]) {
      const response = await list(cookies[id]);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.data[0].id, signup.id);
      assert.deepEqual(Object.keys(body.data[0]).sort(), ["createdAt", "email", "id"]);
    }
  });
  await t.test("outsiders and members cannot delete; no existence leak", async () => {
    assert.equal((await list(cookies[outsider])).status, 404);
    assert.equal((await remove(cookies[outsider])).status, 404);
    assert.equal((await remove(cookies[member])).status, 404);
    assert.equal((await remove(cookies[outsider], "unknown-id")).status, 404);
    assert.ok(await db.signUp.findUnique({ where: { id: signup.id } }));
  });
  await t.test("revoked historical owner cannot read through the route", async () => {
    await db.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: owner } } });
    assert.equal((await list(cookies[owner])).status, 404);
  });
  await t.test("admin can delete once without an unscoped fallback", async () => {
    assert.equal((await remove(cookies[admin])).status, 200);
    assert.equal((await remove(cookies[admin])).status, 404);
    assert.equal(await db.signUp.count({ where: { id: signup.id } }), 0);
  });
});
