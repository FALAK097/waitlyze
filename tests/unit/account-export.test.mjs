import test from "node:test";
import assert from "node:assert/strict";
import { buildAccountExport } from "../../src/lib/account-export.mjs";

test("account export includes only allowlisted account, campaign, workspace, and developer fields", () => {
  const exported = buildAccountExport({
    user: { id: "private-user-id", email: "person@example.invalid", name: "Person", emailVerified: true, passwordHash: "private-password" },
    memberships: [{ role: "OWNER", createdAt: new Date("2026-01-01"), workspace: { id: "private-workspace-id", name: "Launch", createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-02") } }],
    campaigns: [{ id: "private-campaign-id", name: "Launch waitlist", status: "DRAFT", publicSlug: "launch", workspace: { name: "Launch" }, customDomain: null, webhookSubscriptions: [{ name: "Signup events", eventTypes: ["signup.created"], enabled: true, secretCiphertext: "private-webhook-secret" }] }],
    apiKeys: [{ name: "Website", scopes: ["waitlist:write"], keyHash: "private-api-key-hash" }],
    integrations: [{ provider: "RESEND", status: "TESTED", fromEmail: "hello@example.invalid", secretCiphertext: "private-integration-secret" }],
  });
  const body = JSON.stringify(exported);
  assert.equal(exported.account.email, "person@example.invalid");
  assert.equal(exported.workspaces[0].name, "Launch");
  assert.equal(exported.campaigns[0].name, "Launch waitlist");
  for (const secret of ["private-user-id", "private-workspace-id", "private-campaign-id", "private-password", "private-webhook-secret", "private-api-key-hash", "private-integration-secret"]) {
    assert.equal(body.includes(secret), false);
  }
});
