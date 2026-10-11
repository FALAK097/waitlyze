import assert from "node:assert/strict";
import test from "node:test";
import { applyKnownProviderEvents, recordVerifiedProviderEvent } from "../../src/lib/email/suppression.mjs";
import { acceptWorkspaceInvitation, hashInvitationToken } from "../../src/lib/workspaces/invitations.mjs";

const event = { type: "email.bounced", data: { email_id: "message", to: [" Person@Example.com "], bounce: { type: "Permanent" } } };
function fixture(payload, { persisted = true, recipient = "person@example.com" } = {}) {
  const events = [], suppressed = [];
  const db = {
    emailProviderEvent: { upsert: async ({ create }) => { events.push(create); return create; }, findMany: async ({ where }) => events.filter((row) => row.providerMessageId === where.providerMessageId && row.recipientEmails.includes(where.recipientEmails.has) && (row.type === "email.complained" || row.isPermanent)) },
    outboxEvent: { findFirst: async () => persisted ? { waitListId: "campaign", payload } : null },
    waitList: { findUnique: async () => ({ workspaceId: "workspace" }) },
    broadcastRecipient: { findFirst: async ({ where }) => { assert.equal(where.providerMessageId, "message"); assert.equal(where.broadcast.waitListId, "campaign"); return { email: recipient, emailNormalized: recipient }; } },
    automationRunStep: { findFirst: async ({ where }) => { assert.equal(where.providerMessageId, "message"); assert.equal(where.run.waitListId, "campaign"); return { run: { signUp: { email: recipient } } }; } },
    signUp: { findFirst: async ({ where }) => { assert.equal(where.waitListId, "campaign"); return { email: recipient }; } },
    emailSuppression: { upsert: async (row) => suppressed.push(row) },
  };
  return { db, events, suppressed };
}

test("later broadcast bounce matches the stored sent recipient and workspace", async () => {
  const { db, suppressed } = fixture({ broadcastId: "broadcast", recipientId: "recipient" });
  await recordVerifiedProviderEvent(db, event, "provider-event");
  assert.equal(suppressed.length, 1);
  assert.deepEqual(suppressed[0].where.workspaceId_emailNormalized, { workspaceId: "workspace", emailNormalized: "person@example.com" });
});

test("later automation complaint resolves its persisted step and original recipient snapshot", async () => {
  const { db, suppressed } = fixture({ automationStepId: "step", recipientEmail: "person@example.com" }, { recipient: "changed@example.com" });
  await recordVerifiedProviderEvent(db, { ...event, type: "email.complained" }, "provider-event");
  assert.equal(suppressed[0].create.reason, "COMPLAINT");
  assert.equal(suppressed[0].create.emailNormalized, "person@example.com");
});

test("early webhook persists recipient evidence and replays after delivery persistence", async () => {
  const { db, events, suppressed } = fixture({}, { persisted: false });
  await recordVerifiedProviderEvent(db, event, "provider-event");
  assert.equal(suppressed.length, 0);
  assert.deepEqual(events[0].recipientEmails, ["person@example.com"]);
  await applyKnownProviderEvents(db, "message", "workspace", "person@example.com");
  assert.equal(suppressed.length, 1);
  await applyKnownProviderEvents(db, "message", "other-workspace", "wrong@example.com");
  assert.equal(suppressed.length, 1);
});

test("mismatched webhook recipients and temporary bounces cannot suppress subscribers", async () => {
  const { db, suppressed } = fixture({ broadcastId: "broadcast", recipientId: "recipient" }, { recipient: "wrong@example.com" });
  await recordVerifiedProviderEvent(db, event, "provider-event");
  await recordVerifiedProviderEvent(db, { ...event, data: { ...event.data, bounce: { type: "Temporary" } } }, "temporary");
  assert.equal(suppressed.length, 0);
});

test("invitation acceptance cannot claim a token rotated after the initial read", async () => {
  const token = "a".repeat(43);
  let membership = false;
  const invite = { id: "invite", workspaceId: "workspace", emailNormalized: "person@example.com", role: "MEMBER", status: "PENDING", expiresAt: new Date(Date.now() + 10000) };
  const db = { workspaceInvitation: { findUnique: async () => invite }, $transaction: async (run) => run({ workspaceInvitation: { updateMany: async ({ where }) => {
    assert.equal(where.tokenHash, hashInvitationToken(token));
    // Stored hash rotated concurrently before the atomic claim.
    return { count: 0 };
  } }, workspaceMember: { upsert: async () => { membership = true; } } }) };
  assert.deepEqual(await acceptWorkspaceInvitation(db, { token, user: { id: "user", email: "person@example.com", emailVerified: true } }), { success: false, code: "INVALID" });
  assert.equal(membership, false);
});
