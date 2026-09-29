import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { startFixtureServer } from "../support/http-fixture.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });
const base = "http://127.0.0.1:3100";

test("public signup and verification routes preserve the legacy response contract", async (t) => {
  const ownerId = `fixture-${randomUUID()}`;
  let waitList;
  let server;
  t.after(async () => {
    if (server?.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
    if (waitList) await db.waitList.delete({ where: { id: waitList.id } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.$disconnect();
  });

  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  waitList = await db.waitList.create({ data: { userId: ownerId, name: "Public signup fixture", status: "PUBLISHED" } });
  server = await startFixtureServer();

  const payload = { email: "Public@Example.invalid", waitListId: waitList.id, hypeSession: randomUUID() };
  const join = (body) => fetch(`${base}/api/v1/sign_up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const firstResponse = await join(payload);
  assert.equal(firstResponse.status, 200);
  const first = await firstResponse.json();
  assert.equal(first.message, "Signed up successfully");
  assert.deepEqual(Object.keys(first).sort(), ["message", "signUp"]);
  assert.equal(first.signUp.email, payload.email);
  assert.equal(typeof first.signUp.referralCode, "string");
  assert.equal("emailNormalized" in first.signUp, false);
  assert.equal("verifiedAt" in first.signUp, false);

  const replayResponse = await join({ ...payload, email: "public@example.invalid" });
  assert.equal(replayResponse.status, 200);
  assert.equal((await replayResponse.json()).signUp.id, first.signUp.id);

  const duplicateResponse = await join({ ...payload, hypeSession: randomUUID(), email: "PUBLIC@example.invalid" });
  assert.equal(duplicateResponse.status, 403);
  assert.equal((await duplicateResponse.json()).message, "You have already signed up!");

  const getResponse = await fetch(`${base}/api/v1/sign_up?signUpId=${encodeURIComponent(first.signUp.id)}`);
  assert.equal(getResponse.status, 200);
  const fetched = await getResponse.json();
  assert.equal("emailNormalized" in fetched.signUp, false);
  assert.equal("verifiedAt" in fetched.signUp, false);
  assert.equal("referralCode" in fetched.signUp, false);

  const event = await db.outboxEvent.findFirst({ where: { payload: { path: ["signUpId"], equals: first.signUp.id } } });
  const verify = () => fetch(`${base}/api/v1/sign_up/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: event.payload.token }),
  });
  const verified = await verify();
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).message, "Email verified successfully.");
  assert.equal((await verify()).status, 400);
});
