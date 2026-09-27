import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });

function runBackfill(apply = false) {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/backfill-workspaces.mjs", ...(apply ? ["--apply"] : [])], { env: { ...process.env, DATABASE_URL: target }, encoding: "utf8", timeout: 30000 });
  return { ...result, report: result.stdout.trim() ? JSON.parse(result.stdout) : null };
}

test("fixture target guard rejects production and PostgreSQL host overrides", () => {
  for (const value of [
    "postgresql://fixture@production.invalid/waitlyze_workspace_test",
    "postgresql://fixture@127.0.0.1/customer_database",
    "postgresql://fixture@127.0.0.1/waitlyze_workspace_test?host=production.invalid",
  ]) assert.throws(() => workspaceTestTarget(value));
});

test("backfill CLI rehearses more than one batch and fails closed", async (t) => {
  const ids = Array.from({ length: 205 }, () => `fixture-${randomUUID()}`);
  t.after(async () => {
    await db.waitList.deleteMany({ where: { userId: { in: ids } } });
    await db.workspace.deleteMany({ where: { personalOwnerId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  });
  await db.user.createMany({ data: ids.map((id) => ({ id, email: `${id}@example.invalid` })) });
  await db.waitList.createMany({ data: ids.map((userId) => ({ userId, name: "Legacy batch fixture" })) });
  await t.test("report mode leaves every legacy mapping unchanged", async () => {
    const result = runBackfill();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.report.mode, "report");
    assert.equal(result.report.usersWithoutPersonalWorkspace, 205);
    assert.equal(result.report.unlinkedCampaigns, 205);
    assert.equal(await db.workspace.count(), 0);
  });
  await t.test("apply and repeat preserve one mapping per owner", async () => {
    for (let i = 0; i < 2; i++) {
      const result = runBackfill(true);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.report.processed, 205);
      assert.equal(result.report.unlinkedCampaigns, 0);
      assert.equal(result.report.usersWithoutPersonalWorkspace, 0);
      assert.equal(result.report.invalidPersonalOwnership, 0);
      assert.equal(await db.workspace.count(), 205);
    }
  });
  await t.test("revoked role is reported and never promoted by apply", async () => {
    const workspace = await db.workspace.findUnique({ where: { personalOwnerId: ids[0] } });
    await db.workspaceMember.update({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: ids[0] } }, data: { role: "MEMBER" } });
    assert.equal(runBackfill().report.invalidPersonalOwnership, 1);
    assert.equal(runBackfill(true).status, 1);
    assert.equal((await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: ids[0] } } })).role, "MEMBER");
  });
});
