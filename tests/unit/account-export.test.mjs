import test from "node:test";
import assert from "node:assert/strict";
import { buildAccountExport } from "../../src/lib/account-export.mjs";

test("account export includes only allowlisted account, campaign, workspace, and developer fields", () => {
  const exported = buildAccountExport({
    user: { id: "private-user-id", email: "person@example.invalid", name: "Person", emailVerified: true, passwordHash: "private-password" },
    memberships: [{ role: "OWNER", createdAt: new Date("2026-01-01"), workspace: { id: "private-workspace-id", name: "Launch", createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-02") } }],
    campaigns: [{
      id: "private-campaign-id", name: "Launch waitlist", status: "DRAFT", publicSlug: "launch", workspace: { name: "Launch" }, customDomain: null,
      webhookSubscriptions: [{ id: "private-webhook-id", name: "Signup events", eventTypes: ["signup.created"], enabled: true, secretCiphertext: "private-webhook-secret" }],
      emailTemplateRecords: [{ id: "private-email-template-id", type: "SIGNUP", subject: "Confirm your place", previewText: "One last step", header: "Welcome", subHeader: "", mainBody: "Thanks for joining", subBody: "", createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-02") }],
      automationRecipes: [{ id: "private-recipe-id", type: "WELCOME", status: "DRAFT", currentVersion: 2, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-02"), versions: [{ id: "private-recipe-version-id", version: 1, config: { trigger: "SIGNUP_VERIFIED", subject: "Hello", body: "Welcome" }, createdAt: new Date("2026-01-01") }, { id: "private-recipe-version-id-2", version: 2, config: { trigger: "SIGNUP_VERIFIED", delayMinutes: 0, subject: "Welcome to Launch", body: "Thanks for joining", secretCiphertext: "private-automation-secret" }, createdAt: new Date("2026-01-02") }] }],
      broadcasts: [{ id: "private-broadcast-id", name: "Launch update", subject: "A small update", previewText: "What changed", body: "We have news.", status: "DRAFT", recipientCount: 12, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-02"), sentAt: null, recipients: [{ email: "private-broadcast-recipient@example.invalid" }] }],
    }],
    apiKeys: [{ name: "Website", scopes: ["waitlist:write"], keyHash: "private-api-key-hash" }],
    integrations: [{ provider: "RESEND", status: "TESTED", fromEmail: "hello@example.invalid", secretCiphertext: "private-integration-secret" }],
  });
  const body = JSON.stringify(exported);
  assert.equal(exported.account.email, "person@example.invalid");
  assert.equal(exported.workspaces[0].name, "Launch");
  assert.equal(exported.campaigns[0].name, "Launch waitlist");
  assert.equal(exported.campaigns[0].emailTemplates[0].subject, "Confirm your place");
  assert.equal(exported.campaigns[0].automations[0].versions[1].config.subject, "Welcome to Launch");
  assert.equal(exported.campaigns[0].broadcasts[0].body, "We have news.");
  for (const secret of ["private-user-id", "private-workspace-id", "private-campaign-id", "private-password", "private-webhook-id", "private-webhook-secret", "private-email-template-id", "private-recipe-id", "private-recipe-version-id", "private-broadcast-id", "private-broadcast-recipient@example.invalid", "private-api-key-hash", "private-integration-secret", "private-automation-secret"]) {
    assert.equal(body.includes(secret), false);
  }
});
