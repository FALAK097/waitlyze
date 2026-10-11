import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import pg from "pg";
import { consumePublicBudget } from "../../src/lib/security/public-rate-limit.mjs";

const connectionString = process.env.RATE_LIMIT_TEST_DATABASE_URL;
const local = connectionString && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(connectionString).hostname);

test("PostgreSQL atomically enforces shared quotas, rolls back denied admissions, cleans TTL and resets expiry", { skip: !local }, async () => {
  const pool = new pg.Pool({ connectionString, max: 12 });
  const schema = `rate_limit_test_${randomBytes(6).toString("hex")}`;
  const quoteSchema = `"${schema}"`;
  const admin = await pool.connect();
  try {
    await admin.query(`CREATE SCHEMA ${quoteSchema}`);
    await admin.query(`CREATE TABLE ${quoteSchema}.rate_limit_buckets ("key" text PRIMARY KEY, "count" integer NOT NULL DEFAULT 0, "expiresAt" timestamptz(3) NOT NULL, "updatedAt" timestamptz(3) NOT NULL DEFAULT now())`);
    const db = { $transaction: async (run) => {
      const client = await pool.connect();
      const raw = async (strings, ...values) => {
        const sql = strings.reduce((result, part, index) => result + part + (index < values.length ? `$${index + 1}` : ""), "");
        const result = await client.query(sql, values);
        return result.rows;
      };
      try {
        await client.query("BEGIN");
        await client.query(`SET LOCAL search_path TO ${quoteSchema}`);
        const result = await run({ $queryRaw: raw, $executeRaw: raw });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally { client.release(); }
    } };
    const now = new Date("2026-10-11T00:00:00Z");
    const options = { now, secret: "test-secret", vercel: true };
    const input = { kind: "signup", campaignId: "campaign", headers: new Headers({ "x-vercel-forwarded-for": "8.8.8.8" }), email: "same@example.com" };
    const outcomes = await Promise.all(Array.from({ length: 20 }, () => consumePublicBudget(db, input, options).then(() => "accepted", (error) => error.status)));
    assert.equal(outcomes.filter((value) => value === "accepted").length, 3);
    assert.equal(outcomes.filter((value) => value === 429).length, 17);
    const counters = await admin.query(`SELECT "count" FROM ${quoteSchema}.rate_limit_buckets`);
    assert.equal(counters.rows.length, 4);
    assert.equal(counters.rows.every(({ count }) => count === 3), true, "denials roll back every budget");
    // Different addresses remain bounded by the same authoritative client budget.
    const clientOutcomes = await Promise.all(Array.from({ length: 30 }, (_, i) => consumePublicBudget(db, { ...input, email: `unique${i}@example.com` }, options).then(() => "accepted", (error) => error.status)));
    assert.equal(clientOutcomes.filter((value) => value === "accepted").length, 17);
    assert.equal(clientOutcomes.filter((value) => value === 429).length, 13);
    const mailInputs = Array.from({ length: 30 }, (_, i) => ({ kind: "testEmail", campaignId: "workspace", actorId: "admin", email: `mail${i}@example.com` }));
    const mailOutcomes = await Promise.all(mailInputs.map((value) => consumePublicBudget(db, value, options).then(() => "accepted", (error) => error.status)));
    assert.equal(mailOutcomes.filter((value) => value === "accepted").length, 20);
    assert.equal(mailOutcomes.filter((value) => value === 429).length, 10);
    // Test cleanup/reset for the signup buckets independently of mail test rows.
    await admin.query(`DELETE FROM ${quoteSchema}.rate_limit_buckets WHERE "key" LIKE 'public:testEmail:%'`);
    await admin.query(`INSERT INTO ${quoteSchema}.rate_limit_buckets VALUES ('expired', 1, $1, $1)`, [new Date(now.getTime() - 1000)]);
    await consumePublicBudget(db, input, { ...options, now: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 1) });
    const reset = await admin.query(`SELECT "key", "count" FROM ${quoteSchema}.rate_limit_buckets`);
    assert.equal(reset.rows.some(({ key }) => key === "expired"), false);
    assert.equal(reset.rows.length, 4);
    assert.equal(reset.rows.every(({ count }) => count === 1), true);
  } finally {
    await admin.query(`DROP SCHEMA IF EXISTS ${quoteSchema} CASCADE`);
    admin.release();
    await pool.end();
  }
});
