import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { createDraft } from "../../src/lib/campaigns/create-draft.mjs";
import { pauseCampaign, publishCampaign } from "../../src/lib/campaigns/publication.mjs";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
  await db.waitList.update({ where: { id: draft.id }, data: { showReferrals: true } });
  const draftResponse = await page.goto(url);
  expect(draftResponse.status()).toBe(404);
  await publishCampaign(db, ownerId, undefined, draft.id, 1);

  const publicResponse = await page.goto(url);
  expect(publicResponse.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Your next great workflow starts here." })).toBeVisible();
  const join = async (target, email) => {
    await page.goto(target);
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Join the waitlist" }).click();
    await expect(page.getByRole("status")).toHaveText("Signup received. Confirmation email queued.");
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await expect(page.getByLabel("Your referral link")).toHaveCount(0);
    return { email };
  };
  const verify = async (email) => {
    const signup = await db.signUp.findUnique({ where: { waitListId_emailNormalized: { waitListId: draft.id, emailNormalized: email.toLowerCase() } } });
    const event = await db.outboxEvent.findFirst({ where: { type: "SIGNUP_VERIFICATION_REQUESTED", payload: { path: ["signUpId"], equals: signup.id } } });
    await page.goto(`/verify/${event.payload.token}?returnTo=${encodeURIComponent(url)}`);
    await expect(page.getByRole("button", { name: "Confirm email" })).toBeVisible();
    await page.getByRole("button", { name: "Confirm email" }).click();
    await expect(page.getByRole("heading", { name: "You’re confirmed" })).toBeVisible();
    return {
      signup,
      referralLink: await page.getByLabel("Your referral link").inputValue(),
    };
  };

  const baselineEmail = `${randomUUID()}@example.invalid`;
  await join(url, baselineEmail);
  const { signup: baselineSignup } = await verify(baselineEmail);
  expect(baselineSignup).not.toBeNull();

  const referrerEmail = `${randomUUID()}@example.invalid`;
  await join(url, referrerEmail);
  const { signup: referrerSignup, referralLink } = await verify(referrerEmail);
  const referrerUrl = new URL(referralLink);
  expect(referrerUrl.pathname).toBe(url);
  expect(referrerUrl.searchParams.get("r")).toBeTruthy();
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.locator(".verify-referral [role=status]")).toContainText(/Referral link copied|Select the link and copy it/);

  await page.evaluate(() => localStorage.removeItem("hypeSession"));
  const referredEmail = `${randomUUID()}@example.invalid`;
  await join(referralLink, referredEmail);
  const { signup: referredSignup } = await verify(referredEmail);
  expect((await db.referral.findUnique({ where: { signUpId: referredSignup.id } })).referredById).toBe(referrerSignup.id);

  const refreshedPosition = await page.request.get(`/api/v1/sign_up?signUpId=${encodeURIComponent(referrerSignup.id)}`);
  expect((await refreshedPosition.json()).signUp.rank).toBe(1);
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page }).include(".verify-card").analyze();
  expect(audit.violations).toEqual([]);
  expect(await db.signUp.count({ where: { waitListId: draft.id } })).toBe(3);

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
