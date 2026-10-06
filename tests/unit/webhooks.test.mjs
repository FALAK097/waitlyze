import test from "node:test";
import assert from "node:assert/strict";
import { encryptSecret, decryptSecret, signWebhook, verifyWebhookSignature, canonicalJson, isPublicAddress, validateWebhookUrl, resolvePublicTarget } from "../../src/lib/webhooks/security.mjs";

test("webhook secrets encrypt at rest and authenticate ciphertext", () => {
  process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  const encrypted = encryptSecret("whsec_test-secret");
  assert.notEqual(encrypted.ciphertext, "whsec_test-secret");
  assert.equal(decryptSecret(encrypted), "whsec_test-secret");
  assert.throws(() => decryptSecret({ ...encrypted, tag: Buffer.alloc(16).toString("base64") }));
});

test("webhook signatures use stable canonical JSON", () => {
  const payload = { type: "signup.created", data: { signupId: "s1", test: false } };
  assert.equal(canonicalJson({ b: 2, a: 1 }), '{"a":1,"b":2}');
  const signature = signWebhook("whsec_test", "1700000000", payload);
  assert.equal(verifyWebhookSignature("whsec_test", "1700000000", payload, signature), true);
  assert.equal(verifyWebhookSignature("whsec_other", "1700000000", payload, signature), false);
});

test("webhook URL validation rejects local and unsafe destinations", () => {
  assert.equal(validateWebhookUrl("https://hooks.example.com/path?token=secret").safeUrl, "https://hooks.example.com/path?%E2%80%A6");
  for (const url of ["http://hooks.example.com", "https://localhost/path", "https://127.0.0.1/hook", "https://user:pass@hooks.example.com", "https://hooks.example.com:8443", "https://hooks.example.com/#fragment"]) {
    assert.throws(() => validateWebhookUrl(url), url);
  }
});

test("public address policy excludes special and private IPv4 and IPv6 ranges", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "100.64.0.1", "169.254.169.254", "192.168.1.2", "203.0.113.2", "::1", "fc00::1", "fe80::1", "2001:db8::1", "::ffff:8.8.8.8"]) assert.equal(isPublicAddress(ip), false, ip);
  for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) assert.equal(isPublicAddress(ip), true, ip);
});

test("DNS resolution fails closed when any answer is private", async () => {
  const mixed = async () => [{ address: "8.8.8.8", family: 4 }, { address: "10.0.0.2", family: 4 }];
  await assert.rejects(resolvePublicTarget("hooks.example.com", mixed), /non-public/);
  const publicOnly = async () => [{ address: "8.8.8.8", family: 4 }];
  assert.deepEqual(await resolvePublicTarget("hooks.example.com", publicOnly), await publicOnly());
});
