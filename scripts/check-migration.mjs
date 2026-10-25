import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";

import pg from "pg";

// Deliberately does not load .env or use DATABASE_URL. Only a local admin
// connection is accepted, and only uniquely named disposable databases are used.
const adminUrl = new URL(
  process.env.MIGRATION_TEST_ADMIN_URL ?? "postgresql://postgres@127.0.0.1:5432/postgres",
);
assert(
  ["127.0.0.1", "localhost", "[::1]"].includes(adminUrl.hostname),
  "Migration checks require local PostgreSQL.",
);
const admin = new pg.Client({ connectionString: adminUrl.href });
await admin.connect();
const created = [];
const prisma = "node_modules/prisma/build/index.js";
const migration = "20261011000000_campaign_product_revamp";
/** Runs a Prisma CLI subcommand against a specific database URL and throws with captured output on failure. */
function runPrisma(args, databaseUrl) {
  const result = spawnSync(process.execPath, [prisma, ...args], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(`${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
}
try {
  for (const legacy of [false, true]) {
    const name = `waitlyze_migration_check_${randomBytes(8).toString("hex")}`;
    await admin.query(`CREATE DATABASE "${name}"`);
    created.push(name);
    const databaseUrl = new URL(adminUrl.href);
    databaseUrl.pathname = `/${name}`;
    const db = new pg.Client({ connectionString: databaseUrl.href });
    await db.connect();
    try {
      if (legacy) {
        // Install the unchanged main schema and representative pre-PR records.
        for (const name of ["20260531075310_init", "20260531102725_remove_firstname_lastname"]) {
          await db.query(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
        }
        await db.query(`INSERT INTO users (id,email,"updatedAt") VALUES ('legacy-owner','owner@example.invalid',now()), ('legacy-empty','empty@example.invalid',now());
          INSERT INTO wait_lists (id,name,"userId") VALUES ('legacy-campaign','Legacy launch','legacy-owner');
          INSERT INTO sign_ups (id,"uniqueUserId",email,"waitListId","createdAt","updatedAt") VALUES
          ('legacy-first','visitor-1','  PERSON@EXAMPLE.INVALID ','legacy-campaign','2026-01-01',now()),
          ('legacy-duplicate','visitor-2','person@example.invalid','legacy-campaign','2026-01-02',now());`);
        // Duplicate page-view rows as produced by retried impression trackers.
        await db.query(`INSERT INTO impressions (id,"uniqueUserId","waitListId","createdAt","updatedAt") VALUES
          ('legacy-imp-keep','visitor-1','legacy-campaign','2026-01-01',now()),
          ('legacy-imp-dup','visitor-1','legacy-campaign','2026-01-03',now());`);
        await db.query(
          `UPDATE sign_ups SET "impressionId"='legacy-imp-dup' WHERE id='legacy-first'`,
        );
        const upgrade = await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8");
        // A failed statement must roll back both schema and data changes.
        await assert.rejects(db.query(upgrade.replace("COMMIT;", "SELECT 1 / 0;\nCOMMIT;")));
        await db.query("ROLLBACK");
        assert.equal(
          (await db.query("SELECT to_regclass('public.workspaces') AS table_name")).rows[0]
            .table_name,
          null,
        );
        assert.equal(
          (await db.query("SELECT COUNT(*)::int AS count FROM sign_ups")).rows[0].count,
          2,
        );
        await db.query(upgrade);
        const { rows } =
          await db.query(`SELECT w.id, w.status, workspace."personalOwnerId", member.role
          FROM wait_lists w JOIN workspaces workspace ON workspace.id=w."workspaceId"
          JOIN workspace_members member ON member."workspaceId"=workspace.id AND member."userId"=w."userId"`);
        assert.deepEqual(
          rows.map(({ id, status, personalOwnerId, role }) => ({
            id,
            status,
            personalOwnerId,
            role,
          })),
          [
            {
              id: "legacy-campaign",
              status: "PUBLISHED",
              personalOwnerId: "legacy-owner",
              role: "OWNER",
            },
          ],
        );
        const signups = await db.query(
          `SELECT id,"emailNormalized","verifiedAt" IS NOT NULL AS verified,"referralCode" FROM sign_ups ORDER BY "createdAt"`,
        );
        assert.equal(signups.rows.length, 2);
        assert.equal(signups.rows[0].emailNormalized, "person@example.invalid");
        assert.equal(signups.rows[1].emailNormalized, null);
        assert(signups.rows.every((row) => row.verified && row.referralCode));
        assert.equal(
          (await db.query(`SELECT COUNT(*)::int AS count FROM workspaces`)).rows[0].count,
          2,
        );
        await db.query(
          `INSERT INTO wait_lists (id,"userId","updatedAt") VALUES ('new-campaign','legacy-owner',now())`,
        );
        assert.equal(
          (await db.query(`SELECT status FROM wait_lists WHERE id='new-campaign'`)).rows[0].status,
          "DRAFT",
        );
        await db.query(
          await readFile("prisma/migrations/20261012000000_workspace_audit/migration.sql", "utf8"),
        );
        assert.equal(
          (await db.query("SELECT to_regclass('public.workspace_audit_events') AS table_name"))
            .rows[0].table_name,
          "workspace_audit_events",
        );
        // Later additive migrations must also apply cleanly on the upgraded legacy schema.
        for (const name of [
          "20261014081346_phase0_attribution_points",
          "20261014083000_phase0_impression_dedupe",
          "20261016101137_phase4_points_ledger",
          "20261016103339_phase4_signup_ip_index",
          "20261016164519_analytics_impression_time_index",
          "20261017153000_impression_region",
          "20261018073758_share_events",
          "20261018120000_email_composer",
          "20261019110000_resend_workspace_webhooks",
          "20261019120000_outbox_events_verification_index",
          "20261025090838_dashboard_bulk_consent_source",
        ]) {
          await db.query(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
        }
        // The dedupe migration keeps the earliest impression and repoints signups.
        const deduped = await db.query(
          `SELECT id FROM impressions WHERE "uniqueUserId"='visitor-1'`,
        );
        assert.equal(deduped.rows.length, 1);
        assert.equal(deduped.rows[0].id, "legacy-imp-keep");
        assert.equal(
          (await db.query(`SELECT "impressionId" FROM sign_ups WHERE id='legacy-first'`)).rows[0]
            .impressionId,
          "legacy-imp-keep",
        );
      } else {
        runPrisma(["migrate", "deploy"], databaseUrl.href);
        runPrisma(["migrate", "deploy"], databaseUrl.href); // Deployment retry is a no-op.
      }
      runPrisma(
        [
          "migrate",
          "diff",
          "--from-config-datasource",
          "--to-schema",
          "prisma/schema.prisma",
          "--exit-code",
        ],
        databaseUrl.href,
      );
      console.log(
        `${legacy ? "Legacy upgrade and data preservation" : "Fresh deployment and repeat deployment"}: passed`,
      );
    } finally {
      await db.end();
    }
  }
} finally {
  for (const name of created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  await admin.end();
}
