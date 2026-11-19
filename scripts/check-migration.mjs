import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readdir, readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";

import Database from "better-sqlite3";

const prisma = "node_modules/prisma/build/index.js";
const migrationsDir = resolve("migrations");
const migrationFiles = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

assert(migrationFiles.length > 0, "No SQL migration files found in migrations/ directory.");
console.log(`Found ${migrationFiles.length} migration file(s): ${migrationFiles.join(", ")}`);

const tempDbName = `test_migration_${randomBytes(8).toString("hex")}.db`;
const tempDbPath = resolve("prisma", tempDbName);

function runPrisma(args, databaseUrl) {
  const result = spawnSync(process.execPath, [prisma, ...args], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

try {
  console.log(`Applying migrations to temporary SQLite database: ${tempDbPath}`);
  const db = new Database(tempDbPath);

  try {
    for (const file of migrationFiles) {
      console.log(`Executing ${file}...`);
      const sql = await readFile(resolve(migrationsDir, file), "utf8");
      db.exec(sql);
    }

    const integrity = db.pragma("integrity_check");
    assert.deepEqual(integrity, [{ integrity_check: "ok" }], "SQLite integrity check failed.");

    const foreignKeyViolations = db.pragma("foreign_key_check");
    assert.deepEqual(
      foreignKeyViolations,
      [],
      `Foreign key violations detected: ${JSON.stringify(foreignKeyViolations)}`,
    );

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all();
    assert(tables.length > 0, "No tables created by migrations.");
    console.log(`Successfully verified ${tables.length} tables in SQLite database.`);

    // Test essential entity creation
    const testUserId = "test-user-check";
    const testWsId = "test-workspace-check";
    db.prepare(
      `INSERT INTO users (id, email, name, emailVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
    ).run(testUserId, "ci-test@waitlyze.com", "CI Test User");

    db.prepare(
      `INSERT INTO workspaces (id, name, personalOwnerId, createdAt, updatedAt)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    ).run(testWsId, "CI Test Workspace", testUserId);

    const countUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
    assert.equal(countUsers, 1, "Expected 1 user in verification test.");
  } finally {
    db.close();
  }

  console.log("Checking Prisma schema diff against applied migrations...");
  const diffOutput = runPrisma(
    [
      "migrate",
      "diff",
      "--from-config-datasource",
      "--to-schema",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    `file:${tempDbPath}`,
  );
  console.log(diffOutput.trim() || "No schema differences detected.");
  console.log("✅ D1 / SQLite migration check passed successfully!");
} finally {
  try {
    await unlink(tempDbPath);
  } catch {
    // Ignore if file doesn't exist
  }
}
