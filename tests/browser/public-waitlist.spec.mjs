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
    await expect(page.getByRole("status")).toHaveText("Signup received.");
    await expect(page.getByRole("heading", { name: /You.re on the list/ })).toBeVisible();
    return {
      position: await page.locator(".published-signup-position").innerText(),
      referralLink: await page.getByLabel("Your referral link").inputValue(),
    };
  };

  const baselineEmail = `${randomUUID()}@example.invalid`;
  const baseline = await join(url, baselineEmail);
  expect(baseline.position).toContain("#1");
  const baselineSignup = await db.signUp.findUnique({ where: { waitListId_emailNormalized: { waitListId: draft.id, emailNormalized: baselineEmail.toLowerCase() } } });
  expect(baselineSignup).not.toBeNull();

  const referrerEmail = `${randomUUID()}@example.invalid`;
  const referrer = await join(url, referrerEmail);
  expect(referrer.position).toContain("#2");
  const referrerLink = new URL(referrer.referralLink);
  expect(referrerLink.pathname).toBe(url);
  expect(referrerLink.searchParams.get("r")).toBeTruthy();
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByRole("status")).toContainText(/Referral link copied|Copy isn’t available/);

  const referredEmail = `${randomUUID()}@example.invalid`;
  const referred = await join(referrer.referralLink, referredEmail);
  expect(referred.position).toContain("#3");
  const referrerSignup = await db.signUp.findUnique({ where: { waitListId_emailNormalized: { waitListId: draft.id, emailNormalized: referrerEmail.toLowerCase() } } });
  const referredSignup = await db.signUp.findUnique({ where: { waitListId_emailNormalized: { waitListId: draft.id, emailNormalized: referredEmail.toLowerCase() } } });
  expect((await db.referral.findUnique({ where: { signUpId: referredSignup.id } })).referredById).toBe(referrerSignup.id);

  for (const email of [referrerEmail, referredEmail]) {
    const signup = await db.signUp.findUnique({ where: { waitListId_emailNormalized: { waitListId: draft.id, emailNormalized: email.toLowerCase() } } });
    const event = await db.outboxEvent.findFirst({ where: { type: "SIGNUP_VERIFICATION_REQUESTED", payload: { path: ["signUpId"], equals: signup.id } } });
    expect(event.status).toBe("PENDING");
    const response = await page.request.post("/api/v1/sign_up/verify", { data: { token: event.payload.token } });
    expect(response.status()).toBe(200);
  }

  const refreshedPosition = await page.request.get(`/api/v1/sign_up?signUpId=${encodeURIComponent(referrerSignup.id)}`);
  expect((await refreshedPosition.json()).signUp.rank).toBe(1);
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page }).include(".published-signup-result").analyze();
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
