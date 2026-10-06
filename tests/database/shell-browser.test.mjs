import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { createWorkspaceService } from "../../src/lib/workspaces/service.mjs";
import { snapshotTemplate } from "../../src/lib/templates/catalog.mjs";
import { createDraft } from "../../src/lib/campaigns/create-draft.mjs";
import { startFixtureServer, signedCookie } from "../support/http-fixture.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });
const service = createWorkspaceService(db);
const base = "http://127.0.0.1:3100";

test("authenticated two-destination shell uses real workspace data", async (t) => {
  const userId = `fixture-${randomUUID()}`;
  const otherUserId = `fixture-${randomUUID()}`;
  let server, browser;
  let initialDraft;
  t.after(async () => {
    await browser?.close();
    if (server?.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
    await db.waitList.deleteMany({ where: { userId } });
    await db.waitList.deleteMany({ where: { userId: otherUserId } });
    await db.workspace.deleteMany({ where: { members: { some: { userId } } } });
    await db.workspace.deleteMany({ where: { members: { some: { userId: otherUserId } } } });
    await db.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: userId, email: `${userId}@example.invalid`, name: "Shell fixture" } });
  const token = randomUUID();
  await db.session.create({ data: { id: randomUUID(), token, userId, expiresAt: new Date(Date.now() + 120000) } });
  const personal = await service.ensurePersonal(userId);
  const waitlist = await db.waitList.create({ data: { userId, workspaceId: personal.id, name: "First launch", description: "Real fixture content" } });
  const legacyWaitlist = await db.waitList.create({ data: { userId, workspaceId: personal.id, name: "Legacy launch" } });
  await db.user.create({ data: { id: otherUserId, email: `${otherUserId}@example.invalid` } });
  const otherSessionToken = randomUUID();
  await db.session.create({ data: { id: randomUUID(), token: otherSessionToken, userId: otherUserId, expiresAt: new Date(Date.now() + 120000) } });
  const otherWorkspace = await service.ensurePersonal(otherUserId);
  await db.waitList.create({ data: { userId: otherUserId, workspaceId: otherWorkspace.id, name: "First launch external" } });
  server = await startFixtureServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  context.setDefaultTimeout(15_000);
  context.setDefaultNavigationTimeout(15_000);
  const cookie = signedCookie(token).split("=");
  await context.addCookies([{ name: cookie[0], value: cookie[1], domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await t.test("dashboard redirects and navigation has exactly two real destinations", async () => {
    await page.goto(`${base}/dashboard`);
    await page.waitForURL((url) => url.pathname === "/wait-lists");
    assert.deepEqual(await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link").allTextContents(), ["Waitlists", "Settings"]);
    const currentMainLink = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Waitlists", exact: true });
    assert.equal(await currentMainLink.getAttribute("aria-current"), "page");
    const lightThemeMarker = await currentMainLink.evaluate((element) => getComputedStyle(element).boxShadow);
    assert.ok(lightThemeMarker.includes("inset") && lightThemeMarker.includes("-2px"));
    assert.equal(await page.locator("aside").count(), 0);
    await page.getByRole("row", { name: /First launch/ }).waitFor();
    assert.equal(await page.getByLabel("Workspace", { exact: true }).count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    const waitlistTable = page.locator(".product-waitlist-table");
    const tableViewport = page.locator(".product-table-wrap");
    try {
      assert.equal(await tableViewport.evaluate((element) => getComputedStyle(element).overflowX), "clip");
      assert.equal(await waitlistTable.locator("tbody tr:first-child td:nth-child(3)").evaluate((element) => getComputedStyle(element).display), "none");
      assert.equal(await waitlistTable.locator("tbody tr:first-child td:nth-child(2)").isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    } finally {
      await page.setViewportSize({ width: 1280, height: 900 });
    }
    const appMain = page.locator(".product-main");
    assert.equal(await appMain.evaluate((element) => getComputedStyle(element).backgroundImage), "none");
    await page.locator("html").evaluate((element) => element.classList.add("dark"));
    assert.equal(await appMain.evaluate((element) => getComputedStyle(element).backgroundImage), "none");
    const darkThemeMarker = await currentMainLink.evaluate((element) => getComputedStyle(element).boxShadow);
    assert.ok(darkThemeMarker.includes("inset") && darkThemeMarker.includes("-2px"));
    await page.locator("html").evaluate((element) => element.classList.remove("dark"));
  });
  await t.test("waitlist list explains first-use and filtered empty states", async () => {
    const emptyWorkspace = await db.workspace.create({ data: { name: "Empty workspace", members: { create: { userId, role: "ADMIN" } } } });
    await page.goto(`${base}/wait-lists`);
    await page.getByLabel("Workspace", { exact: true }).selectOption(emptyWorkspace.id);
    await page.getByRole("button", { name: "Switch", exact: true }).click();
    await page.getByRole("heading", { name: "Your next launch starts here." }).waitFor();
    assert.equal(await page.getByRole("link", { name: "New waitlist", exact: true }).getAttribute("href"), "/wait-lists/new");

    await page.getByLabel("Workspace", { exact: true }).selectOption(personal.id);
    await page.getByRole("button", { name: "Switch", exact: true }).click();
    await page.goto(`${base}/wait-lists?q=${encodeURIComponent(`no-match-${randomUUID()}`)}`);
    await page.getByRole("heading", { name: "No waitlists found" }).waitFor();
    await page.getByRole("link", { name: "Clear filters" }).click();
    await page.getByRole("row", { name: /First launch/ }).waitFor();
  });
  await t.test("subscriber first-load skeleton and empty/filter states are useful and recoverable", async () => {
    let releaseRequest;
    const delayedResponse = new Promise((resolve) => { releaseRequest = resolve; });
    const subscriberRequest = (url) => url.pathname === `/api/wait-lists/${waitlist.id}/subscribers` && url.searchParams.get("status") === "all";
    await page.route(subscriberRequest, async (route) => {
      await delayedResponse;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [], total: 0, nextCursor: null }) });
    });
    try {
      await page.goto(`${base}/wait-lists/${waitlist.id}/subscribers`);
      const table = page.locator(".product-panel");
      await page.locator(".product-subscriber-skeleton-row").first().waitFor();
      assert.equal(await table.getAttribute("aria-busy"), "true");
      assert.equal(await table.locator("footer [role=status]").innerText(), "Updating subscribers…");
      assert.equal(await page.locator(".product-subscriber-skeleton-row").count(), 5);
      releaseRequest();
      await page.getByText("No subscribers yet", { exact: true }).waitFor();
      assert.equal(await page.getByText("Publish and share your waitlist page to invite the first signups.").count(), 1);
      assert.equal(await page.getByRole("link", { name: "Open waitlist overview" }).getAttribute("href"), `/wait-lists/${waitlist.id}`);
      assert.deepEqual((await new AxeBuilder({ page }).include(".product-panel").analyze()).violations, []);

      const verifiedResponse = page.waitForResponse((response) => response.url().includes("status=verified") && response.status() === 200);
      await page.getByRole("button", { name: "Verified", exact: true }).click();
      await verifiedResponse;
      await page.getByText("No verified subscribers yet", { exact: true }).waitFor();
      assert.equal(await page.getByText("Publish and share your waitlist page to invite the first signups.").count(), 0);
      await page.getByRole("button", { name: "Clear filters" }).click();
      await page.getByText("No subscribers yet", { exact: true }).waitFor();
    } finally {
      releaseRequest();
      await page.unroute(subscriberRequest);
    }
  });
  await t.test("custom domain settings expose a loading skeleton and recover after a failed read", async () => {
    let requestCount = 0;
    let releaseInitial;
    const initialResponse = new Promise((resolve) => { releaseInitial = resolve; });
    const domainRequest = (url) => url.pathname === `/api/wait-lists/${waitlist.id}/domain`;
    await page.route(domainRequest, async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await initialResponse;
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) });
      } else if (requestCount === 2) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Temporarily unavailable" }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) });
      }
    });
    try {
      await page.goto(`${base}/wait-lists/${waitlist.id}/settings`);
      await page.locator(".product-domain-skeleton").waitFor();
      assert.equal(await page.locator(".product-custom-domain [role=status]").filter({ hasText: "Loading custom domain…" }).count(), 1);
      assert.equal(await page.getByLabel("Custom hostname").count(), 0);
      releaseInitial();
      await page.getByText("Custom domains are unavailable until Vercel project credentials and the app root domain are configured.").waitFor();

      await page.reload();
      await page.getByRole("alert").filter({ hasText: "Custom domain status couldn’t be loaded." }).waitFor();
      assert.equal(await page.getByLabel("Custom hostname").count(), 0);
      await page.locator(".product-domain-load-error").getByRole("button", { name: "Retry" }).click();
      await page.getByText("Custom domains are unavailable until Vercel project credentials and the app root domain are configured.").waitFor();
      assert.equal(await page.locator(".product-domain-load-error").count(), 0);
      assert.equal(requestCount, 3);
    } finally {
      releaseInitial();
      await page.unroute(domainRequest);
      await page.goto(`${base}/wait-lists`);
    }
  });
  await t.test("webhook settings wait for endpoint loading, distinguish empty data, and recover after a failed request", async () => {
    let requestCount = 0;
    let releaseInitial;
    const initialResponse = new Promise((resolve) => { releaseInitial = resolve; });
    const webhookRequest = (url) => url.pathname === `/api/wait-lists/${waitlist.id}/webhooks`;
    await page.route(webhookRequest, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ data: { id: "fixture-endpoint", secret: "whsec_fixture" } }) });
        return;
      }
      requestCount += 1;
      if (requestCount === 1) {
        await initialResponse;
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
      } else if (requestCount === 2) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Webhook service temporarily unavailable." }) });
      } else if (requestCount === 4) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Webhook service temporarily unavailable." }) });
      } else {
        const data = requestCount === 3 || requestCount === 5 ? [{
          id: "fixture-endpoint",
          name: "Existing endpoint",
          url: "https://api.example.invalid/events",
          eventTypes: ["signup.created"],
          enabled: true,
          deliveries: [{ id: "fixture-delivery", eventType: "signup.created", status: "FAILED", responseStatus: 503, lastErrorCode: "delivery_error" }],
        }] : [];
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data }) });
      }
    });

    try {
      await page.goto(`${base}/wait-lists/${waitlist.id}/settings`);
      await page.locator(".product-webhook-settings [role=status]").getByText("Loading webhook endpoints…").waitFor();
      assert.equal(await page.locator(".product-webhook-settings article[aria-hidden=true]").count(), 1);
      assert.equal(await page.locator(".product-webhook-settings form").count(), 0);
      releaseInitial();
      await page.getByText("No webhook endpoints yet.").waitFor();
      assert.equal(await page.locator(".product-webhook-settings form").count(), 1);

      await page.reload();
      await page.getByRole("alert").getByText("Webhook service temporarily unavailable.").waitFor();
      assert.equal(await page.locator(".product-webhook-settings form").count(), 0);
      await page.getByRole("button", { name: "Retry" }).click();
      await page.getByRole("heading", { name: "Existing endpoint" }).waitFor();
      assert.equal(await page.locator(".product-webhook-settings form").count(), 1);
      assert.equal(requestCount, 3);

      await page.getByLabel("Endpoint name").fill("Fixture endpoint");
      await page.getByLabel("HTTPS endpoint").fill("https://api.example.invalid/events");
      await page.getByRole("button", { name: "Add endpoint" }).click();
      await page.getByRole("alert").getByText("Webhook service temporarily unavailable.").waitFor();
      assert.equal(await page.locator(".product-webhook-settings [role=status]").innerText(), "");
      const endpoint = page.locator(".product-webhook-endpoint").filter({ has: page.getByRole("heading", { name: "Existing endpoint" }) });
      for (const name of ["Send test", "Pause", "Rotate secret", "Replay"]) {
        assert.equal(await endpoint.getByRole("button", { name }).isDisabled(), true, `${name} stays disabled while endpoint refresh is unavailable`);
      }
      assert.equal(await page.getByRole("button", { name: "Add endpoint" }).isDisabled(), true);
      await page.getByRole("button", { name: "Retry" }).click();
      await page.locator(".product-webhook-settings [role=alert]").waitFor({ state: "hidden" });
      for (const name of ["Send test", "Pause", "Rotate secret", "Replay"]) {
        assert.equal(await endpoint.getByRole("button", { name }).isDisabled(), false, `${name} is restored after endpoint refresh succeeds`);
      }
      assert.equal(await page.getByRole("button", { name: "Add endpoint" }).isDisabled(), false);
      assert.equal(requestCount, 5);
    } finally {
      releaseInitial();
      await page.unroute(webhookRequest);
      await page.goto(`${base}/wait-lists`);
    }
  });
  await t.test("legacy page editor renders safely and names its icon actions", async () => {
    await page.goto(`${base}/wait-lists/${legacyWaitlist.id}/edit`);
    await page.getByRole("button", { name: "Email templates" }).waitFor();
    await page.getByRole("button", { name: "Embed instructions" }).waitFor();
    await page.getByRole("button", { name: "Share waitlist" }).waitFor();

    await page.getByRole("button", { name: "Embed instructions" }).click();
    const embedDialog = page.getByRole("dialog");
    await embedDialog.getByText("Follow these steps to embed the form on your website.").waitFor();
    assert.match(await embedDialog.locator("pre").first().innerText(), /http:\/\/127\.0\.0\.1:3100\/js\/embed\.js/);
    assert.equal(await embedDialog.getByRole("button", { name: "Copy code" }).count(), 2);
    await embedDialog.evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
    });
    assert.deepEqual((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations, []);
    await embedDialog.getByRole("button", { name: "Done" }).click();
    await embedDialog.waitFor({ state: "hidden" });

    await page.getByRole("button", { name: "Share waitlist" }).click();
    const shareDialog = page.getByRole("dialog");
    assert.equal(await shareDialog.getByLabel("Link").inputValue(), `${base}/forms/${legacyWaitlist.id}`);
    await page.locator('[data-state="open"]').evaluateAll(async (elements) => {
      await Promise.all(elements.flatMap((element) => element.getAnimations({ subtree: true })).map((animation) => animation.finished.catch(() => {})));
    });
    assert.equal(await shareDialog.getByRole("button", { name: "Close" }).count(), 1);
    assert.deepEqual((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations, []);
    await page.keyboard.press("Escape");
    await shareDialog.waitFor({ state: "hidden" });
    await page.goto(`${base}/wait-lists`);
  });
  await t.test("profile saves on the real account and settings passes axe", async () => {
    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await page.getByLabel("Display name").fill("Updated fixture");
    await page.getByRole("button", { name: "Save profile" }).click();
    await page.getByRole("status").filter({ hasText: "Profile saved." }).waitFor();
    assert.equal((await db.user.findUnique({ where: { id: userId } })).name, "Updated fixture");
    await page.reload();
    assert.equal(await page.getByLabel("Display name").inputValue(), "Updated fixture");
    await page.getByLabel("Display name").fill("   ");
    await page.getByRole("button", { name: "Save profile" }).click();
    await page.getByRole("alert").filter({ hasText: "Enter a name" }).waitFor();
    assert.equal(await page.getByLabel("Display name").inputValue(), "   ");
    await page.getByLabel("Display name").fill("Updated fixture");
    await page.locator('.product-settings-desktop a[href="#team"]').click();
    await page.getByRole("heading", { name: "Team access", exact: true }).waitFor();
    await page.getByLabel("Email address").waitFor();
    await page.getByRole("combobox", { name: "Role" }).selectOption("MEMBER");
    await page.getByText("You’re the only member in this workspace.").waitFor();
    await page.route("**/api/settings/integrations/resend", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Provider temporarily unavailable." }) });
      } else {
        await route.continue();
      }
    });
    await page.locator('.product-settings-desktop a[href="#integrations"]').click();
    await page.getByLabel("Resend sending API key").fill("re_test_fixture_key");
    await page.getByLabel("From email").fill("hello@example.invalid");
    await page.getByRole("button", { name: "Save connection" }).click();
    await page.getByRole("alert").filter({ hasText: "Provider temporarily unavailable." }).waitFor();
    assert.equal(await page.getByLabel("Resend sending API key").inputValue(), "re_test_fixture_key");
    await page.unroute("**/api/settings/integrations/resend");
    assert.deepEqual((await new AxeBuilder({ page }).include(".product-shell").analyze()).violations, []);
  });
  await t.test("workspace invitation requires the invited verified account and joins explicitly", async () => {
    await db.user.update({ where: { id: otherUserId }, data: { emailVerified: true } });
    const inviteToken = randomBytes(32).toString("base64url");
    const { hashInvitationToken } = await import("../../src/lib/workspaces/invitations.mjs");
    const invitation = await db.workspaceInvitation.create({ data: {
      workspaceId: personal.id,
      emailNormalized: `${otherUserId}@example.invalid`,
      role: "MEMBER",
      tokenHash: hashInvitationToken(inviteToken),
      tokenCiphertext: "fixture-encrypted-token",
      tokenIv: "fixture-iv",
      tokenTag: "fixture-tag",
      expiresAt: new Date(Date.now() + 60_000),
      createdByUserId: userId,
    } });
    const inviteUrl = `${base}/accept-invitation/${inviteToken}`;
    await page.goto(inviteUrl);
    await page.getByRole("alert").filter({ hasText: "Switch to the invited account" }).waitFor();
    await page.getByRole("button", { name: "Switch account" }).waitFor();

    const invitedContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const invitedCookie = signedCookie(otherSessionToken).split("=");
    await invitedContext.addCookies([{ name: invitedCookie[0], value: invitedCookie[1], domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
    const invitedPage = await invitedContext.newPage();
    try {
      await invitedPage.goto(inviteUrl);
      assert.deepEqual((await new AxeBuilder({ page: invitedPage }).include(".product-invitation-card").analyze()).violations, []);
      await invitedPage.getByRole("button", { name: "Accept invitation" }).click();
      await invitedPage.waitForURL(`${base}/wait-lists`);
      const membership = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: personal.id, userId: otherUserId } } });
      assert.equal(membership.role, "MEMBER");
      const accepted = await db.workspaceInvitation.findUnique({ where: { id: invitation.id } });
      assert.equal(accepted.status, "ACCEPTED");
      assert.equal(accepted.tokenCiphertext, "");
    } finally {
      await invitedContext.close();
    }
    await page.goto(`${base}/wait-lists`);
  });
  await t.test("account export downloads scoped settings without subscribers or credentials", async () => {
    const subscriberEmail = "must-not-export-subscriber@example.invalid";
    const broadcastRecipientEmail = "must-not-export-broadcast-recipient@example.invalid";
    const apiSecretMarker = "must-not-export-api-secret-hash";
    const integrationSecretMarker = "must-not-export-integration-secret";
    const subscriber = await db.signUp.create({ data: { uniqueUserId: randomUUID(), email: subscriberEmail, emailNormalized: subscriberEmail, waitListId: waitlist.id } });
    await db.apiKey.create({ data: { name: "Export fixture key", keyHash: apiSecretMarker, userId, waitlistId: legacyWaitlist.id } });
    await db.workspaceIntegration.create({ data: { workspaceId: personal.id, provider: "RESEND", status: "TESTED", secretCiphertext: integrationSecretMarker, secretIv: "integration-iv-marker", secretTag: "integration-tag-marker", fromEmail: "sender@example.invalid" } });
    await db.emailTemplate.create({ data: { waitListId: waitlist.id, type: "SIGNUP", subject: "Confirm your email", previewText: "One last step", header: "You are on the list", subHeader: "", mainBody: "Confirm to finish joining", subBody: "Thanks for your interest" } });
    await db.automationRecipe.create({ data: { waitListId: waitlist.id, type: "WELCOME", status: "DRAFT", currentVersion: 1, versions: { create: { version: 1, config: { trigger: "SIGNUP_VERIFIED", delayMinutes: 0, subject: "Welcome to First launch", body: "Thanks for confirming." } } } } });
    await db.marketingBroadcast.create({ data: { waitListId: waitlist.id, name: "Export fixture broadcast", subject: "A product update", previewText: "See what is new", body: "We have a launch update.", recipients: { create: { signUpId: subscriber.id, email: broadcastRecipientEmail, emailNormalized: broadcastRecipientEmail } } } });
    try {
      const waitlistsResponse = page.waitForResponse((response) => response.url().endsWith("/api/v1/waitlists"));
      await page.goto(`${base}/settings#privacy`);
      await page.getByRole("heading", { name: "Privacy & data" }).waitFor();
      const waitlists = await waitlistsResponse;
      assert.equal(waitlists.status(), 200);
      assert.ok((await waitlists.json()).data.some((item) => item.id === waitlist.id), "the active workspace must expose its waitlist to the API key picker");
      const response = await page.request.get(`${base}/api/settings/export`);
      const body = await response.text();
      assert.equal(response.status(), 200, body);
      assert.match(response.headers()["content-disposition"], /attachment; filename="waitlyze-account-data\.json"/);
      assert.equal(response.headers()["cache-control"], "private, no-store");
      assert.equal(response.headers()["x-content-type-options"], "nosniff");
      const exported = JSON.parse(body);
      assert.equal(exported.account.email, `${userId}@example.invalid`);
      assert.equal(exported.workspaces[0].name, "Personal workspace");
      assert.ok(exported.campaigns.some((campaign) => campaign.name === "First launch"));
      const exportedCampaign = exported.campaigns.find((campaign) => campaign.name === "First launch");
      assert.equal(exportedCampaign.emailTemplates[0].subject, "Confirm your email");
      assert.equal(exportedCampaign.automations[0].versions[0].config.subject, "Welcome to First launch");
      assert.equal(exportedCampaign.broadcasts[0].body, "We have a launch update.");
      assert.equal(exported.campaigns.some((campaign) => campaign.name === "First launch external"), false);
      assert.ok(exported.developerKeys.some((key) => key.name === "Export fixture key"));
      assert.ok(exported.integrations.some((integration) => integration.fromEmail === "sender@example.invalid"));
      assert.match(JSON.stringify(exported.dataNotes), /Subscribers page/);
      for (const marker of [subscriberEmail, broadcastRecipientEmail, apiSecretMarker, integrationSecretMarker, "integration-iv-marker", "integration-tag-marker"]) {
        assert.equal(body.includes(marker), false, `export leaked ${marker}`);
      }
      assert.equal(Object.hasOwn(exported.workspaces[0], "id"), false);
      assert.equal(Object.hasOwn(exported.campaigns.find((campaign) => campaign.name === "First launch"), "id"), false);
      const anonymousContext = await browser.newContext();
      try {
        const anonymous = await anonymousContext.request.get(`${base}/api/settings/export`);
        assert.equal(anonymous.status(), 401);
        assert.equal(anonymous.headers()["cache-control"], "private, no-store");
      } finally {
        await anonymousContext.close();
      }
    } finally {
      await db.signUp.deleteMany({ where: { waitListId: waitlist.id, emailNormalized: subscriberEmail } });
      await db.apiKey.deleteMany({ where: { userId, name: "Export fixture key" } });
      await db.workspaceIntegration.deleteMany({ where: { workspaceId: personal.id, provider: "RESEND" } });
      await db.emailTemplate.deleteMany({ where: { waitListId: waitlist.id, type: "SIGNUP" } });
      await db.automationRecipe.deleteMany({ where: { waitListId: waitlist.id, type: "WELCOME" } });
      await db.marketingBroadcast.deleteMany({ where: { waitListId: waitlist.id, name: "Export fixture broadcast" } });
    }
  });
  await t.test("developer settings creates a waitlist-bound key once and lists only safe metadata", async (t) => {
    let releaseKeyRequest;
    const heldKeyRequest = new Promise((resolve) => { releaseKeyRequest = resolve; });
    let firstKeyRequest = true;
    const apiKeysRequest = (url) => url.pathname === "/api/v1/api-keys";
    t.after(async () => { releaseKeyRequest(); await page.unroute(apiKeysRequest); });
    await page.route(apiKeysRequest, async (route) => {
      if (!firstKeyRequest) return route.continue();
      firstKeyRequest = false;
      await heldKeyRequest;
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { message: "Temporary API key error" } }) });
    });
    await page.goto(`${base}/settings?test=api-key-loading#developers`);
    await page.getByRole("heading", { name: "Developers", exact: true }).waitFor();
    const apiKeyTable = page.locator("#developers .product-table-wrap table");
    await apiKeyTable.locator(".product-api-key-skeleton").first().waitFor({ state: "attached" });
    assert.equal(await apiKeyTable.getAttribute("aria-busy"), "true");
    assert.equal(await apiKeyTable.getByText("No API keys found. Create one to start using the API.").count(), 0);
    const keySkeleton = apiKeyTable.locator(".product-api-key-skeleton").first();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    assert.equal(await keySkeleton.evaluate((element) => getComputedStyle(element).animationName), "product-skeleton-shimmer");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await keySkeleton.evaluate((element) => getComputedStyle(element).animationName), "none");
    releaseKeyRequest();
    const keyLoadError = apiKeyTable.getByRole("alert");
    await keyLoadError.getByText("Temporary API key error").waitFor();
    assert.equal(await apiKeyTable.getByText("No API keys found. Create one to start using the API.").count(), 0);
    await keyLoadError.getByRole("button", { name: "Try again" }).click();
    await apiKeyTable.getByText("No API keys found. Create one to start using the API.").waitFor();
    await page.unroute(apiKeysRequest);
    await page.emulateMedia({ reducedMotion: "no-preference" });

    const waitlistsRequest = (url) => url.pathname === "/api/v1/waitlists";
    t.after(async () => { await page.unroute(waitlistsRequest); });
    await page.route(waitlistsRequest, async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }));
    await page.reload();
    await page.getByRole("heading", { name: "Developers", exact: true }).waitFor();
    await page.getByRole("button", { name: "Create API Key" }).click();
    const emptyWaitlistDialog = page.getByRole("dialog");
    await emptyWaitlistDialog.getByText("Create a waitlist before linking an API key.").waitFor();
    assert.equal(await emptyWaitlistDialog.getByRole("link", { name: "Create a waitlist" }).getAttribute("href"), "/wait-lists/new");
    assert.equal(await emptyWaitlistDialog.getByLabel("Waitlist").isDisabled(), true);
    await page.keyboard.press("Escape");
    await page.unroute(waitlistsRequest);

    await page.reload();
    await page.getByRole("heading", { name: "Developers", exact: true }).waitFor();
    await page.getByRole("button", { name: "Create API Key" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("API key name").fill("Launch signup form");
    await page.locator("#api-key-waitlist:not([disabled])").waitFor();
    await dialog.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: "First launch" }).click();
    await dialog.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "In 30 days" }).click();
    const createResponse = page.waitForResponse((response) => response.url().includes("/api/v1/api-keys/create-and-link") && response.request().method() === "POST");
    await dialog.getByRole("button", { name: "Create & Link API Key" }).click();
    const response = await createResponse;
    assert.equal(response.status(), 200);
    const created = (await response.json()).data.apiKey;
    assert.match(created.apiKey, /^wl2_[a-f0-9]{32}_[A-Za-z0-9_-]{43}$/);
    assert.equal(Object.hasOwn(created, "keyHash"), false);
    const stored = await db.apiKey.findUnique({ where: { id: created.id } });
    assert.equal(stored.waitlistId, waitlist.id);
    assert.deepEqual(stored.scopes, ["waitlist:write"]);
    const [, secret] = created.apiKey.match(/^wl2_[a-f0-9]{32}_([A-Za-z0-9_-]{43})$/);
    assert.equal(stored.keyHash, createHash("sha256").update(secret).digest("hex"));
    assert.ok(stored.expiresAt > new Date(Date.now() + 25 * 24 * 60 * 60 * 1000));
    const listed = await page.request.get(`${base}/api/v1/api-keys`);
    const listedKey = (await listed.json()).data.find((key) => key.id === created.id);
    assert.ok(listedKey);
    assert.equal(Object.hasOwn(listedKey, "keyHash"), false);
    assert.equal(listedKey.key, "••••••••••••••••");
    await dialog.getByRole("button", { name: "Done" }).click();
    assert.deepEqual((await new AxeBuilder({ page }).include(".product-settings-panel").analyze()).violations, []);
  });
  await t.test("waitlist referral sharing saves and stays inside its settings", async () => {
    await page.goto(`${base}/wait-lists/${waitlist.id}/settings`);
    const referralControl = page.getByRole("checkbox", { name: /Enable referral sharing/ });
    assert.equal(await referralControl.isChecked(), true);
    await referralControl.setChecked(false);
    await page.getByRole("status").filter({ hasText: "Referral sharing is off." }).waitFor();
    assert.equal((await db.waitList.findUnique({ where: { id: waitlist.id } })).showReferrals, false);
    await referralControl.setChecked(true);
    await page.getByRole("status").filter({ hasText: "Referral sharing is on." }).waitFor();
    assert.equal((await db.waitList.findUnique({ where: { id: waitlist.id } })).showReferrals, true);
    assert.deepEqual((await new AxeBuilder({ page }).include(".product-settings-panel").analyze()).violations, []);
  });
  await t.test("analytics endpoint is authorized and returns aggregate-only data", async () => {
    const response = await page.request.get(`${base}/api/wait-lists/${waitlist.id}/analytics?days=7&timeZone=America%2FLos_Angeles`);
    assert.equal(response.status(), 200);
    const analytics = await response.json();
    assert.equal(analytics.range.days, 7);
    assert.equal(analytics.range.timeZone, "America/Los_Angeles");
    assert.match(analytics.range.startDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(analytics.range.endDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(analytics.series.length, 7);
    assert.equal(analytics.summary.signups, 0);
    assert.equal(analytics.summary.visitors, 0);
    assert.equal(response.headers()["cache-control"], "private, no-store");
    assert.equal(Object.hasOwn(analytics, "signups"), false);
    assert.doesNotMatch(JSON.stringify(analytics), /[^\s"@]+@[^\s"@]+\.[^\s"@]+/);
    assert.equal(Object.hasOwn(analytics.summary, "email"), false);
    assert.equal(Object.hasOwn(analytics.series[0], "email"), false);
    const invalid = await page.request.get(`${base}/api/wait-lists/${waitlist.id}/analytics?days=8`);
    assert.equal(invalid.status(), 400);
    const inaccessible = await page.request.get(`${base}/api/wait-lists/not-a-waitlist/analytics?days=7`);
    assert.equal(inaccessible.status(), 404);
    const anonymousContext = await browser.newContext();
    try {
      const anonymousPage = await anonymousContext.newPage();
      const unauthenticated = await anonymousPage.request.get(`${base}/api/wait-lists/${waitlist.id}/analytics?days=7`);
      assert.equal(unauthenticated.status(), 401);
    } finally {
      await anonymousContext.close();
    }
  });
  await t.test("waitlist overview renders real analytics and an accessible table across themes and widths", async () => {
    await db.waitList.update({ where: { id: waitlist.id }, data: { status: "PUBLISHED" } });
    const joinedAt = new Date(Date.now() - 60_000);
    const firstVisitor = randomUUID();
    const secondVisitor = randomUUID();
    const firstImpression = await db.impression.create({ data: { waitListId: waitlist.id, uniqueUserId: firstVisitor, createdAt: new Date(joinedAt.getTime() - 1_000) } });
    const secondImpression = await db.impression.create({ data: { waitListId: waitlist.id, uniqueUserId: secondVisitor, createdAt: new Date(joinedAt.getTime() - 1_000) } });
    await db.signUp.createMany({ data: [
      { waitListId: waitlist.id, impressionId: firstImpression.id, uniqueUserId: firstVisitor, email: "verified-analytics@example.invalid", emailNormalized: "verified-analytics@example.invalid", createdAt: joinedAt, verifiedAt: joinedAt },
      { waitListId: waitlist.id, impressionId: secondImpression.id, uniqueUserId: secondVisitor, email: "pending-analytics@example.invalid", emailNormalized: "pending-analytics@example.invalid", createdAt: joinedAt },
    ] });
    let wasDark = false;
    try {
      await page.goto(`${base}/wait-lists/${waitlist.id}`);
      await page.getByRole("heading", { name: "Waitlist analytics" }).waitFor();
      await page.locator(".waitlist-analytics-metric").first().waitFor();
      const metrics = await page.locator(".waitlist-analytics-metric").allInnerTexts();
      assert.match(metrics[0], /Visitors\s+2\s+Distinct browsers/);
      assert.match(metrics[1], /Signups\s+2\s+1 verified/);
      assert.match(metrics[2], /Conversion\s+100%/);
      assert.match(metrics[3], /Verification\s+50%\s+1 awaiting verification/);
      const chartSeries = page.getByRole("group", { name: "Focus chart series" });
      const visitorsSeries = chartSeries.getByRole("button", { name: "Emphasize visitors" });
      const signupsSeries = chartSeries.getByRole("button", { name: "Emphasize signups" });
      assert.equal(await visitorsSeries.getAttribute("aria-pressed"), "false");
      await visitorsSeries.focus();
      await page.keyboard.press("Enter");
      assert.equal(await visitorsSeries.getAttribute("aria-pressed"), "true");
      await signupsSeries.click();
      assert.equal(await visitorsSeries.getAttribute("aria-pressed"), "false");
      assert.equal(await signupsSeries.getAttribute("aria-pressed"), "true");
      await signupsSeries.click();
      assert.equal(await signupsSeries.getAttribute("aria-pressed"), "false");
      assert.deepEqual((await new AxeBuilder({ page }).include(".waitlist-analytics").analyze()).violations, []);
      let releaseRangeRequest;
      const rangeRequestHeld = new Promise((resolve) => { releaseRangeRequest = resolve; });
      const sevenDayRequest = (url) => url.pathname === `/api/wait-lists/${waitlist.id}/analytics` && url.searchParams.get("days") === "7";
      await page.route(sevenDayRequest, async (route) => { await rangeRequestHeld; await route.continue(); });
      try {
        const rangeResponse = page.waitForResponse((response) => response.url().includes("/analytics?days=7") && response.status() === 200);
        await page.getByRole("button", { name: "7 days" }).click();
        await page.getByText("Loading analytics…", { exact: true }).waitFor();
        assert.equal(await page.locator(".waitlist-analytics-metrics").count(), 0, "old-range metrics should not appear under the selected range");
        assert.equal(await page.locator(".waitlist-analytics-panel").count(), 0, "old-range chart and dates should not appear under the selected range");
        assert.equal(await page.locator(".waitlist-analytics-loading").count(), 1);
        releaseRangeRequest();
        await rangeResponse;
      } finally {
        releaseRangeRequest();
        await page.unroute(sevenDayRequest);
      }
      const tableButton = page.getByRole("button", { name: "Table", exact: true });
      await tableButton.focus();
      await page.keyboard.press("Enter");
      assert.equal(await tableButton.getAttribute("aria-pressed"), "true");
      assert.equal(await page.getByRole("table", { name: /Daily visitors and signups/ }).count(), 1);
      assert.equal(await page.locator(".waitlist-analytics-table-wrap tbody tr").count(), 7);
      assert.deepEqual((await new AxeBuilder({ page }).include(".waitlist-analytics").analyze()).violations, []);
      wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      assert.deepEqual((await new AxeBuilder({ page }).include(".waitlist-analytics").analyze()).violations, []);
      await page.setViewportSize({ width: 320, height: 812 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: "/tmp/waitlyze-analytics-mobile.png", fullPage: true });
    } finally {
      await db.signUp.deleteMany({ where: { uniqueUserId: { in: [firstVisitor, secondVisitor] } } });
      await db.impression.deleteMany({ where: { uniqueUserId: { in: [firstVisitor, secondVisitor] } } });
      await db.waitList.update({ where: { id: waitlist.id }, data: { status: "DRAFT" } });
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), wasDark);
      await page.setViewportSize({ width: 1280, height: 900 });
    }
  });
  await t.test("analytics retry follows the component abortable request lifecycle", async () => {
    let requestCount = 0;
    const analyticsRequest = (url) => url.pathname === `/api/wait-lists/${waitlist.id}/analytics`;
    await db.waitList.update({ where: { id: waitlist.id }, data: { status: "PUBLISHED" } });
    await page.route(analyticsRequest, async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Analytics temporarily unavailable." }),
        });
        return;
      }
      await route.continue();
    });

    try {
      await page.goto(`${base}/wait-lists/${waitlist.id}`);
      const errorAlert = page.locator('.waitlist-analytics-message[role="alert"]');
      await errorAlert.getByText("Analytics temporarily unavailable.").waitFor();
      await page.getByRole("button", { name: "Try again" }).click();
      await errorAlert.waitFor({ state: "hidden" });
      await page.locator(".waitlist-analytics-metric").first().waitFor();
      assert.equal(requestCount, 2);
    } finally {
      await page.unroute(analyticsRequest);
      await db.waitList.update({ where: { id: waitlist.id }, data: { status: "DRAFT" } });
    }
  });
  await t.test("subscriber tabs resolve flagged referrals with an auditable note", async () => {
    const referrer = await db.signUp.create({ data: { uniqueUserId: randomUUID(), email: "referrer@example.invalid", emailNormalized: "referrer@example.invalid", waitListId: waitlist.id } });
    const invitee = await db.signUp.create({ data: { uniqueUserId: referrer.uniqueUserId, email: "invitee@example.invalid", emailNormalized: "invitee@example.invalid", waitListId: waitlist.id } });
    const referral = await db.referral.create({ data: { signUpId: invitee.id, referredById: referrer.id, reviewStatus: "NEEDS_REVIEW", reviewReason: "same_browser" } });
    await page.goto(`${base}/wait-lists/${waitlist.id}/subscribers`);
    await page.getByRole("button", { name: /Referral review/ }).click();
    await page.getByText("same browser identifier").waitFor();
    await page.getByLabel("Decision note").fill("Confirmed this was a separate invitee.");
    await page.getByRole("button", { name: "Approve credit" }).click();
    await page.getByText("Approved", { exact: true }).waitFor();
    const resolved = await db.referral.findUnique({ where: { id: referral.id } });
    assert.equal(resolved.reviewStatus, "APPROVED");
    assert.equal(resolved.reviewedById, userId);
    assert.equal(resolved.resolution, "Confirmed this was a separate invitee.");
    assert.deepEqual((await new AxeBuilder({ page }).include("[aria-labelledby=referral-review-title]").analyze()).violations, []);
    await db.referral.delete({ where: { id: referral.id } });
    await db.signUp.deleteMany({ where: { id: { in: [referrer.id, invitee.id] } } });
  });
  await t.test("contextual tabs use the selected waitlist and fit a narrow viewport", async () => {
    console.error("[shell-browser] contextual: waitlist tabs start");
    await page.goto(`${base}/wait-lists/${waitlist.id}`);
    assert.equal(await page.getByRole("heading", { name: "First launch" }).count(), 1);
    assert.deepEqual(await page.getByRole("navigation", { name: "Waitlist sections" }).getByRole("link").allTextContents(), ["Overview", "Page", "Subscribers", "Emails", "Waitlist settings"]);
    for (const nestedRoute of ["broadcasts", "automations"]) {
      console.error(`[shell-browser] contextual: nested route ${nestedRoute}`);
      await page.goto(`${base}/wait-lists/${waitlist.id}/emails/${nestedRoute}`);
      assert.equal(await page.getByRole("navigation", { name: "Waitlist sections" }).getByRole("link", { name: "Emails" }).getAttribute("aria-current"), "page");
    }
    await page.goto(`${base}/wait-lists/${waitlist.id}`);
    for (const width of [320, 375]) {
      console.error(`[shell-browser] contextual: settings and search at ${width}px`);
      await page.setViewportSize({ width, height: 812 });
      await page.goto(`${base}/settings`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const settingsSections = page.locator(".product-settings-mobile");
      await settingsSections.locator("summary").click();
      const settingsLinks = settingsSections.getByRole("navigation", { name: "Settings sections" }).getByRole("link");
      assert.deepEqual(await settingsLinks.allTextContents(), ["Profile", "Workspace", "Team access", "Integrations", "Developer tools", "Privacy & data"]);
      const sectionLinkBounds = await settingsLinks.evaluateAll((links) => ({ viewportWidth: innerWidth, links: links.map((link) => {
        const rect = link.getBoundingClientRect();
        return { left: rect.left, right: rect.right, height: rect.height };
      }) }));
      assert.ok(sectionLinkBounds.links.every(({ left, right, height }) => left >= 0 && right <= sectionLinkBounds.viewportWidth && height >= 44));
      await settingsLinks.filter({ hasText: "Integrations" }).click();
      assert.equal(new URL(page.url()).hash, "#integrations");
      assert.equal(await settingsSections.evaluate((details) => details.open), false);
      await page.waitForFunction(() => document.querySelector('.product-settings-mobile a[href="#integrations"]')?.getAttribute("aria-current") === "location");
      await page.getByRole("link", { name: "Skip to content", exact: true }).focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.evaluate(() => document.activeElement.id), "product-content");
      const waitlistsLink = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Waitlists", exact: true });
      await waitlistsLink.focus(); await page.keyboard.press("Enter");
      await page.waitForURL(`${base}/wait-lists`);
      await page.getByRole("heading", { name: "Waitlists", exact: true }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("body *")].filter((el) => el.getBoundingClientRect().right > innerWidth).slice(0, 8).map((el) => ({ tag: el.tagName, cls: el.className, width: el.getBoundingClientRect().width })))));
      const search = page.getByRole("search");
      await search.getByLabel("Search waitlists").fill("First launch");
      await search.getByRole("button", { name: "Search" }).click();
      await page.waitForURL(`${base}/wait-lists?q=First+launch`);
      assert.equal(await page.getByRole("row", { name: /First launch/ }).count(), 1);
      assert.equal(await page.getByRole("row", { name: /external/ }).count(), 0);
      await page.getByRole("search").getByLabel("Search waitlists").fill("no matching launch");
      await page.getByRole("search").getByRole("button", { name: "Search" }).click();
      await page.getByRole("heading", { name: "No waitlists found" }).waitFor();
      await page.getByRole("link", { name: "Clear search" }).click();
      await page.waitForURL(`${base}/wait-lists`);
      assert.equal(await page.getByRole("row", { name: /First launch/ }).count(), 1);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/settings`);
    await page.locator('.product-settings-desktop a[href="#integrations"]').click();
    await page.waitForURL(`${base}/settings#integrations`);
    await page.waitForFunction(() => document.querySelector('.product-settings-desktop a[aria-current="location"]')?.getAttribute("href") === "#integrations");
    await page.goBack();
    await page.waitForURL(`${base}/settings`);
    await page.waitForFunction(() => document.querySelector('.product-settings-desktop a[aria-current="location"]')?.getAttribute("href") === "#profile");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(() => document.querySelector('.product-settings-desktop a[aria-current="location"]')?.getAttribute("href") === "#privacy");
    console.error("[shell-browser] contextual: status filter fixture setup");
    console.error("[shell-browser] status fixture: creating secondary workspace");
    const secondWorkspace = await db.workspace.create({ data: { name: "Another owned workspace", members: { create: { userId, role: "ADMIN" } } } });
    console.error("[shell-browser] status fixture: creating published waitlists");
    await db.waitList.create({ data: { userId, workspaceId: personal.id, name: "Published launch", status: "PUBLISHED" } });
    await db.waitList.create({ data: { userId, workspaceId: secondWorkspace.id, name: "Other workspace launch", status: "PUBLISHED" } });
    console.error("[shell-browser] status fixture: creating paused waitlist");
    await db.waitList.create({ data: { userId, workspaceId: personal.id, name: "Paused launch", status: "PAUSED" } });
    console.error("[shell-browser] status fixture: finding external waitlist");
    const external = await db.waitList.findFirst({ where: { userId: otherUserId, name: "First launch external" } });
    assert.ok(external, "the external waitlist fixture must exist");
    console.error("[shell-browser] status fixture: publishing external waitlist");
    await db.waitList.update({ where: { id: external.id }, data: { status: "PUBLISHED" } });
    console.error("[shell-browser] status fixture ready");
    console.error("[shell-browser] status: opening published list");
    await context.addCookies([{ name: "waitlyze-workspace", value: personal.id, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
    await page.setViewportSize({ width: 320, height: 812 });
    console.error("[shell-browser] status: navigating to published list");
    await page.goto(`${base}/wait-lists?status=PUBLISHED`);
    console.error("[shell-browser] status: published list rendered");
    const statusNavigation = page.getByRole("navigation", { name: "Filter waitlists by status" });
    assert.equal(await statusNavigation.getByRole("link", { name: "Published" }).getAttribute("aria-current"), "page");
    assert.equal(await page.getByRole("row", { name: /Published launch/ }).count(), 1);
    assert.equal(await page.getByRole("row", { name: /Other workspace launch/ }).count(), 0);
    assert.equal(await page.getByRole("row", { name: /First launch external/ }).count(), 0);
    const filterBounds = await statusNavigation.getByRole("link").evaluateAll((links) => ({ viewportWidth: innerWidth, links: links.map((link) => {
      const rect = link.getBoundingClientRect();
      return { left: rect.left, right: rect.right, height: rect.height };
    }) }));
    assert.ok(filterBounds.links.every(({ left, right, height }) => left >= 0 && right <= filterBounds.viewportWidth && height >= 44));
    console.error("[shell-browser] status: scope and mobile target checks passed");
    await page.getByRole("search").getByLabel("Search waitlists").fill("launch");
    await page.getByRole("search").getByRole("button", { name: "Search" }).click();
    console.error("[shell-browser] status: waiting for combined search and status URL");
    await page.waitForURL(`${base}/wait-lists?q=launch&status=PUBLISHED`);
    console.error("[shell-browser] status: combined search and status passed");
    await page.getByRole("link", { name: "Paused", exact: true }).click();
    await page.waitForURL(`${base}/wait-lists?q=launch&status=PAUSED`);
    await page.getByRole("search").getByRole("link", { name: "Clear search" }).click();
    await page.waitForURL(`${base}/wait-lists?status=PAUSED`);
    assert.equal(await page.getByRole("row", { name: /Paused launch/ }).count(), 1);
    console.error("[shell-browser] status: paused filter and clear-search checks passed");
    await page.getByRole("search").getByLabel("Search waitlists").fill("Paused");
    await page.getByRole("search").getByRole("button", { name: "Search" }).click();
    await page.waitForURL(`${base}/wait-lists?q=Paused&status=PAUSED`);
    assert.equal(await page.getByRole("row", { name: /Paused launch/ }).count(), 1);
    await page.getByRole("link", { name: "Clear search" }).click();
    await page.waitForURL(`${base}/wait-lists?status=PAUSED`);
    assert.equal(await page.getByRole("row", { name: /Paused launch/ }).count(), 1);
    assert.deepEqual((await new AxeBuilder({ page }).include(".product-shell").analyze()).violations, []);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.error("[shell-browser] status: all filters and accessibility checks passed");
    await page.goto(`${base}/wait-lists?status=ADMIN`);
    assert.equal(await page.getByRole("navigation", { name: "Filter waitlists by status" }).getByRole("link", { name: "All" }).getAttribute("aria-current"), "page");
    assert.equal(await page.getByRole("row", { name: /First launch external/ }).count(), 0);
    await page.setViewportSize({ width: 1280, height: 900 });
    console.error("[shell-browser] sorting: creating fixtures");
    {
      const secondWorkspace = await db.workspace.create({ data: { name: "Sorting isolation workspace", members: { create: { userId, role: "ADMIN" } } } });
      const [alpha, beta, zulu, zero, hidden] = await Promise.all([
        db.waitList.create({ data: { userId, workspaceId: personal.id, name: "Sort fixture Alpha", status: "PUBLISHED" } }),
        db.waitList.create({ data: { userId, workspaceId: personal.id, name: "Sort fixture Beta", status: "PUBLISHED" } }),
        db.waitList.create({ data: { userId, workspaceId: personal.id, name: "Sort fixture Zulu", status: "PUBLISHED" } }),
        db.waitList.create({ data: { userId, workspaceId: personal.id, name: "Sort fixture Zero", status: "PUBLISHED" } }),
        db.waitList.create({ data: { userId, workspaceId: secondWorkspace.id, name: "Sort fixture Hidden", status: "PUBLISHED" } }),
      ]);
      const signupTargets = [beta, beta, beta, alpha, alpha, zulu, zulu, hidden, hidden, hidden, hidden, hidden];
      for (const [index, target] of signupTargets.entries()) {
        await db.signUp.create({ data: { waitListId: target.id, uniqueUserId: randomUUID(), email: `sort-fixture-${index}@example.invalid` } });
      }

      await context.addCookies([{ name: "waitlyze-workspace", value: personal.id, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
      await page.setViewportSize({ width: 320, height: 812 });
      await page.goto(`${base}/wait-lists?q=Sort+fixture&status=PUBLISHED`);
      const headers = page.locator(".product-waitlist-table thead th");
      assert.equal(await headers.nth(0).getAttribute("aria-sort"), "ascending");
      assert.equal(await headers.nth(1).getAttribute("aria-sort"), null);
      assert.deepEqual(await page.locator(".product-waitlist-table tbody th[scope='row'] > a").allTextContents(), ["Sort fixture Alpha Published", "Sort fixture Beta Published", "Sort fixture Zero Published", "Sort fixture Zulu Published"]);
      assert.equal(await page.getByRole("row", { name: /Sort fixture Hidden/ }).count(), 0);

      const subscriberSort = page.getByRole("link", { name: /Sort by subscriber count/ });
      await subscriberSort.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(`${base}/wait-lists?q=Sort+fixture&status=PUBLISHED&sort=subscribers-desc`);
      assert.equal(await headers.nth(1).getAttribute("aria-sort"), "descending");
      assert.deepEqual(await page.locator(".product-waitlist-table tbody th[scope='row'] > a").allTextContents(), ["Sort fixture Beta Published", "Sort fixture Alpha Published", "Sort fixture Zulu Published", "Sort fixture Zero Published"]);
      assert.equal(await page.getByRole("row", { name: /Sort fixture Hidden/ }).count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual((await new AxeBuilder({ page }).include(".product-shell").analyze()).violations, []);

      await page.getByRole("link", { name: /Sort by waitlist name/ }).click();
      await page.waitForURL(`${base}/wait-lists?q=Sort+fixture&status=PUBLISHED`);
      assert.equal(await headers.nth(0).getAttribute("aria-sort"), "ascending");
      await page.getByRole("link", { name: /Sort by waitlist name/ }).click();
      await page.waitForURL(`${base}/wait-lists?q=Sort+fixture&status=PUBLISHED&sort=name-desc`);
      assert.equal(await headers.nth(0).getAttribute("aria-sort"), "descending");
      await page.goBack();
      await page.waitForURL(`${base}/wait-lists?q=Sort+fixture&status=PUBLISHED`);
      await page.reload();
      assert.equal(await headers.nth(0).getAttribute("aria-sort"), "ascending");
      await page.setViewportSize({ width: 1280, height: 900 });
    }
    console.error("[shell-browser] sorting: all checks passed");
    await page.goto(`${base}/settings`);
    await page.screenshot({ path: "/tmp/waitlyze-shell-settings-mobile.png", fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/wait-lists`);
    await page.screenshot({ path: "/tmp/waitlyze-shell-waitlists.png", fullPage: true });
  });
  await t.test("launch rehearsal is visible but cannot create real signup or delivery activity", async () => {
    await db.waitList.update({ where: { id: waitlist.id }, data: { templateSnapshot: snapshotTemplate("saas") } });
    const before = { signups: await db.signUp.count({ where: { waitListId: waitlist.id } }), outbox: await db.outboxEvent.count() };
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/wait-lists/${waitlist.id}`);
    await page.locator("details.launch-rehearsal > summary").click();
    await page.getByRole("button", { name: "Run check" }).click();
    await page.getByText("Page checks passed").waitFor();
    assert.equal(await db.launchRehearsal.count({ where: { waitListId: waitlist.id } }), 1);
    assert.deepEqual({ signups: await db.signUp.count({ where: { waitListId: waitlist.id } }), outbox: await db.outboxEvent.count() }, before);
    assert.deepEqual((await new AxeBuilder({ page }).include(".launch-rehearsal").analyze()).violations, []);
  });
  await t.test("subscribers filters, profiles, exports, and keyboard flow work across widths", async () => {
    const joinedAt = new Date("2026-09-28T08:00:00.000Z");
    await db.signUp.createMany({ data: [
      { waitListId: waitlist.id, uniqueUserId: randomUUID(), email: "verified-subscriber@example.invalid", createdAt: joinedAt, verifiedAt: joinedAt, city: "Pune", country: "IN", device: "Desktop", ipAddress: "192.0.2.8" },
      { waitListId: waitlist.id, uniqueUserId: randomUUID(), email: "pending-subscriber@example.invalid", createdAt: new Date(joinedAt.getTime() + 1000), city: "Mumbai", country: "IN", device: "Mobile", ipAddress: "192.0.2.9" },
    ] });
    await page.goto(`${base}/wait-lists/${waitlist.id}/subscribers`);
    await page.getByRole("heading", { name: "Subscribers", exact: true }).waitFor();
    const exportButton = page.getByRole("button", { name: "Export CSV", exact: true });
    await exportButton.waitFor();
    await page.getByRole("button", { name: /Referral review/ }).click();
    await exportButton.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Subscribers", exact: true }).click();
    await exportButton.waitFor();
    await page.getByText(/of 2$/).waitFor();
    await page.getByRole("button", { name: "Verified", exact: true }).click();
    await page.getByText(/of 1$/).waitFor();
    await page.getByRole("button", { name: "verified-subscriber@example.invalid" }).waitFor();
    assert.equal(await page.locator("tbody tr").count(), 1);
    await page.getByRole("button", { name: "Needs confirmation", exact: true }).click();
    await page.getByText(/of 1$/).waitFor();
    await page.getByRole("button", { name: "pending-subscriber@example.invalid" }).waitFor();
    assert.equal(await page.locator("tbody tr").count(), 1);
    await page.getByRole("button", { name: "All subscribers", exact: true }).click();
    await page.getByLabel("Search subscribers by email").fill("verified-subscriber");
    await page.getByText(/of 1$/).waitFor();
    await page.getByRole("button", { name: "verified-subscriber@example.invalid" }).waitFor();
    assert.equal(await page.locator("tbody tr").count(), 1);
    const profileTrigger = page.getByRole("button", { name: "verified-subscriber@example.invalid" });
    await profileTrigger.focus();
    await page.keyboard.press("Enter");
    const profile = page.getByRole("dialog", { name: "Subscriber profile" });
    await profile.waitFor();
    await profile.getByText("Pune, IN", { exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await profile.waitFor({ state: "hidden" });
    assert.equal(await profileTrigger.evaluate((element) => element === document.activeElement), true);
    await page.getByLabel("Search subscribers by email").fill("");
    await page.getByText(/of 2$/).waitFor();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "First launch-subscribers.csv");
    const csv = await readFile(await download.path(), "utf8");
    assert.match(csv, /verified-subscriber@example\.invalid/);
    assert.match(csv, /pending-subscriber@example\.invalid/);
    assert.doesNotMatch(csv, /ipAddress|uniqueUserId/);
    await page.setViewportSize({ width: 320, height: 812 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual((await new AxeBuilder({ page }).include(".product-shell").analyze()).violations, []);
    await page.screenshot({ path: "/tmp/waitlyze-subscribers-mobile.png", fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: "/tmp/waitlyze-subscribers-desktop.png", fullPage: true });
  });
  await t.test("workspace selection persists and rejects inaccessible context", async () => {
    const other = await db.workspace.create({ data: { name: "Second workspace", members: { create: { userId, role: "ADMIN" } } } });
    const second = await db.waitList.create({ data: { userId, workspaceId: other.id, name: "Second launch" } });
    await page.goto(`${base}/wait-lists`);
    await page.getByLabel("Workspace", { exact: true }).selectOption(other.id);
    await page.getByRole("button", { name: "Switch", exact: true }).click();
    await page.getByRole("row", { name: /Second launch/ }).waitFor();
    assert.equal(await page.getByRole("row", { name: /First launch/ }).count(), 0);
    await page.reload();
    assert.equal(await page.getByLabel("Workspace", { exact: true }).inputValue(), other.id);
    await page.goto(`${base}/wait-lists/${second.id}/emails`);
    await page.getByLabel("Email Subject").fill("Allowed subject");
    await page.getByRole("button", { name: "Save Template", exact: true }).click();
    await page.getByText("Template saved", { exact: true }).waitFor();
    assert.equal((await db.emailTemplate.findUnique({ where: { waitListId_type: { waitListId: second.id, type: "SIGNUP" } } })).subject, "Allowed subject");
    await db.workspaceMember.update({ where: { workspaceId_userId: { workspaceId: other.id, userId } }, data: { role: "MEMBER" } });
    await page.getByLabel("Email Subject").fill("Denied subject");
    await page.getByRole("button", { name: "Save Template", exact: true }).click();
    await page.getByText("Failed to save template", { exact: true }).waitFor();
    assert.equal((await db.emailTemplate.findUnique({ where: { waitListId_type: { waitListId: second.id, type: "SIGNUP" } } })).subject, "Allowed subject");
    await page.goto(`${base}/wait-lists/${second.id}/emails`);
    await page.getByText("This page could not be found.", { exact: true }).waitFor();
    assert.equal(await page.getByRole("heading", { name: "Email Templates" }).count(), 0);
    assert.equal(await page.getByLabel("Email Subject").count(), 0);
    await page.goto(`${base}/wait-lists/${second.id}/edit?buttonText=Member%20CTA`);
    await page.getByRole("button", { name: "Save page", exact: true }).click();
    await page.getByText("Wait list saved successfully", { exact: true }).waitFor();
    assert.equal((await db.waitList.findUnique({ where: { id: second.id } })).buttonText, "Member CTA");
    await page.goto(`${base}/wait-lists/${second.id}/edit?sendEmailsToSubscribers=true`);
    await page.getByRole("button", { name: "Save page", exact: true }).click();
    await page.getByText("Failed to save wait list", { exact: true }).waitFor();
    assert.equal((await db.waitList.findUnique({ where: { id: second.id } })).sendEmailsToSubscribers, false);
    const inaccessible = await page.goto(`${base}/wait-lists/${waitlist.id}`);
    assert.equal(inaccessible.status(), 404);
    await context.addCookies([{ name: "waitlyze-workspace", value: "forged-workspace", domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
    await page.goto(`${base}/wait-lists`);
    assert.equal(await page.getByRole("row", { name: /First launch/ }).count(), 1);
    assert.equal(await page.getByRole("row", { name: /Second launch/ }).count(), 0);
  });
  await t.test("creation keeps the chosen page visible through private-draft review", async () => {
    await context.addCookies([{ name: "waitlyze-workspace", value: personal.id, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
    await page.goto(`${base}/wait-lists/new`);
    await page.getByRole("radio", { name: /Mobile app/ }).check();
    const preview = page.getByRole("complementary", { name: "Mobile app page preview", exact: true });
    await preview.getByText("Nothing is public until you publish.", { exact: true }).waitFor();
    await page.setViewportSize({ width: 320, height: 812 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const continueButton = page.getByRole("button", { name: "Continue with Mobile app" });
    assert.equal(await continueButton.evaluate((element) => getComputedStyle(element.parentElement).position), "sticky");
    const actionBounds = await continueButton.boundingBox();
    assert.ok(actionBounds && actionBounds.y >= 0 && actionBounds.y + actionBounds.height <= 812, "the primary wizard action remains in the mobile viewport");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const [previewBounds, scrolledActionBounds] = await Promise.all([
      preview.boundingBox(),
      continueButton.boundingBox(),
    ]);
    assert.ok(previewBounds && scrolledActionBounds && previewBounds.y + previewBounds.height <= scrolledActionBounds.y, "the sticky action does not cover the end of the template preview");
    assert.ok(scrolledActionBounds && scrolledActionBounds.y >= 0 && scrolledActionBounds.y + scrolledActionBounds.height <= 812, "the primary wizard action remains reachable at the end of the preview");
    assert.deepEqual((await new AxeBuilder({ page }).include(".product-shell").analyze()).violations, []);
    await continueButton.focus();
    await page.keyboard.press("Enter");
    const detailsHeading = page.getByRole("heading", { name: "Name your waitlist", exact: true });
    await page.waitForFunction(() => document.activeElement?.id === "step-title");
    assert.equal(await detailsHeading.evaluate((element) => document.activeElement === element), true);
    assert.equal(await detailsHeading.evaluate((element) => getComputedStyle(element).outlineWidth), "2px");
    assert.equal(await page.locator("[aria-current='step'] span").nth(1).innerText(), "Name your waitlist");

    const slug = `fixture-${randomUUID()}`;
    await page.getByLabel("What are you launching?", { exact: true }).fill("Created fixture");
    await page.getByLabel("Your page address", { exact: true }).fill(slug);
    await preview.getByText("Created fixture", { exact: true }).waitFor();
    await preview.getByText(`/w/${slug}`, { exact: true }).waitFor();
    assert.equal(await preview.isVisible(), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.reload();
    await detailsHeading.waitFor({ state: "visible" });
    assert.equal(await page.getByLabel("What are you launching?", { exact: true }).inputValue(), "Created fixture");
    await preview.getByText(`/w/${slug}`, { exact: true }).waitFor();
    assert.equal(await page.locator("[aria-current='step'] span").nth(1).innerText(), "Name your waitlist");
    await page.getByRole("button", { name: "Review draft" }).click();
    await page.getByRole("heading", { name: "Review & create", exact: true }).waitFor();
    await preview.getByText("Created fixture", { exact: true }).waitFor();
    await preview.getByText(`/w/${slug}`, { exact: true }).waitFor();
    await preview.getByText("Private preview", { exact: true }).waitFor();
    for (const width of [320, 375, 768, 800, 850, 900, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await preview.isVisible());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const geometry = await preview.evaluate((element) => {
        const previewBox = element.getBoundingClientRect();
        const contentBox = element.parentElement.firstElementChild.getBoundingClientRect();
        const separated = contentBox.right <= previewBox.left || previewBox.right <= contentBox.left || contentBox.bottom <= previewBox.top || previewBox.bottom <= contentBox.top;
        return { separated, previewWidth: previewBox.width, previewLeft: previewBox.left, previewRight: previewBox.right };
      });
      assert.ok(geometry.separated, `review and preview overlap at ${width}px`);
      assert.ok(geometry.previewWidth >= Math.min(300, width - 64), `preview is too narrow at ${width}px: ${geometry.previewWidth}px`);
      assert.ok(geometry.previewLeft >= 0 && geometry.previewRight <= width, `preview escapes viewport at ${width}px`);
    }
    await page.setViewportSize({ width: 320, height: 812 });
    await page.getByRole("button", { name: "Create private draft", exact: true }).click();
    await page.waitForURL(/\/wait-lists\/[^/]+\/edit$/);
    await page.getByRole("heading", { name: "Page", exact: true }).waitFor();
    await page.setViewportSize({ width: 1280, height: 900 });
    const editorPreview = page.getByRole("region", { name: "Waitlist page preview" });
    assert.deepEqual(await editorPreview.locator("[data-page-section]").evaluateAll((sections) => sections.map((section) => section.dataset.pageSection)), ["hero", "form", "faq"]);
    assert.equal(await editorPreview.locator("h1").count(), 1, "the editor uses the published page heading structure");
    assert.equal(await editorPreview.locator("form, input, button").count(), 0, "the preview must not offer a signup or POST path");
    const previewWidth = page.getByRole("group", { name: "Preview width" });
    const previewCanvas = page.locator(".product-builder-preview-frame .product-page-preview");
    assert.equal(await previewWidth.getByRole("button", { name: "Desktop" }).getAttribute("aria-pressed"), "true");
    await previewWidth.getByRole("button", { name: "Mobile" }).click();
    assert.equal(await previewWidth.getByRole("button", { name: "Mobile" }).getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator(".product-builder-preview-frame").getAttribute("data-viewport"), "mobile");
    assert.ok(Math.abs((await previewCanvas.boundingBox()).width - 375) <= 1, "mobile preview should use a familiar phone width on desktop");
    await page.setViewportSize({ width: 320, height: 812 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "mobile preview must fit a narrow viewport");
    assert.ok((await previewCanvas.boundingBox()).width <= 320, "mobile preview must shrink to the available width");
    await previewWidth.getByRole("button", { name: "Desktop" }).click();
    assert.equal(await page.locator(".product-builder-preview-frame").getAttribute("data-viewport"), "desktop");
    await page.setViewportSize({ width: 1280, height: 900 });
    assert.equal(await page.getByLabel("Headline", { exact: true }).inputValue(), "Something new for your everyday.");

    initialDraft = await db.waitList.findFirst({ where: { userId, name: "Created fixture" } });
    assert.ok(initialDraft);
    assert.equal(initialDraft.workspaceId, personal.id);
    assert.equal(initialDraft.status, "DRAFT");
    assert.equal(initialDraft.templateRevision, 1);
    assert.equal(initialDraft.templateSnapshot.templateId, "mobile");
    await page.goto(`${base}/wait-lists/${initialDraft.id}`);
    const readiness = page.getByRole("region", { name: "Page checks" });
    await readiness.waitFor({ state: "visible" });
    await readiness.getByText("Your saved page matches the template requirements.").waitFor({ state: "visible" });
    await readiness.getByText("One valid email signup form is configured.").waitFor({ state: "visible" });
    await readiness.getByText("Drafts stay private until you publish them.").waitFor({ state: "visible" });
    const review = readiness.getByRole("link", { name: "Open publish controls: Publish your waitlist", exact: true });
    assert.equal(await review.getAttribute("href"), `/wait-lists/${initialDraft.id}/edit#publication-actions`);
    assert.equal(await page.getByRole("link", { name: "Review publication controls", exact: true }).count(), 1);
    assert.equal(await page.getByRole("link", { name: "View subscribers", exact: true }).count(), 0);
    await page.setViewportSize({ width: 320, height: 812 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual((await new AxeBuilder({ page }).include(".launch-readiness").analyze()).violations, []);
    await page.setViewportSize({ width: 1280, height: 900 });
    assert.equal((await fetch(`${base}/forms/${initialDraft.id}`)).status, 404);
    assert.equal((await db.signUp.count({ where: { waitListId: initialDraft.id } })), 0);
  });
  await t.test("published, changed, paused, and demoted states stay truthful", async () => {
    const publicationWorkspace = await db.workspace.create({ data: {
      name: "Publication review fixture",
      members: { create: { userId, role: "ADMIN" } },
    } });
    await db.waitList.update({ where: { id: initialDraft.id }, data: { workspaceId: publicationWorkspace.id } });
    await context.addCookies([{ name: "waitlyze-workspace", value: publicationWorkspace.id, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
    try {
      await db.waitListPublicationRevision.create({ data: {
        waitListId: initialDraft.id,
        revision: 1,
        templateRevision: 1,
        snapshot: initialDraft.templateSnapshot,
      } });
      await db.waitList.update({ where: { id: initialDraft.id }, data: {
        status: "PUBLISHED",
        publishedRevision: 1,
        publishedTemplateRevision: 1,
      } });
      const publishedSlug = initialDraft.publicSlug;
      await page.goto(`${base}/w/${publishedSlug}`);
      await page.getByRole("heading", { level: 1, name: "Something new for your everyday." }).waitFor();
      const publishedSectionContract = await page.locator("[data-page-section]").evaluateAll((sections) => sections.map((section) => ({ type: section.dataset.pageSection, className: section.className })));
      await page.goto(`${base}/wait-lists/${initialDraft.id}/edit`);
      const editorSectionContract = await page.locator(".product-page-preview [data-page-section]").evaluateAll((sections) => sections.map((section) => ({ type: section.dataset.pageSection, className: section.className })));
      assert.deepEqual(editorSectionContract, publishedSectionContract, "the editor and published route share the same page section renderer and styles");
      assert.equal(await page.locator(".product-page-preview form, .product-page-preview input, .product-page-preview button").count(), 0, "the editor preview remains inert after publication");
      await page.goto(`${base}/wait-lists/${initialDraft.id}`);
      await page.reload();
      await page.getByRole("heading", { name: "Your waitlist is live", exact: true }).waitFor();
      assert.equal(await page.getByRole("link", { name: "View live page", exact: true }).count(), 1);
      await page.getByRole("region", { name: "Page checks" }).getByText("Your latest page version is live.").waitFor();

      await db.waitList.update({ where: { id: initialDraft.id }, data: { templateRevision: 2 } });
      await page.reload();
      const staleChecks = page.getByRole("region", { name: "Page checks" });
      await staleChecks.getByText("Saved page changes are not live yet.").waitFor();
      await db.waitList.update({ where: { id: initialDraft.id }, data: { status: "PAUSED" } });
      await page.reload();
      await page.getByRole("heading", { name: "Signups are paused", exact: true }).waitFor();
      await page.getByRole("link", { name: "Review publication controls", exact: true }).click();
      await page.waitForURL(new RegExp(`/wait-lists/${initialDraft.id}/edit#publication-actions$`));
      await page.getByRole("button", { name: "Publish and resume", exact: true }).waitFor();

      await db.workspaceMember.update({ where: { workspaceId_userId: { workspaceId: publicationWorkspace.id, userId } }, data: { role: "MEMBER" } });
      await page.goto(`${base}/wait-lists/${initialDraft.id}`);
      await page.getByRole("region", { name: "Page checks" }).getByText("A workspace owner or admin needs to resume signups.").waitFor();
      assert.equal(await page.getByRole("link", { name: "Review publication controls", exact: true }).count(), 0);
      assert.equal(await page.getByRole("link", { name: "Edit page", exact: true }).count(), 1);
      await page.getByRole("link", { name: "Edit page", exact: true }).click();
      await page.waitForURL(new RegExp(`/wait-lists/${initialDraft.id}/edit#page-content$`));
      assert.equal(await page.getByRole("button", { name: "Publish and resume", exact: true }).count(), 0);
    } finally {
      await db.workspaceMember.update({ where: { workspaceId_userId: { workspaceId: publicationWorkspace.id, userId } }, data: { role: "ADMIN" } });
      await db.waitListPublicationRevision.deleteMany({ where: { waitListId: initialDraft.id } });
      await db.waitList.update({ where: { id: initialDraft.id }, data: {
        status: "DRAFT",
        templateRevision: 1,
        publishedRevision: null,
        publishedTemplateRevision: null,
      } });
      await page.goto(`${base}/wait-lists/${initialDraft.id}`);
    }
  });
  await t.test("publishing requires a final review of the exact public page", async () => {
    const publicSlug = `review-${randomUUID()}`;
    const draft = await createDraft(db, userId, personal.id, {
      name: "Review before launch",
      publicSlug,
      templateId: "saas",
      creationKey: randomUUID(),
    });
    await context.addCookies([{ name: "waitlyze-workspace", value: personal.id, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
    await page.goto(`${base}/wait-lists/${draft.id}/edit`);
    await page.getByRole("button", { name: "Publish waitlist", exact: true }).click();

    const review = page.getByRole("dialog", { name: "Review your public page" });
    await review.waitFor({ state: "visible" });
    await review.getByText("Some starter copy is unchanged", { exact: true }).waitFor();
    await review.locator(".product-publish-starter-copy").getByText("Introduce your product and the problem it solves.", { exact: true }).waitFor();
    const publicPreview = review.getByRole("region", { name: "Public page preview" });
    await publicPreview.getByText("Introduce your product and the problem it solves.", { exact: true }).waitFor();
    assert.equal(await review.getByRole("button", { name: "Publish page", exact: true }).isEnabled(), false);
    assert.equal((await fetch(`${base}/w/${publicSlug}`)).status, 404, "an unreviewed draft must stay private");
    await page.setViewportSize({ width: 320, height: 812 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "the publish review fits a 320px viewport");
    const reviewPanel = page.locator(".product-dialog-panel");
    const reviewBounds = await reviewPanel.boundingBox();
    assert.ok(reviewBounds && reviewBounds.x >= 0 && reviewBounds.x + reviewBounds.width <= 320, "the dialog stays inside the phone viewport");
    assert.deepEqual((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations, []);

    await review.getByLabel("I reviewed this page as visitors will see it.").check();
    await review.getByRole("button", { name: "Publish page", exact: true }).click();
    await page.getByText("Published · version 1", { exact: true }).waitFor();
    await page.goto(`${base}/w/${publicSlug}`);
    await page.getByRole("heading", { level: 1, name: "Your next great workflow starts here." }).waitFor();
    await page.getByText("Introduce your product and the problem it solves.", { exact: true }).waitFor();
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  await t.test("deletion needs typed confirmation and returns to the list", async () => {
    await context.addCookies([{ name: "waitlyze-workspace", value: personal.id, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
    await page.goto(`${base}/wait-lists/${waitlist.id}/settings`);
    await page.getByRole("button", { name: "Delete waitlist", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Permanently delete" }).isEnabled(), false);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.ok(await db.waitList.findUnique({ where: { id: waitlist.id } }));
    await page.getByRole("button", { name: "Delete waitlist", exact: true }).click();
    await page.getByLabel('Type “First launch” to confirm').fill("First launch");
    await page.getByRole("button", { name: "Permanently delete" }).click();
    await page.waitForURL(`${base}/wait-lists`);
    assert.equal(await db.waitList.findUnique({ where: { id: waitlist.id } }), null);
  });
  assert.deepEqual(errors, []);
});
