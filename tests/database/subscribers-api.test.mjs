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

test("subscriber API paginates and filters within workspace scope, and exports safe CSV", async (t) => {
  const owner = `fixture-${randomUUID()}`;
  const outsider = `fixture-${randomUUID()}`;
  let server;
  t.after(async () => {
    if (server && server.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
    await db.waitList.deleteMany({ where: { userId: { in: [owner, outsider] } } });
    await db.workspace.deleteMany({ where: { personalOwnerId: { in: [owner, outsider] } } });
    await db.user.deleteMany({ where: { id: { in: [owner, outsider] } } });
    await db.$disconnect();
  });
  const cookies = {};
  for (const id of [owner, outsider]) {
    await db.user.create({ data: { id, email: `${id}@example.invalid` } });
    const token = randomUUID();
    await db.session.create({ data: { id: randomUUID(), token, userId: id, expiresAt: new Date(Date.now() + 60000) } });
    cookies[id] = signedCookie(token);
  }
  const workspace = await service.ensurePersonal(owner);
  await service.ensurePersonal(outsider);
  const campaign = await db.waitList.create({ data: { userId: owner, workspaceId: workspace.id, name: "Audience fixture" } });
  const otherCampaign = await db.waitList.create({ data: { userId: owner, workspaceId: workspace.id, name: "Other audience" } });
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const records = Array.from({ length: 31 }, (_, index) => ({
    waitListId: campaign.id,
    uniqueUserId: randomUUID(),
    email: index === 0 ? "=HYPERLINK(\"https://example.invalid\")" : `subscriber-${String(index).padStart(2, "0")}@example.invalid`,
    verifiedAt: index % 2 === 0 ? new Date(createdAt.getTime() + index * 1000) : null,
    createdAt: new Date(createdAt.getTime() + index * 1000),
    ipAddress: "192.0.2.99",
    country: "IN",
    city: "Pune",
    device: "Desktop",
  }));
  await db.signUp.createMany({ data: records });
  await db.signUp.create({ data: { waitListId: otherCampaign.id, uniqueUserId: randomUUID(), email: "other@example.invalid" } });
  server = await startFixtureServer();

  const route = (id, query = "", cookie = cookies[owner]) => fetch(`${base}/api/wait-lists/${id}/subscribers${query}`, { headers: cookie ? { cookie } : {} });
  await t.test("uses scoped stable cursor pages and hides internal data", async () => {
    const first = await route(campaign.id);
    assert.equal(first.status, 200);
    const body = await first.json();
    assert.equal(body.total, 31);
    assert.equal(body.data.length, 25);
    assert.ok(body.nextCursor);
    assert.equal("ipAddress" in body.data[0], false);
    const next = await route(campaign.id, `?cursor=${encodeURIComponent(body.nextCursor)}`);
    const nextBody = await next.json();
    assert.equal(nextBody.data.length, 6);
    assert.equal(nextBody.nextCursor, null);
    assert.equal(new Set([...body.data, ...nextBody.data].map((row) => row.id)).size, 31);
  });
  await t.test("filters confirmation state and bounded email search", async () => {
    const verified = await route(campaign.id, "?status=verified");
    const verifiedBody = await verified.json();
    assert.equal(verifiedBody.total, 16);
    assert.ok(verifiedBody.data.every((row) => row.verifiedAt));
    const matching = await route(campaign.id, "?q=subscriber-03%40example.invalid&status=pending");
    const matchingBody = await matching.json();
    assert.equal(matchingBody.total, 1);
    assert.equal(matchingBody.data[0].email, "subscriber-03@example.invalid");
    assert.equal((await route(campaign.id, `?q=${"x".repeat(121)}`)).status, 400);
    assert.equal((await route(campaign.id, "?status=unknown")).status, 400);
  });
  await t.test("outsiders see no campaign existence and anonymous users are rejected", async () => {
    assert.equal((await route(campaign.id, "", cookies[outsider])).status, 404);
    assert.equal((await route(campaign.id, "", null)).status, 401);
  });
  await t.test("exports every matching subscriber with formula-safe CSV and no sensitive columns", async () => {
    const response = await fetch(`${base}/api/wait-lists/${campaign.id}/subscribers?status=verified`, { method: "POST", headers: { cookie: cookies[owner] } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/csv/);
    const csv = await response.text();
    assert.equal(csv.split("\r\n").length, 18);
    assert.ok(csv.includes("\"'=HYPERLINK("));
    assert.equal(csv.includes("ipAddress"), false);
    assert.equal(csv.includes("uniqueUserId"), false);
  });
});
