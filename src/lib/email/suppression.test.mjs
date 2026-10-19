import assert from "node:assert/strict";
import { test } from "node:test";
import { Resend } from "resend";
import { Webhook } from "svix";
import { applyKnownProviderEvents, recordVerifiedProviderEvent, WebhookWorkspaceMismatchError } from "./suppression.mjs";
import { decryptWebhookSecret, encryptWebhookSecret } from "../integrations/secrets.mjs";

function fakeDatabase() {
  const deliveries = new Map();
  const recorded = [];
  const suppressions = [];
  return {
    deliveries, recorded, suppressions,
    outboxEvent: { findFirst: async ({ where }) => deliveries.get(where.providerMessageId) || null },
    waitList: { findUnique: async ({ where }) => ({ workspaceId: where.id === "list-a" ? "workspace-a" : "workspace-b" }) },
    signUp: { findFirst: async () => ({ email: "member@example.com", emailNormalized: "member@example.com" }) },
    emailProviderEvent: {
      upsert: async ({ create }) => { if (!recorded.some((item) => item.providerEventId === create.providerEventId)) recorded.push(create); },
      findMany: async ({ where }) => recorded.filter((item) => item.providerMessageId === where.providerMessageId &&
        where.recipientEmails.has && item.recipientEmails.includes(where.recipientEmails.has) &&
        (item.workspaceId === null || item.workspaceId === where.AND[0].OR[1].workspaceId) &&
        (item.type === "email.complained" || item.type === "email.bounced" && item.isPermanent)),
    },
    emailSuppression: { upsert: async ({ create }) => { suppressions.push(create); } },
  };
}

const bounce = (id, permanent = true) => ({ type: "email.bounced", data: { email_id: id, to: ["member@example.com"], bounce: { type: permanent ? "Permanent" : "Transient" } } });

test("customer webhook rejects a delivery belonging to another workspace", async () => {
  const db = fakeDatabase();
  db.deliveries.set("message-b", { waitListId: "list-b", payload: { signUpId: "signup-b" } });
  await assert.rejects(recordVerifiedProviderEvent(db, bounce("message-b"), "event-1", "workspace-a"), WebhookWorkspaceMismatchError);
  assert.equal(db.recorded.length, 0);
  assert.equal(db.suppressions.length, 0);
});

test("signed customer bounce suppresses only its own recipient; transient bounces do not", async () => {
  const db = fakeDatabase();
  db.deliveries.set("message-a", { waitListId: "list-a", payload: { signUpId: "signup-a" } });
  await recordVerifiedProviderEvent(db, bounce("message-a", false), "event-1", "workspace-a");
  assert.equal(db.suppressions.length, 0);
  await recordVerifiedProviderEvent(db, bounce("message-a"), "event-2", "workspace-a");
  assert.deepEqual(db.suppressions, [{ workspaceId: "workspace-a", emailNormalized: "member@example.com", reason: "BOUNCE" }]);
});

test("early customer event cannot later suppress a different workspace", async () => {
  const db = fakeDatabase();
  await recordVerifiedProviderEvent(db, bounce("message-late"), "event-early", "workspace-a");
  assert.equal(db.recorded[0].workspaceId, "workspace-a");
  db.deliveries.set("message-late", { waitListId: "list-b", payload: { signUpId: "signup-b" } });
  await applyKnownProviderEvents(db, "message-late", "workspace-b", "member@example.com");
  assert.equal(db.suppressions.length, 0);
});

test("Resend verifies a customer signature and rejects the wrong signing secret", () => {
  const secret = `whsec_${Buffer.alloc(32, 7).toString("base64")}`;
  const otherSecret = `whsec_${Buffer.alloc(32, 8).toString("base64")}`;
  const payload = JSON.stringify(bounce("message-a"));
  const timestamp = new Date();
  const headers = { id: "event-verified", timestamp: Math.floor(timestamp.getTime() / 1000).toString(), signature: new Webhook(secret).sign("event-verified", timestamp, payload) };
  const resend = new Resend("re_test");
  assert.equal(resend.webhooks.verify({ payload, headers, webhookSecret: secret }).data.email_id, "message-a");
  assert.throws(() => resend.webhooks.verify({ payload, headers, webhookSecret: otherSecret }));
});

test("customer signing secrets are encrypted at rest", () => {
  const previousKey = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
  process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString("base64");
  try {
    const secret = `whsec_${Buffer.alloc(32, 4).toString("base64")}`;
    const stored = encryptWebhookSecret(secret);
    assert(!JSON.stringify(stored).includes(secret));
    assert.equal(decryptWebhookSecret(stored), secret);
  } finally {
    if (previousKey === undefined) delete process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
    else process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = previousKey;
  }
});
