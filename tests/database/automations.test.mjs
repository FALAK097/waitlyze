import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createCampaignSignup, verifyCampaignSignup } from "../../src/lib/campaigns/signups.mjs";
import { dispatchPendingOutboxEvents } from "../../src/lib/email/outbox.mjs";
import { ensureAutomationRecipes, AUTOMATION_DEFAULTS } from "../../src/lib/email/automations.mjs";
import { fixtureEnvironment } from "../../scripts/test-environment.mjs";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });
const fixtureEnv = fixtureEnvironment();
process.env.BETTER_AUTH_SECRET = fixtureEnv.BETTER_AUTH_SECRET;
process.env.MARKETING_UNSUBSCRIBE_SECRET = fixtureEnv.MARKETING_UNSUBSCRIBE_SECRET;
process.env.BETTER_AUTH_URL = fixtureEnv.BETTER_AUTH_URL;

test("verified automations snapshot recipe versions once and recheck consent when delayed mail is due", async (t) => {
  const ownerId = `automation-${randomUUID()}`;
  const workspace = await db.workspace.create({ data: { name: "Automation fixture" } });
  let waitList;
  t.after(async () => {
    if (waitList) {
      await db.outboxEvent.deleteMany({ where: { waitListId: waitList.id } });
      await db.waitList.delete({ where: { id: waitList.id } });
    }
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  waitList = await db.waitList.create({ data: { userId: ownerId, workspaceId: workspace.id, name: "Launch notes", status: "PUBLISHED" } });
  await ensureAutomationRecipes(db, waitList.id);
  const recipes = await db.automationRecipe.findMany({ where: { waitListId: waitList.id } });
  for (const recipe of recipes) await db.automationRecipe.update({ where: { id: recipe.id }, data: { status: "ENABLED" } });
  const reminder = recipes.find((recipe) => recipe.type === "REFERRAL_REMINDER");
  const milestone = recipes.find((recipe) => recipe.type === "REFERRAL_MILESTONE");
  await db.automationRecipeVersion.update({ where: { recipeId_version: { recipeId: reminder.id, version: 1 } }, data: { config: { ...AUTOMATION_DEFAULTS.REFERRAL_REMINDER, delayMinutes: 1 } } });
  await db.automationRecipeVersion.update({ where: { recipeId_version: { recipeId: milestone.id, version: 1 } }, data: { config: { ...AUTOMATION_DEFAULTS.REFERRAL_MILESTONE, milestoneCount: 2 } } });

  const referrer = await createCampaignSignup(db, { waitListId: waitList.id, email: "referrer@example.invalid", uniqueUserId: randomUUID(), marketingConsent: true });
  const referred = await Promise.all([1, 2].map((index) => createCampaignSignup(db, {
    waitListId: waitList.id,
    email: `referred-${index}@example.invalid`,
    uniqueUserId: randomUUID(),
    marketingConsent: true,
  }, referrer.referralCode)));
  const signups = [referrer, ...referred];
  for (const signup of signups) {
    const event = await db.outboxEvent.findFirst({ where: { type: "SIGNUP_VERIFICATION_REQUESTED", payload: { path: ["signUpId"], equals: signup.id } } });
    assert.ok(event?.payload.token);
    assert.equal(await verifyCampaignSignup(db, event.payload.token), true);
  }
  await db.outboxEvent.updateMany({ where: { waitListId: waitList.id, type: "SIGNUP_VERIFICATION_REQUESTED" }, data: { status: "FAILED", processedAt: new Date() } });

  const baseNow = new Date(Date.now() + 5_000);
  const triggers = await dispatchPendingOutboxEvents(db, { waitListId: waitList.id, now: baseNow, send: async () => { throw new Error("Trigger events must not send mail."); } });
  assert.equal(triggers.failed, 0);
  const processedTriggers = await db.outboxEvent.findMany({ where: { waitListId: waitList.id, type: "MARKETING_AUTOMATION_TRIGGER_REQUESTED" }, select: { status: true, payload: true, lastErrorCode: true } });
  assert.equal(triggers.retried, 0, `verified trigger processing should not retry: ${JSON.stringify(processedTriggers)}`);
  assert.equal(triggers.skipped, 0, "verified trigger processing should not skip");
  assert.equal(processedTriggers.length, 3, "one trigger is created for each verified signup");
  assert.ok(processedTriggers.every((event) => event.status === "DELIVERED"), JSON.stringify(processedTriggers));
  const verifiedSubscribers = await db.signUp.findMany({ where: { waitListId: waitList.id }, select: { id: true, verifiedAt: true, marketingConsentAt: true, marketingUnsubscribedAt: true } });
  assert.equal(verifiedSubscribers.length, 3);
  assert.ok(verifiedSubscribers.every((signup) => signup.verifiedAt && signup.marketingConsentAt && !signup.marketingUnsubscribedAt), JSON.stringify(verifiedSubscribers));
  assert.equal(await db.automationRun.count({ where: { waitListId: waitList.id } }), 7, "three welcomes, three reminders and one threshold milestone are scheduled");
  const milestoneRun = await db.automationRun.findFirst({ where: { recipeId: milestone.id, signUpId: referrer.id }, include: { recipeVersion: true, steps: true } });
  assert.ok(milestoneRun);
  assert.equal(milestoneRun.recipeVersion.version, 1);
  assert.equal(milestoneRun.recipeVersion.config.milestoneCount, 2);

  // Replaying the same verified trigger cannot create a second run or step.
  const trigger = await db.outboxEvent.create({ data: { eventKey: `automation.trigger:replay:${referrer.id}`, type: "MARKETING_AUTOMATION_TRIGGER_REQUESTED", waitListId: waitList.id, payload: { signUpId: referrer.id } } });
  await db.outboxEvent.update({ where: { id: trigger.id }, data: { status: "PROCESSING", lockedAt: baseNow } });
  await dispatchPendingOutboxEvents(db, { waitListId: waitList.id, now: baseNow, send: async () => { throw new Error("Trigger events must not send mail."); } });
  assert.equal(await db.automationRun.count({ where: { waitListId: waitList.id } }), 7);

  const immediate = [];
  const firstDelivery = await dispatchPendingOutboxEvents(db, {
    waitListId: waitList.id,
    now: new Date(baseNow.getTime() + 1_000),
    send: async (message) => { immediate.push(message); return { data: { id: `message-${immediate.length}` } }; },
  });
  assert.equal(firstDelivery.accepted, 4, "welcome and referral milestone messages are due immediately");
  assert.ok(immediate.every((message) => message.headers["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click"));
  assert.ok(immediate.every((message) => message.idempotencyKey.startsWith("automation.step:")));
  assert.ok(immediate.some((message) => /You’ve brought 2 people/.test(message.html)));

  await db.signUp.update({ where: { id: referrer.id }, data: { marketingUnsubscribedAt: new Date() } });
  const delayed = [];
  const finalDelivery = await dispatchPendingOutboxEvents(db, {
    waitListId: waitList.id,
    now: new Date(baseNow.getTime() + 61_000),
    send: async (message) => { delayed.push(message); return { data: { id: `delayed-${delayed.length}` } }; },
  });
  assert.equal(finalDelivery.accepted, 2, "other opted-in subscribers remain eligible for their single reminder");
  assert.equal(finalDelivery.skipped, 1, "the opted-out recipient is skipped at delivery time");
  assert.equal(delayed.length, 2);
  const skippedRun = await db.automationRun.findFirst({ where: { recipeId: reminder.id, signUpId: referrer.id }, include: { steps: true } });
  assert.equal(skippedRun.status, "SKIPPED");
  assert.equal(skippedRun.steps[0].lastErrorCode, "UNSUBSCRIBED");
});
