import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { createDraft } from "../../src/lib/campaigns/create-draft.mjs";
import { pauseCampaign, publishCampaign } from "../../src/lib/campaigns/publication.mjs";
import { expect, test } from "@playwright/test";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });
const ownerId = `browser-${randomUUID()}`;
let workspace;
let draft;

test.beforeAll(async () => {
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  workspace = await createWorkspaceService(db).ensurePersonal(ownerId);
  draft = await createDraft(db, ownerId, workspace.id, { name: "Browser launch", description: "Fixture", publicSlug: `browser-${randomUUID()}`, templateId: "saas", creationKey: randomUUID() });
});
test.afterAll(async () => {
  await db.waitList.deleteMany({ where: { userId: ownerId } });
  await db.workspace.deleteMany({ where: { personalOwnerId: ownerId } });
  await db.user.deleteMany({ where: { id: ownerId } });
  await db.$disconnect();
});

test("draft privacy, hosted signup, legacy redirect and paused state work in browser", async ({ page }) => {
  const url = `/w/${draft.publicSlug}`;
  const draftResponse = await page.goto(url);
  expect(draftResponse.status()).toBe(404);
  await publishCampaign(db, ownerId, undefined, draft.id, 1);

  const publicResponse = await page.goto(url);
  expect(publicResponse.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Your next great workflow starts here." })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel("Email address").fill(`${randomUUID()}@example.invalid`);
  await page.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.getByRole("status")).toContainText("You're on the list.");
  expect(await db.signUp.count({ where: { waitListId: draft.id } })).toBe(1);

  await page.goto(`/forms/${draft.id}`);
  await expect(page).toHaveURL(new RegExp(`/w/${draft.publicSlug}$`));
  await pauseCampaign(db, ownerId, undefined, draft.id);
  const pausedResponse = await page.goto(url);
  expect(pausedResponse.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "This waitlist is paused" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveCount(0);
  const rejectedSignup = await page.request.post("/api/v1/sign_up", { data: { email: `${randomUUID()}@example.invalid`, waitListId: draft.id, hypeSession: randomUUID() } });
  expect(rejectedSignup.status()).toBe(400);
});
