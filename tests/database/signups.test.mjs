import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import {
  createCampaignSignup,
  DuplicateSignupError,
  InvalidCampaignError,
  verifyCampaignSignup,
} from "../../src/lib/campaigns/signups.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });

test("signup uniqueness, retry safety, verification expiry, and outbox enqueue are atomic", async (t) => {
  const ownerId = `fixture-${randomUUID()}`;
  let waitList;
  t.after(async () => {
    if (waitList) await db.waitList.delete({ where: { id: waitList.id } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.$disconnect();
  });

  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  waitList = await db.waitList.create({ data: { userId: ownerId, name: "Signup fixture", status: "PUBLISHED" } });
  const base = { waitListId: waitList.id, email: " Person@Example.invalid ", uniqueUserId: randomUUID() };
  const signup = await createCampaignSignup(db, base);
  assert.equal(signup.email, "Person@Example.invalid");
  assert.equal(signup.emailNormalized, "person@example.invalid");
  assert.equal(signup.verifiedAt, null);
  assert.equal(signup.rank, 1);
  assert.equal(await db.signUpVerification.count({ where: { signUpId: signup.id } }), 1);

  const eventsForSignup = await db.outboxEvent.findMany({ where: { type: "SIGNUP_VERIFICATION_REQUESTED", payload: { path: ["signUpId"], equals: signup.id } } });
  assert.equal(eventsForSignup.length, 1);
  const signupEvent = eventsForSignup[0];
  assert.equal(typeof signupEvent.payload.token, "string");
  assert.notEqual(signupEvent.payload.token, (await db.signUpVerification.findUnique({ where: { signUpId: signup.id } })).tokenHash);

  const replay = await createCampaignSignup(db, { ...base, email: "person@example.invalid" });
  assert.equal(replay.id, signup.id);
  assert.equal(await db.outboxEvent.count({ where: { payload: { path: ["signUpId"], equals: signup.id } } }), 1);
  await assert.rejects(
    createCampaignSignup(db, { ...base, uniqueUserId: randomUUID(), email: "PERSON@example.invalid" }),
    DuplicateSignupError,
  );

  const verificationToken = signupEvent.payload.token;
  assert.equal(await verifyCampaignSignup(db, verificationToken), true);
  assert.equal(await verifyCampaignSignup(db, verificationToken), false);
  assert.ok((await db.signUp.findUnique({ where: { id: signup.id } })).verifiedAt);

  const expiring = await createCampaignSignup(db, {
    waitListId: waitList.id,
    email: "expiring@example.invalid",
    uniqueUserId: randomUUID(),
  }, undefined, { now: new Date("2026-01-01T00:00:00.000Z"), verificationTtlMs: 1000 });
  const expiringEvent = await db.outboxEvent.findFirst({ where: { payload: { path: ["signUpId"], equals: expiring.id } } });
  assert.equal(await verifyCampaignSignup(db, expiringEvent.payload.token, { now: new Date("2026-01-01T00:00:02.000Z") }), false);

  const paused = await db.waitList.create({ data: { userId: ownerId, name: "Paused fixture", status: "PAUSED" } });
  try {
    await assert.rejects(createCampaignSignup(db, { waitListId: paused.id, email: "paused@example.invalid", uniqueUserId: randomUUID() }), InvalidCampaignError);
  } finally {
    await db.waitList.delete({ where: { id: paused.id } });
  }
});

test("concurrent differently cased emails create only one subscriber", async (t) => {
  const ownerId = `fixture-${randomUUID()}`;
  let waitList;
  t.after(async () => {
    if (waitList) await db.waitList.delete({ where: { id: waitList.id } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  waitList = await db.waitList.create({ data: { userId: ownerId, name: "Concurrent fixture", status: "PUBLISHED" } });
  const results = await Promise.allSettled([
    createCampaignSignup(db, { waitListId: waitList.id, email: "race@example.invalid", uniqueUserId: randomUUID() }),
    createCampaignSignup(db, { waitListId: waitList.id, email: "RACE@EXAMPLE.INVALID", uniqueUserId: randomUUID() }),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected" && result.reason instanceof DuplicateSignupError).length, 1);
  assert.equal(await db.signUp.count({ where: { waitListId: waitList.id } }), 1);
  assert.equal(await db.outboxEvent.count({ where: { payload: { path: ["waitListId"], equals: waitList.id } } }), 1);
});

test("generated referral codes disambiguate signups that share a browser identifier", async (t) => {
  const ownerId = `fixture-${randomUUID()}`;
  let waitList;
  t.after(async () => {
    if (waitList) await db.waitList.delete({ where: { id: waitList.id } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  waitList = await db.waitList.create({ data: { userId: ownerId, name: "Referral code fixture", status: "PUBLISHED", showReferrals: true } });

  const sharedBrowserId = randomUUID();
  const referrer = await createCampaignSignup(db, { waitListId: waitList.id, email: "first@example.invalid", uniqueUserId: sharedBrowserId });
  const unrelated = await createCampaignSignup(db, { waitListId: waitList.id, email: "second@example.invalid", uniqueUserId: sharedBrowserId });
  const referred = await createCampaignSignup(db, {
    waitListId: waitList.id,
    email: "referred@example.invalid",
    uniqueUserId: randomUUID(),
  }, referrer.referralCode);

  assert.notEqual(referrer.referralCode, unrelated.referralCode);
  assert.equal((await db.referral.findUnique({ where: { signUpId: referred.id } })).referredById, referrer.id);
});
