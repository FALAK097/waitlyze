import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { FIXTURE_AUTH_SECRET, fixtureEnvironment } from "../../scripts/test-environment.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { createUnsubscribeToken, hashUnsubscribeToken } from "../../src/lib/email/unsubscribe.mjs";
import { signedCookie } from "../support/http-fixture.mjs";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHmac } from "node:crypto";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });
const fixtureEnv = fixtureEnvironment();
process.env.MARKETING_UNSUBSCRIBE_SECRET = fixtureEnv.MARKETING_UNSUBSCRIBE_SECRET;
const ownerId = `broadcast-${randomUUID()}`;
let workspace;
let waitList;
let sessionCookie;
let eligibleId;

test.beforeAll(async () => {
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  workspace = await createWorkspaceService(db).ensurePersonal(ownerId);
  waitList = await db.waitList.create({ data: { userId: ownerId, workspaceId: workspace.id, name: "Launch notes", status: "PUBLISHED" } });
  const now = new Date();
  const createSubscriber = (email, options = {}) => {
    const emailNormalized = email.toLowerCase();
    const id = `subscriber-${randomUUID()}`;
    return db.signUp.create({ data: {
      id, waitListId: waitList.id, uniqueUserId: randomUUID(), email, emailNormalized,
      verifiedAt: options.verified ? now : null,
      marketingConsentAt: options.consent ? now : null,
      marketingUnsubscribedAt: options.unsubscribed ? now : null,
      ...(options.consent ? { unsubscribeTokenHash: hashUnsubscribeToken(createUnsubscribeToken(id, waitList.id)) } : {}),
    } });
  };
  const eligible = await createSubscriber("eligible@example.invalid", { verified: true, consent: true });
  eligibleId = eligible.id;
  await createSubscriber("no-consent@example.invalid", { verified: true });
  await createSubscriber("unverified@example.invalid", { consent: true });
  const suppressed = await createSubscriber("suppressed@example.invalid", { verified: true, consent: true });
  await db.emailSuppression.create({ data: { workspaceId: workspace.id, emailNormalized: suppressed.emailNormalized, reason: "BOUNCE" } });

  const token = randomUUID();
  await db.session.create({ data: { id: randomUUID(), token, userId: ownerId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  const signature = createHmac("sha256", FIXTURE_AUTH_SECRET).update(token).digest("base64");
  sessionCookie = `ba.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
});

test.afterAll(async () => {
  if (waitList) {
    await db.outboxEvent.deleteMany({ where: { waitListId: waitList.id } });
    await db.waitList.delete({ where: { id: waitList.id } });
  }
  await db.workspace.deleteMany({ where: { personalOwnerId: ownerId } });
  await db.user.deleteMany({ where: { id: ownerId } });
  await db.$disconnect();
});

test("broadcasts save drafts, preview consented recipients, require review, and cancel queued mail", async ({ page }) => {
  await page.context().addCookies([{ name: "ba.session_token", value: sessionCookie.slice("ba.session_token=".length), url: "http://127.0.0.1:3100", httpOnly: true, sameSite: "Lax" }]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/wait-lists/${waitList.id}/emails/broadcasts`);
  await expect(page.getByRole("navigation", { name: "Email tools" }).getByRole("link", { name: "Broadcasts" })).toHaveAttribute("aria-current", "page");
  const createButton = page.getByRole("button", { name: "New broadcast" });
  await createButton.focus();
  await createButton.press("Enter");
  await page.getByLabel("Internal name").fill("Launch update");
  await page.getByLabel("Subject").fill("A small update");
  await page.getByLabel("Preview text Optional").fill("What changed this week");
  await page.getByLabel("Message").fill("Hello founders.\n\nThe launch is getting closer.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("Draft saved.");

  await page.getByRole("button", { name: "Preview recipients" }).click();
  await expect(page.getByRole("status")).toContainText("1 eligible recipient");
  await expect(page.getByText("Examples: e•••@example.invalid")).toBeVisible();
  expect((await new AxeBuilder({ page }).include(".broadcast-layout").analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByRole("button", { name: "Review send" }).click();
  await expect(page.getByRole("group", { name: "Confirm broadcast send" })).toContainText("Send “A small update” to 1 opted-in subscriber");
  const sendButton = page.getByRole("button", { name: "Send to 1" });
  await sendButton.focus();
  await sendButton.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Queued for 1 opted-in subscriber.");
  const broadcast = await db.marketingBroadcast.findFirst({ where: { waitListId: waitList.id, name: "Launch update" } });
  expect(broadcast.status).toBe("SENDING");
  const recipients = await db.broadcastRecipient.findMany({ where: { broadcastId: broadcast.id } });
  expect(recipients.map((recipient) => recipient.signUpId)).toEqual([eligibleId]);
  expect(await db.outboxEvent.count({ where: { type: "BROADCAST_EMAIL_REQUESTED", waitListId: waitList.id, status: "PENDING" } })).toBe(1);

  await page.getByRole("button", { name: "Cancel remaining emails" }).click();
  await expect(page.getByRole("status")).toHaveText("Remaining queued emails were canceled.");
  expect((await db.marketingBroadcast.findUnique({ where: { id: broadcast.id } })).status).toBe("CANCELED");
  expect((await db.broadcastRecipient.findFirst({ where: { broadcastId: broadcast.id } })).status).toBe("CANCELED");
});
