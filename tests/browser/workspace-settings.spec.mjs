import { createHmac, randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { FIXTURE_AUTH_SECRET } from "../../scripts/test-environment.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });
const ownerId = `workspace-settings-${randomUUID()}`;
const memberId = `workspace-member-${randomUUID()}`;
let workspace;
let ownerCookie;
let memberCookie;

async function createSession(userId) {
  const token = randomUUID();
  await db.session.create({ data: { id: randomUUID(), token, userId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  return encodeURIComponent(`${token}.${createHmac("sha256", FIXTURE_AUTH_SECRET).update(token).digest("base64")}`);
}

test.beforeAll(async () => {
  await db.user.create({ data: { id: ownerId, name: "Launch owner", email: `${ownerId}@example.invalid` } });
  await db.user.create({ data: { id: memberId, email: `${memberId}@example.invalid` } });
  workspace = await createWorkspaceService(db).ensurePersonal(ownerId);
  await db.workspaceMember.create({ data: { workspaceId: workspace.id, userId: memberId, role: "MEMBER" } });
  ownerCookie = await createSession(ownerId);
  memberCookie = await createSession(memberId);
});

test.afterAll(async () => {
  if (workspace) await db.workspace.deleteMany({ where: { id: workspace.id } });
  await db.workspace.deleteMany({ where: { personalOwnerId: { in: [ownerId, memberId] } } });
  await db.user.deleteMany({ where: { id: { in: [ownerId, memberId] } } });
  await db.$disconnect();
});

test("workspace settings lets an owner rename the workspace and keeps member access read-only", async ({ page, browser }) => {
  await page.context().addCookies([{ name: "ba.session_token", value: ownerCookie, url: "http://127.0.0.1:3100", httpOnly: true, sameSite: "Lax" }]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/settings#profile");
  const profile = page.locator("#profile");
  const displayName = profile.getByRole("textbox", { name: "Display name" });
  const saveProfile = profile.getByRole("button", { name: "Save profile" });
  await expect(saveProfile).toBeDisabled();
  await displayName.fill("Launch owner team");
  await expect(saveProfile).toBeEnabled();
  await saveProfile.click();
  await expect(profile.getByRole("status")).toHaveText("Profile saved.");
  await expect(saveProfile).toBeDisabled();
  expect((await db.user.findUnique({ where: { id: ownerId } })).name).toBe("Launch owner team");

  await page.goto("/settings#workspace");
  const panel = page.locator("#workspace");
  await expect(panel.getByRole("heading", { name: "Workspace" })).toBeVisible();
  const name = panel.getByRole("textbox", { name: "Workspace name" });
  await expect(name).toHaveAccessibleDescription("Shown in your workspace switcher. Up to 80 characters.");
  const save = panel.getByRole("button", { name: "Save workspace" });
  await expect(save).toBeDisabled();
  await name.fill("Launch team");
  await expect(save).toBeEnabled();
  await save.click();
  await expect(panel.getByRole("status")).toHaveText("Workspace name saved.");
  await expect(save).toBeDisabled();
  expect((await db.workspace.findUnique({ where: { id: workspace.id } })).name).toBe("Launch team");
  expect((await new AxeBuilder({ page }).include("#workspace").analyze()).violations).toEqual([]);

  const memberContext = await browser.newContext({ viewport: { width: 320, height: 780 } });
  await memberContext.addCookies([
    { name: "ba.session_token", value: memberCookie, url: "http://127.0.0.1:3100", httpOnly: true, sameSite: "Lax" },
    { name: "waitlyze-workspace", value: workspace.id, url: "http://127.0.0.1:3100", httpOnly: true, sameSite: "Lax" },
  ]);
  try {
    const memberPage = await memberContext.newPage();
    await memberPage.goto("/settings#workspace");
    const memberPanel = memberPage.locator("#workspace");
    await expect(memberPanel.getByText("Only workspace owners and admins can change this name.")).toBeVisible();
    await expect(memberPanel.locator("input[name=name]")).toHaveCount(0);
    expect(await memberPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  } finally {
    await memberContext.close();
  }
});
