import { randomUUID, createHmac } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { FIXTURE_AUTH_SECRET } from "../../scripts/test-environment.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });
const ownerId = `integration-${randomUUID()}`;
let workspace;
let sessionCookie;

test.beforeAll(async () => {
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  workspace = await createWorkspaceService(db).ensurePersonal(ownerId);
  const token = randomUUID();
  await db.session.create({ data: { id: randomUUID(), token, userId: ownerId, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  sessionCookie = encodeURIComponent(`${token}.${createHmac("sha256", FIXTURE_AUTH_SECRET).update(token).digest("base64")}`);
});

test.afterAll(async () => {
  if (workspace) await db.workspace.deleteMany({ where: { id: workspace.id } });
  await db.user.deleteMany({ where: { id: ownerId } });
  await db.$disconnect();
});

test("Resend setup is keyboard usable, encrypted, private, and clear about its test action", async ({ page }) => {
  await page.context().addCookies([{ name: "ba.session_token", value: sessionCookie, url: "http://127.0.0.1:3100", httpOnly: true, sameSite: "Lax" }]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route("**/api/settings/integrations/resend/test", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { status: "CONNECTED", lastTestedAt: new Date().toISOString(), sentTo: `${ownerId}@example.invalid` } }) }));
  await page.goto("/settings#integrations");
  await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();
  const integrationCard = page.locator(".product-integration-card");
  await page.getByLabel("Resend sending API key").fill("re_fixture_workspace_key_123456");
  await page.getByLabel("From email").fill("hello@company.example");
  await page.getByLabel("From email").press("Enter");
  await expect(integrationCard.getByRole("status")).toHaveText("Saved. Send a test email to activate this connection.");

  const saved = await db.workspaceIntegration.findUnique({ where: { workspaceId_provider: { workspaceId: workspace.id, provider: "RESEND" } } });
  expect(saved.status).toBe("NEEDS_TEST");
  expect(saved.secretCiphertext).not.toContain("re_fixture_workspace_key_123456");
  await expect(page.getByText("Test needed")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("re_fixture_workspace_key_123456");
  expect((await new AxeBuilder({ page }).include(".product-integration-card").analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: "Send test email" }).focus();
  await page.getByRole("button", { name: "Send test email" }).press("Enter");
  await expect(integrationCard.getByRole("status")).toContainText(`Test email sent to ${ownerId}@example.invalid.`);
  await expect(page.getByText("Connected")).toBeVisible();

  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(integrationCard.getByRole("status")).toHaveText("Resend disconnected. Waitlist emails will use the deployment sender.");
  expect(await db.workspaceIntegration.count({ where: { workspaceId: workspace.id } })).toBe(0);
});
