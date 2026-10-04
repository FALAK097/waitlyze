import { randomUUID, createHmac } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { ensureAutomationRecipes } from "../../src/lib/email/automations.mjs";
import { FIXTURE_AUTH_SECRET } from "../../scripts/test-environment.mjs";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });
const ownerId = `automation-browser-${randomUUID()}`;
let workspace;
let waitList;
let sessionCookie;

test.beforeAll(async () => {
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  workspace = await createWorkspaceService(db).ensurePersonal(ownerId);
  waitList = await db.waitList.create({ data: { userId: ownerId, workspaceId: workspace.id, name: "Automation launch", status: "PUBLISHED" } });
  await ensureAutomationRecipes(db, waitList.id);
  const token = randomUUID();
  await db.session.create({ data: { id: randomUUID(), token, userId: ownerId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  const signature = createHmac("sha256", FIXTURE_AUTH_SECRET).update(token).digest("base64");
  sessionCookie = encodeURIComponent(`${token}.${signature}`);
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

test("automation recipes are simple, consent-aware, versioned and pausing cancels scheduled work", async ({ page }) => {
  await page.context().addCookies([{ name: "ba.session_token", value: sessionCookie, url: "http://127.0.0.1:3100", httpOnly: true, sameSite: "Lax" }]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/wait-lists/${waitList.id}/emails/automations`);
  await expect(page.getByRole("navigation", { name: "Email tools" }).getByRole("link", { name: "Automations" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".automation-recipe")).toHaveCount(3);
  await expect(page.getByText(/All recipes require verified email and explicit marketing consent/)).toBeVisible();
  expect((await new AxeBuilder({ page }).include(".automation-console").analyze()).violations).toEqual([]);

  const reminder = page.locator(".automation-recipe").filter({ has: page.getByRole("heading", { name: "Referral reminder" }) });
  await reminder.getByText("Edit timing and email").click();
  await reminder.getByLabel("Wait after confirmation (hours)").fill("1");
  await reminder.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("status")).toHaveText("Recipe saved. New runs will use this version.");
  const reminderRecipe = await db.automationRecipe.findUnique({ where: { waitListId_type: { waitListId: waitList.id, type: "REFERRAL_REMINDER" } }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
  expect(reminderRecipe.currentVersion).toBe(2);
  expect(reminderRecipe.versions[0].config.delayMinutes).toBe(60);

  const welcome = page.locator(".automation-recipe").filter({ has: page.getByRole("heading", { name: "Welcome after confirmation" }) });
  await welcome.getByRole("button", { name: "Enable" }).click();
  await expect(welcome.getByRole("button", { name: "Pause" })).toBeVisible();
  const recipe = await db.automationRecipe.findUnique({ where: { waitListId_type: { waitListId: waitList.id, type: "WELCOME" } }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
  expect(recipe.status).toBe("ENABLED");

  const run = await db.automationRun.create({ data: {
    recipeId: recipe.id,
    recipeVersionId: recipe.versions[0].id,
    waitListId: waitList.id,
    signUpId: (await db.signUp.create({ data: { waitListId: waitList.id, uniqueUserId: randomUUID(), email: "pending@example.invalid", emailNormalized: `pending-${randomUUID()}@example.invalid`, verifiedAt: new Date(), marketingConsentAt: new Date() } })).id,
    triggerKey: `browser-pause:${randomUUID()}`,
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
  } });
  const step = await db.automationRunStep.create({ data: { runId: run.id, stepKey: "send_email", availableAt: run.scheduledAt, outboxEventKey: `automation.browser:${run.id}` } });
  await db.outboxEvent.create({ data: { eventKey: step.outboxEventKey, type: "MARKETING_AUTOMATION_STEP_REQUESTED", waitListId: waitList.id, availableAt: step.availableAt, payload: { automationStepId: step.id } } });

  await welcome.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("status")).toContainText("Automation paused. Scheduled messages were canceled");
  expect((await db.automationRun.findUnique({ where: { id: run.id } })).status).toBe("CANCELED");
  expect((await db.automationRunStep.findUnique({ where: { id: step.id } })).status).toBe("CANCELED");
  const event = await db.outboxEvent.findUnique({ where: { eventKey: step.outboxEventKey } });
  expect(event.status).toBe("FAILED");
  expect(event.payload).toEqual({});

  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
