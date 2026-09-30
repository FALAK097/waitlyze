import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createCampaignSignup } from "../../src/lib/campaigns/signups.mjs";
import { dispatchPendingOutboxEvents } from "../../src/lib/email/outbox.mjs";
import { startFixtureServer } from "../support/http-fixture.mjs";
import { Webhook } from "svix";
import { once } from "node:events";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });

async function removeFixtureWaitList(waitList) {
  if (!waitList) return;
  const deliveries = await db.outboxEvent.findMany({ where: { waitListId: waitList.id }, select: { providerMessageId: true } });
  const providerMessageIds = deliveries.map((event) => event.providerMessageId).filter(Boolean);
  if (providerMessageIds.length) await db.emailProviderEvent.deleteMany({ where: { providerMessageId: { in: providerMessageIds } } });
  await db.outboxEvent.deleteMany({ where: { waitListId: waitList.id } });
  await db.waitList.delete({ where: { id: waitList.id } });
}

test("verification outbox retries transient errors, uses a stable idempotency key and removes the token after acceptance", async (t) => {
  const ownerId = `fixture-${randomUUID()}`;
  const workspace = await db.workspace.create({ data: { name: "Delivery fixture" } });
  let waitList;
  t.after(async () => {
    await removeFixtureWaitList(waitList);
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  waitList = await db.waitList.create({ data: { userId: ownerId, workspaceId: workspace.id, name: "Delivery fixture", status: "PUBLISHED" } });
  const signup = await createCampaignSignup(db, { waitListId: waitList.id, email: "delivery@example.invalid", uniqueUserId: randomUUID() });
  const event = await db.outboxEvent.findFirst({ where: { payload: { path: ["signUpId"], equals: signup.id } } });
  const token = event.payload.token;
  const firstNow = new Date(Date.now() + 5_000);
  const keys = [];
  const retry = await dispatchPendingOutboxEvents(db, {
    now: firstNow,
    waitListId: waitList.id,
    send: async (message) => { keys.push(message.idempotencyKey); throw Object.assign(new Error("busy"), { statusCode: 503, code: "service_unavailable" }); },
  });
  assert.deepEqual(retry, { accepted: 0, retried: 1, failed: 0, skipped: 0 });
  let saved = await db.outboxEvent.findUnique({ where: { id: event.id } });
  assert.equal(saved.status, "PENDING");
  assert.equal(saved.attempts, 1);
  assert.equal(saved.payload.token, token);
  assert.equal(saved.lastErrorCode, "service_unavailable");

  const accepted = await dispatchPendingOutboxEvents(db, {
    now: saved.availableAt,
    waitListId: waitList.id,
    send: async (message) => { keys.push(message.idempotencyKey); assert.match(message.html, /Confirm email/); return { data: { id: "resend-message-1" }, error: null }; },
  });
  assert.deepEqual(accepted, { accepted: 1, retried: 0, failed: 0, skipped: 0 });
  saved = await db.outboxEvent.findUnique({ where: { id: event.id } });
  assert.equal(saved.status, "DELIVERED");
  assert.equal(saved.providerMessageId, "resend-message-1");
  assert.equal("token" in saved.payload, false);
  assert.deepEqual(keys, [event.eventKey, event.eventKey]);
});

test("workspace suppression prevents verification sends", async (t) => {
  const ownerId = `fixture-${randomUUID()}`;
  const workspace = await db.workspace.create({ data: { name: "Suppression fixture" } });
  let waitList;
  t.after(async () => {
    await removeFixtureWaitList(waitList);
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  waitList = await db.waitList.create({ data: { userId: ownerId, workspaceId: workspace.id, status: "PUBLISHED" } });
  const signup = await createCampaignSignup(db, { waitListId: waitList.id, email: "blocked@example.invalid", uniqueUserId: randomUUID() });
  await db.emailSuppression.create({ data: { workspaceId: workspace.id, emailNormalized: "blocked@example.invalid", reason: "BOUNCE" } });
  let called = false;
  const result = await dispatchPendingOutboxEvents(db, { waitListId: waitList.id, send: async () => { called = true; } });
  assert.equal(called, false);
  assert.equal(result.skipped, 1);
  const event = await db.outboxEvent.findFirst({ where: { payload: { path: ["signUpId"], equals: signup.id } } });
  assert.equal(event.status, "FAILED");
  assert.equal(event.lastErrorCode, "RECIPIENT_SUPPRESSED");
  assert.equal("token" in event.payload, false);
});


test("signed Resend bounce callbacks are deduplicated and suppress the workspace recipient", async (t) => {
  const ownerId = `fixture-${randomUUID()}`;
  const workspace = await db.workspace.create({ data: { name: "Webhook fixture" } });
  let waitList;
  let server;
  t.after(async () => {
    if (server?.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
    await removeFixtureWaitList(waitList);
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  waitList = await db.waitList.create({ data: { userId: ownerId, workspaceId: workspace.id, status: "PUBLISHED" } });
  const signup = await createCampaignSignup(db, { waitListId: waitList.id, email: "Person@Example.invalid", uniqueUserId: randomUUID() });
  const event = await db.outboxEvent.findFirst({ where: { payload: { path: ["signUpId"], equals: signup.id } } });
  const messageId = `provider-${randomUUID()}`;
  await db.outboxEvent.update({ where: { id: event.id }, data: { status: "DELIVERED", providerMessageId: messageId, processedAt: new Date() } });
  server = await startFixtureServer();
  const timestamp = new Date();
  const secret = new Webhook(`whsec_${Buffer.from("fixture-webhook-secret").toString("base64")}`);
  const deliver = async (eventId, body, signatureOverride) => {
    const signature = signatureOverride || secret.sign(eventId, timestamp, body);
    return fetch("http://127.0.0.1:3100/api/webhooks/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json", "svix-id": eventId, "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)), "svix-signature": signature },
      body,
    });
  };
  const transientId = `evt_${randomUUID()}`;
  const transientBody = JSON.stringify({ type: "email.bounced", data: { email_id: messageId, to: ["Person@Example.invalid"], bounce: { type: "Transient" } } });
  assert.equal((await deliver(transientId, transientBody)).status, 200);
  assert.equal(await db.emailSuppression.count({ where: { workspaceId: workspace.id } }), 0);

  const eventId = `evt_${randomUUID()}`;
  const body = JSON.stringify({ type: "email.bounced", data: { email_id: messageId, to: ["Person@Example.invalid"], bounce: { type: "Permanent" } } });
  assert.equal((await deliver(eventId, body)).status, 200);
  assert.equal((await deliver(eventId, body)).status, 200);
  assert.equal(await db.emailProviderEvent.count({ where: { providerMessageId: messageId } }), 2);
  assert.equal((await db.emailSuppression.findUnique({ where: { workspaceId_emailNormalized: { workspaceId: workspace.id, emailNormalized: "person@example.invalid" } } })).reason, "BOUNCE");
  const invalid = await deliver(eventId, body, "v1,invalid");
  assert.equal(invalid.status, 400);
});
