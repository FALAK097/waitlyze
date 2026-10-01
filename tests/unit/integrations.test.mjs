import test from "node:test";
import assert from "node:assert/strict";
import { encryptIntegrationSecret, decryptIntegrationSecret } from "../../src/lib/integrations/secrets.mjs";
import { resolveWorkspaceEmailSender } from "../../src/lib/integrations/email-sender.mjs";
import { createWorkspaceResendSender } from "../../src/lib/integrations/resend-sender.mjs";
import { updateResendTestResult } from "../../src/lib/integrations/test-result.mjs";

test("workspace provider secrets encrypt and authenticate at rest", () => {
  process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 11).toString("base64");
  const encrypted = encryptIntegrationSecret("re_workspace-test-key");
  assert.notEqual(encrypted.secretCiphertext, "re_workspace-test-key");
  assert.equal(decryptIntegrationSecret(encrypted), "re_workspace-test-key");
  assert.throws(() => decryptIntegrationSecret({ ...encrypted, secretTag: Buffer.alloc(16).toString("base64") }));
});

test("only a tested workspace connection overrides the deployment sender", async () => {
  process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 12).toString("base64");
  const fallback = { apiKey: "deployment-key", fromEmail: "default@example.com" };
  let connection = { id: "ci1", status: "NEEDS_TEST", ...encryptIntegrationSecret("re_test-key"), fromEmail: "hello@workspace.example" };
  const db = { workspaceIntegration: { findUnique: async () => connection, update: async () => {} } };
  assert.deepEqual(await resolveWorkspaceEmailSender(db, "ws1", fallback), fallback);
  connection = { ...connection, status: "CONNECTED" };
  assert.deepEqual(await resolveWorkspaceEmailSender(db, "ws1", fallback), { apiKey: "re_test-key", fromEmail: "hello@workspace.example" });
  assert.deepEqual(await resolveWorkspaceEmailSender(db, null, fallback), fallback);
});

test("a workspace key that cannot be decrypted falls back and marks the connection", async () => {
  process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 13).toString("base64");
  const fallback = { apiKey: "deployment-key", fromEmail: "default@example.com" };
  const connection = { id: "ci2", status: "CONNECTED", ...encryptIntegrationSecret("re_test-key"), fromEmail: "hello@workspace.example" };
  process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 14).toString("base64");
  let update;
  const db = { workspaceIntegration: { findUnique: async () => connection, update: async (input) => { update = input; } } };
  assert.deepEqual(await resolveWorkspaceEmailSender(db, "ws2", fallback), fallback);
  assert.deepEqual(update.data, { status: "NEEDS_ATTENTION", lastErrorCode: "SECRET_DECRYPTION_FAILED" });
});

test("outbox provider uses only a tested workspace sender and caches it per run", async () => {
  process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 15).toString("base64");
  const connection = { id: "ci3", status: "CONNECTED", ...encryptIntegrationSecret("re_workspace-key"), fromEmail: "hello@workspace.example" };
  let reads = 0;
  const db = { workspaceIntegration: { findUnique: async () => { reads++; return connection; }, update: async () => {} } };
  const sent = [];
  const send = createWorkspaceResendSender({
    db,
    defaults: { apiKey: "re_deployment-key", fromEmail: "default@example.com", replyTo: "support@example.com" },
    createClient: (apiKey) => ({ emails: { send: async (message, options) => { sent.push({ apiKey, message, options }); return { data: { id: "email1" } }; } } }),
  });
  const input = { to: "person@example.com", subject: "Waitlist", html: "<p>Hello</p>", idempotencyKey: "signup-1", workspaceId: "ws3" };
  await send(input);
  await send({ ...input, idempotencyKey: "signup-2" });
  assert.equal(reads, 1);
  assert.equal(sent[0].apiKey, "re_workspace-key");
  assert.equal(sent[0].message.from, "hello@workspace.example");
  assert.equal(sent[0].message.replyTo, "support@example.com");
  assert.equal(sent[0].options.idempotencyKey, "signup-1");
});

test("Resend test results cannot activate credentials changed or disconnected while testing", async () => {
  const snapshot = { id: "integration-1", status: "NEEDS_TEST", fromEmail: "old@example.test", secretCiphertext: "cipher-old", secretIv: "iv-old", secretTag: "tag-old" };
  let current = { ...snapshot };
  const db = { workspaceIntegration: { async updateMany({ where, data }) {
    if (!current || Object.entries(where).some(([key, value]) => current[key] !== value)) return { count: 0 };
    current = { ...current, ...data };
    return { count: 1 };
  } } };
  current = { ...snapshot, secretCiphertext: "cipher-new", secretIv: "iv-new", secretTag: "tag-new" };
  assert.equal(await updateResendTestResult(db, snapshot, { status: "CONNECTED" }), false);
  assert.equal(current.status, "NEEDS_TEST");
  current = null;
  assert.equal(await updateResendTestResult(db, snapshot, { status: "NEEDS_ATTENTION" }), false);
  current = { ...snapshot };
  assert.equal(await updateResendTestResult(db, snapshot, { status: "CONNECTED" }), true);
  assert.equal(current.status, "CONNECTED");
});
