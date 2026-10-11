import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { decryptSecret, encryptSecret, isPublicAddress, resolvePublicTarget, signWebhook, validateWebhookUrl, verifyWebhookSignature } from "../../src/lib/webhooks/security.mjs";
import { dispatchPendingWebhooks } from "../../src/lib/webhooks/delivery.mjs";

test("webhook targets block internal, mapped, metadata, and special-use addresses", async () => {
  for (const address of ["127.0.0.1", "169.254.169.254", "10.0.0.2", "192.168.2.1", "100.64.0.1", "::1", "::ffff:127.0.0.1", "fe80::1", "fc00::1", "2001:db8::1"]) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("8.8.8.8"), true);
  await assert.rejects(resolvePublicTarget("example.com", async () => [{ address: "8.8.8.8", family: 4 }, { address: "127.0.0.1", family: 4 }]), { code: "TARGET_BLOCKED" });
});

test("webhook URL rejects credentials, unsafe schemes, and nonstandard ports", () => {
  for (const url of ["http://example.com", "https://me:password@example.com", "https://example.com:444", "https://127.0.0.1", "https://example.local"]) assert.throws(() => validateWebhookUrl(url));
  assert.equal(validateWebhookUrl("https://example.com/hook?token=private").safeUrl.includes("private"), false);
});

test("webhook encryption authenticates ciphertext and signatures require exact encoding", () => {
  const previous = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
  process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  try {
    const encrypted = encryptSecret("private-signing-key");
    assert.equal(decryptSecret(encrypted), "private-signing-key");
    assert.throws(() => decryptSecret({ ...encrypted, tag: randomBytes(16).toString("base64") }));
    const payload = { id: "event" };
    const signature = signWebhook("secret", "123", payload);
    assert.equal(verifyWebhookSignature("secret", "123", payload, signature), true);
    assert.equal(verifyWebhookSignature("secret", "123", payload, signature + "invalid"), false);
    assert.equal(verifyWebhookSignature("secret", "123", { id: "other" }, signature), false);
  } finally {
    if (previous === undefined) delete process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
    else process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = previous;
  }
});

test("webhook dispatcher considers abandoned processing leases for recovery", async () => {
  const now = new Date();
  const db = { webhookDelivery: { findMany: async ({ where }) => {
    assert.deepEqual(where.OR, [{ status: "PENDING" }, { status: "PROCESSING", lockedAt: { lt: new Date(now.getTime() - 60_000) } }]);
    return [];
  } } };
  assert.equal((await dispatchPendingWebhooks(db, { now })).considered, 0);
});
