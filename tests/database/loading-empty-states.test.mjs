import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { startFixtureServer, signedCookie } from "../support/http-fixture.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });
const base = "http://127.0.0.1:3100";

test("waitlist and subscriber loading, empty, and retry states keep the next step clear", async (t) => {
  const userId = `fixture-${randomUUID()}`;
  let server;
  let browser;
  const waitlistId = `waitlist-${randomUUID()}`;
  t.after(async () => {
    await browser?.close();
    if (server?.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
    await db.waitList.deleteMany({ where: { userId } });
    await db.workspace.deleteMany({ where: { members: { some: { userId } } } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  await db.user.create({ data: { id: userId, email: `${userId}@example.invalid` } });
  const token = randomUUID();
  await db.session.create({ data: { id: randomUUID(), token, userId, expiresAt: new Date(Date.now() + 120_000) } });
  const workspaces = createWorkspaceService(db);
  const personal = await workspaces.ensurePersonal(userId);
  await db.waitList.create({ data: { id: waitlistId, userId, workspaceId: personal.id, name: "First launch" } });
  const emptyWorkspace = await db.workspace.create({ data: { name: "Empty workspace", members: { create: { userId, role: "ADMIN" } } } });
  server = await startFixtureServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  context.setDefaultTimeout(15_000);
  const cookie = signedCookie(token).split("=");
  await context.addCookies([{ name: cookie[0], value: cookie[1], domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
  const page = await context.newPage();

  await page.goto(`${base}/wait-lists`);
  await page.getByLabel("Workspace", { exact: true }).selectOption(emptyWorkspace.id);
  await page.getByRole("button", { name: "Switch", exact: true }).click();
  await page.getByRole("heading", { name: "Your next launch starts here." }).waitFor();
  assert.equal(await page.getByRole("link", { name: "New waitlist", exact: true }).getAttribute("href"), "/wait-lists/new");
  assert.equal(await page.locator(".product-empty").getByRole("link", { name: "Create your first waitlist" }).getAttribute("href"), "/wait-lists/new");

  await page.getByLabel("Workspace", { exact: true }).selectOption(personal.id);
  await page.getByRole("button", { name: "Switch", exact: true }).click();
  await page.goto(`${base}/wait-lists?q=${encodeURIComponent(`no-match-${randomUUID()}`)}`);
  await page.getByRole("heading", { name: "No waitlists found" }).waitFor();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await page.getByRole("row", { name: /First launch/ }).waitFor();

  await db.$executeRawUnsafe('ALTER TABLE "workspace_integrations" RENAME TO "workspace_integrations_settings_test"');
  try {
    await page.goto(`${base}/settings`);
    await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Integrations couldn’t load", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Team access", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Privacy & data", exact: true }).waitFor();
    assert.equal(await page.getByRole("heading", { name: "Settings couldn’t load", exact: true }).count(), 0);
  } finally {
    await db.$executeRawUnsafe('ALTER TABLE "workspace_integrations_settings_test" RENAME TO "workspace_integrations"');
  }

  await db.$executeRawUnsafe('ALTER TABLE "workspace_invitations" RENAME TO "workspace_invitations_settings_test"');
  try {
    await page.goto(`${base}/settings`);
    await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Team access couldn’t load", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Integrations", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Privacy & data", exact: true }).waitFor();
    assert.equal(await page.getByRole("heading", { name: "Settings couldn’t load", exact: true }).count(), 0);
  } finally {
    await db.$executeRawUnsafe('ALTER TABLE "workspace_invitations_settings_test" RENAME TO "workspace_invitations"');
  }
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByLabel("Email address").waitFor();

  const { snapshotTemplate } = await import("../../src/lib/templates/catalog.mjs");
  const reorderWaitlist = await db.waitList.create({
    data: { userId, workspaceId: personal.id, name: "Reorder fixture", publicSlug: `reorder-${randomUUID()}`, templateSnapshot: snapshotTemplate("mobile") },
  });
  await page.goto(`${base}/wait-lists/${reorderWaitlist.id}/edit`);
  await page.getByRole("heading", { name: "Page content", exact: true }).waitFor();
  await page.getByRole("button", { name: "Add a section", exact: true }).click();
  await page.getByLabel("Section", { exact: true }).selectOption("features");
  await page.getByRole("button", { name: "Add section", exact: true }).click();
  const moveHighlightsUp = page.getByRole("button", { name: "Move Highlights up", exact: true });
  await moveHighlightsUp.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("status").filter({ hasText: "Highlights moved to position 2 of 4." }).waitFor();
  await page.waitForFunction(() => document.activeElement?.id === "section-1-move-down");
  assert.equal(await page.getByRole("button", { name: "Move Highlights down", exact: true }).evaluate((element) => element === document.activeElement), true);
  assert.deepEqual(await page.locator(".product-builder-section legend").allTextContents(), ["Introduction", "Highlights", "Signup form", "Questions"]);

  let releaseInitialRequest;
  let initialRequestHeld = true;
  let allowRetrySuccess = false;
  let releaseRetryFailure;
  let releaseEmptySearch;
  const retryFailureHeld = new Promise((resolve) => { releaseRetryFailure = resolve; });
  const delayedResponse = new Promise((resolve) => { releaseInitialRequest = resolve; });
  const emptySearchResponse = new Promise((resolve) => { releaseEmptySearch = resolve; });
  const subscriberRequest = (url) => url.pathname === `/api/wait-lists/${waitlistId}/subscribers`;
  await page.route(subscriberRequest, async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("q") === "mobile-profile") {
      const subscriber = { id: "mobile-subscriber", email: "person@example.invalid", verifiedAt: null, createdAt: new Date().toISOString(), referralCount: 2, city: "Pune", country: "IN", device: "Mobile" };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [subscriber], total: 1, nextCursor: null }) });
      return;
    }
    if (url.searchParams.get("q") === "waiting-empty") {
      await emptySearchResponse;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [], total: 0, nextCursor: null }) });
      return;
    }
    if (url.searchParams.get("q") === "retry-me" || url.searchParams.get("q") === "retry-fails") {
      if (url.searchParams.get("q") === "retry-fails" && !allowRetrySuccess) {
        await retryFailureHeld;
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Unavailable" }) });
        return;
      }
      const subscriber = { id: "subscriber-1", email: "found@example.invalid", verifiedAt: null, createdAt: new Date().toISOString(), referralCount: 0, city: null, country: null, device: null };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [subscriber], total: 1, nextCursor: null }) });
      return;
    }
    if (url.searchParams.get("status") === "all" && initialRequestHeld) {
      initialRequestHeld = false;
      await delayedResponse;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [], total: 0, nextCursor: null }) });
      return;
    }
    await route.continue();
  });
  try {
    await page.goto(`${base}/wait-lists/${waitlistId}/subscribers`);
    await page.setViewportSize({ width: 375, height: 812 });
    const waitlistNav = page.getByRole("navigation", { name: "Waitlist sections" });
    await page.waitForFunction(() => document.querySelector('[aria-label="Waitlist sections"]')?.dataset.overflow === "true");
    assert.equal(await waitlistNav.getAttribute("aria-describedby"), "waitlist-section-scroll-hint");
    assert.equal(await page.getByText("Scroll horizontally to see all waitlist sections.").count(), 1);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForFunction(() => !document.querySelector('[aria-label="Waitlist sections"]')?.dataset.overflow);
    assert.equal(await page.getByText("Scroll horizontally to see all waitlist sections.").count(), 0);
    const table = page.locator(".product-panel");
    await page.locator(".product-subscriber-skeleton-row").first().waitFor();
    assert.equal(await table.getAttribute("aria-busy"), "true");
    assert.equal(await table.locator("footer [role=status]").innerText(), "Updating subscribers…");
    assert.equal(await page.locator(".product-subscriber-skeleton-row").count(), 5);
    const skeleton = page.locator(".product-subscriber-skeleton-row i").first();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    assert.equal(await skeleton.evaluate((element) => getComputedStyle(element).animationName), "product-skeleton-shimmer");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await skeleton.evaluate((element) => getComputedStyle(element).animationName), "none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    releaseInitialRequest();
    await page.getByText("No subscribers yet", { exact: true }).waitFor();
    assert.equal(await page.getByText("Publish and share your waitlist page to invite the first signups.").count(), 1);
    assert.equal(await page.getByRole("link", { name: "Open waitlist overview" }).getAttribute("href"), `/wait-lists/${waitlistId}`);
    assert.deepEqual((await new AxeBuilder({ page }).include(".product-panel").analyze()).violations, []);

    const search = page.getByLabel("Search subscribers by email");
    await search.fill("waiting-empty");
    await page.locator(".product-subscriber-skeleton-row").first().waitFor();
    assert.equal(await page.getByText("No subscribers yet", { exact: true }).count(), 0);
    assert.equal(await table.locator("footer [role=status]").innerText(), "Updating subscribers…");
    releaseEmptySearch();
    await page.getByText("No subscribers match this search", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByText("No subscribers yet", { exact: true }).waitFor();

    await search.fill("mobile-profile");
    const mobileSubscriber = page.getByRole("button", { name: "person@example.invalid" });
    await mobileSubscriber.waitFor();
    await page.setViewportSize({ width: 320, height: 812 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await table.locator("thead th").nth(2).isVisible(), false);
    assert.equal(await table.locator("thead th").nth(3).isVisible(), false);
    assert.equal(await mobileSubscriber.isVisible(), true);
    await mobileSubscriber.click();
    const profile = page.getByRole("dialog", { name: "Subscriber profile" });
    await profile.waitFor();
    const profileBounds = await profile.boundingBox();
    assert.ok(profileBounds && profileBounds.x === 0 && profileBounds.y === 0 && profileBounds.width === 320 && profileBounds.height === 812);
    await profile.getByText("Pune, IN", { exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await profile.waitFor({ state: "hidden" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await search.fill("");
    await page.getByText("No subscribers yet", { exact: true }).waitFor();

    await page.getByRole("button", { name: "Verified", exact: true }).click();
    await page.getByText("No verified subscribers yet", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByText("No subscribers yet", { exact: true }).waitFor();

    await search.fill("retry-me");
    await page.getByRole("row", { name: /found@example\.invalid/ }).waitFor();
    await search.fill("retry-fails");
    const staleResults = page.getByRole("status").filter({ hasText: "Updating results." });
    await staleResults.waitFor();
    assert.match(await staleResults.innerText(), /showing subscribers for “retry-me”/i);
    releaseRetryFailure();
    const refreshError = page.getByRole("alert").filter({ hasText: "Couldn’t refresh the list." });
    await refreshError.getByRole("button", { name: "Try again" }).waitFor();
    assert.match(await refreshError.innerText(), /Showing the last loaded results/);
    assert.equal(await page.getByRole("row", { name: /found@example\.invalid/ }).count(), 1);
    allowRetrySuccess = true;
    await refreshError.getByRole("button", { name: "Try again" }).click();
    await refreshError.waitFor({ state: "detached" });
    await page.getByText("1–1 of 1", { exact: true }).waitFor();
    assert.equal(await page.getByRole("row", { name: /found@example\.invalid/ }).count(), 1);
  } finally {
    releaseRetryFailure?.();
    releaseInitialRequest?.();
    releaseEmptySearch?.();
    await page.unroute(subscriberRequest);
  }
});
