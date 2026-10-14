// Dev-only seed: a paused demo webhook endpoint plus a few deliveries with
// different statuses, so the endpoints table, row menu, and deliveries sheet
// can be exercised locally without hitting real receivers.
//
// Usage: node --env-file=.env scripts/seed-webhook-demo.mjs [waitlistId]
//
// Safety: refuses to run unless DATABASE_URL points at localhost. Seeded
// deliveries are terminal (DELIVERED / FAILED), so the dispatcher never
// fires them at the dummy URL. Only FAILED rows can move, via an explicit
// Replay click in the UI.

import pg from "pg";
import { createWebhookSecret, encryptSecret } from "../src/lib/webhooks/security.mjs";

const [waitlistId = "cmv7uz9eq000jfnqxf0rhul3m"] = process.argv.slice(2);
const dbUrl = process.env.DATABASE_URL || "";
if (!/localhost|127\.0\.0\.1/.test(dbUrl)) {
  console.error("Refusing to seed: DATABASE_URL does not point at localhost.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: dbUrl });
const cuid = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

try {
  const { rows: lists } = await pool.query(`SELECT id, name FROM wait_lists WHERE id = $1`, [waitlistId]);
  if (!lists.length) {
    console.error(`Waitlist not found: ${waitlistId}`);
    process.exit(1);
  }
  console.log(`Waitlist: ${lists[0].name || "Untitled"} (${waitlistId})`);

  let staging = (await pool.query(`SELECT id FROM webhook_subscriptions WHERE "waitListId" = $1 AND name = 'Staging'`, [waitlistId])).rows[0];
  if (!staging) {
    const encrypted = encryptSecret(createWebhookSecret());
    const now = new Date();
    const inserted = await pool.query(
      `INSERT INTO webhook_subscriptions (id, "waitListId", name, url, "eventTypes", enabled, "secretCiphertext", "secretIv", "secretTag", "createdAt", "updatedAt")
       VALUES ($1, $2, 'Staging', 'https://example.com/hooks/waitlist-staging', $3, false, $4, $5, $6, $7, $7) RETURNING id`,
      [cuid(), waitlistId, ["signup.created", "signup.verified"], encrypted.ciphertext, encrypted.iv, encrypted.tag, now],
    );
    staging = inserted.rows[0];
    console.log(`Created paused endpoint "Staging" (${staging.id}).`);
  } else {
    console.log(`Reusing endpoint "Staging" (${staging.id}).`);
  }

  const { rows: existing } = await pool.query(`SELECT COUNT(*)::int AS count FROM webhook_deliveries WHERE "subscriptionId" = $1`, [staging.id]);
  if (existing[0].count >= 3) {
    console.log(`Endpoint already has ${existing[0].count} deliveries, skipping delivery seed.`);
  } else {
    const signup = (await pool.query(`SELECT id FROM sign_ups WHERE "waitListId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [waitlistId])).rows[0];
    const data = signup ? { signupId: signup.id } : { test: true };
    const now = Date.now();
    const build = (eventType, minutesAgo, status, extra) => {
      const occurredAt = new Date(now - minutesAgo * 60_000);
      const eventId = crypto.randomUUID();
      return [
        cuid(), staging.id, eventId, `${staging.id}:${eventId}`, eventType,
        JSON.stringify({ id: eventId, type: eventType, version: 1, occurredAt: occurredAt.toISOString(), waitlistId, data }),
        status, occurredAt, occurredAt, ...extra,
      ];
    };
    const deliveredAt = new Date(now - 41 * 60_000);
    // (id, subscriptionId, eventId, eventKey, eventType, payload, status, createdAt, availableAt, attempts, responseStatus, processedAt, deliveredAt, lastErrorCode)
    const rows = [
      build("signup.created", 58, "DELIVERED", [1, 200, new Date(now - 58 * 60_000), new Date(now - 58 * 60_000), null]),
      build("signup.verified", 41, "DELIVERED", [2, 200, deliveredAt, deliveredAt, null]),
      build("signup.created", 12, "FAILED", [6, 502, new Date(now - 12 * 60_000), null, "http_502"]),
    ];
    for (const row of rows) {
      await pool.query(
        `INSERT INTO webhook_deliveries (id, "subscriptionId", "eventId", "eventKey", "eventType", payload, status, "createdAt", "availableAt", attempts, "responseStatus", "processedAt", "deliveredAt", "lastErrorCode")
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::"WebhookDeliveryStatus", $8, $9, $10, $11, $12, $13, $14)`,
        row,
      );
    }
    await pool.query(`UPDATE webhook_subscriptions SET "lastDeliveredAt" = $2 WHERE id = $1`, [staging.id, deliveredAt]);
    console.log("Seeded 3 deliveries (2 delivered, 1 failed) on the Staging endpoint.");
  }
} finally {
  await pool.end();
}
console.log("Done. Open the waitlist Settings → Webhooks to exercise the table, menu, and sheet.");
