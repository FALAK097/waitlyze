import assert from "node:assert/strict";
import test from "node:test";
import { consumePublicBudget, PublicRateLimitError, publicClientIdentity } from "../../src/lib/security/public-rate-limit.mjs";

const options = { secret: "test-secret", now: new Date("2026-10-11T00:00:00Z") };
const input = { kind: "signup", campaignId: "campaign", headers: new Headers(), email: "test@example.com" };

test("untrusted proxies cannot rotate client budget through spoofed forwarding headers", () => {
  const headers = new Headers({ "x-forwarded-for": "8.8.8.8", "x-real-ip": "1.1.1.1", "x-vercel-forwarded-for": "9.9.9.9" });
  assert.equal(publicClientIdentity(headers, { vercel: false }), "untrusted-client");
  assert.equal(publicClientIdentity(headers, { vercel: true }), "9.9.9.9");
  headers.set("x-vercel-forwarded-for", "9.9.9.9, 8.8.8.8");
  assert.equal(publicClientIdentity(headers, { vercel: true }), "untrusted-client");
});

test("limiter database failure denies admission instead of bypassing budgets", async () => {
  await assert.rejects(consumePublicBudget({ $transaction: async () => { throw new Error("db down with private connection"); } }, input, options), (error) => error instanceof PublicRateLimitError && error.status === 503 && !error.message.includes("private"));
});

test("global quota is checked before allocating rotating campaign/IP/recipient rows", async () => {
  let counterQueries = 0;
  const tx = { $executeRaw: async () => 0, $queryRaw: async (sql) => {
    if (sql.join("").includes("pg_advisory")) return [];
    counterQueries++;
    return [];
  } };
  await assert.rejects(consumePublicBudget({ $transaction: async (run) => run(tx) }, input, options), (error) => error.status === 429);
  assert.equal(counterQueries, 1);
});

test("counter keys never store plaintext IP or recipient addresses", async () => {
  const values = [];
  const tx = { $executeRaw: async () => 0, $queryRaw: async (sql, ...parameters) => {
    if (sql.join("").includes("pg_advisory")) return [];
    values.push(parameters[0]);
    return [{ count: 1 }];
  } };
  await consumePublicBudget({ $transaction: async (run) => run(tx) }, input, options);
  assert.equal(values.length, 4);
  assert.equal(values.some((key) => key.includes("test@example.com") || key.includes("untrusted-client")), false);
});

test("authenticated mail budgets require a trusted actor and do not accept recipient arrays", async () => {
  for (const badInput of [{ kind: "invitation", campaignId: "workspace", email: "test@example.com" }, { kind: "testEmail", campaignId: "workspace", actorId: "user", email: ["a@example.com", "b@example.com"] }]) {
    await assert.rejects(consumePublicBudget({}, badInput, options), (error) => error.status === 503);
  }
});

test("authenticated mail budget is keyed to authenticated actor rather than spoofable request headers", async () => {
  const keys = [];
  const db = { $transaction: async (run) => run({ $executeRaw: async () => 0, $queryRaw: async (sql, ...values) => {
    if (sql.join("").includes("pg_advisory")) return [];
    keys.push(values[0]);
    return [{ count: 1 }];
  } }) };
  await consumePublicBudget(db, { kind: "testEmail", campaignId: "workspace", actorId: "admin", email: "test@example.com" }, options);
  const first = keys[2];
  keys.length = 0;
  await consumePublicBudget(db, { kind: "testEmail", campaignId: "workspace", actorId: "admin", email: "test@example.com", headers: new Headers({ "x-forwarded-for": "8.8.8.8" }) }, options);
  assert.equal(keys[2], first);
});
