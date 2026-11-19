import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";

const reset = process.argv.includes("--reset");
const rawUrl = (process.env.DATABASE_URL || "file:./prisma/dev.db").trim();

if (!rawUrl.startsWith("file:")) {
  throw new Error(
    `db:bootstrap only supports local SQLite file: URLs (received ${rawUrl.split(":")[0]}:).`,
  );
}

const fileSpec = rawUrl.slice("file:".length);
if (!fileSpec || fileSpec === ":memory:") {
  throw new Error("db:bootstrap requires a filesystem SQLite path, not :memory:.");
}

const dbPath = resolve(process.cwd(), fileSpec);
await mkdir(dirname(dbPath), { recursive: true });

if (reset) {
  for (const candidate of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (existsSync(candidate)) {
      await unlink(candidate);
    }
  }
}

const migrationsDir = resolve(process.cwd(), "migrations");
const migrationFiles = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

if (migrationFiles.length === 0) {
  throw new Error("No SQL migration files found in migrations/.");
}

const db = new Database(dbPath);
try {
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS "d1_migrations" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" TEXT UNIQUE,
      "applied_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = new Set(
    db
      .prepare('SELECT "name" FROM "d1_migrations"')
      .all()
      .map((row) => row.name),
  );

  const untrackedTables = db
    .prepare(
      `SELECT "name" FROM sqlite_master
       WHERE type = 'table' AND "name" NOT LIKE 'sqlite_%' AND "name" != 'd1_migrations'
       ORDER BY "name"`,
    )
    .all()
    .map((row) => row.name);

  if (applied.size === 0 && untrackedTables.length > 0) {
    throw new Error(
      `Untracked SQLite schema at ${dbPath} (${untrackedTables.length} existing table(s) without d1_migrations history). Re-run with --reset to recreate the local database.`,
    );
  }

  let appliedCount = 0;
  for (const file of migrationFiles) {
    if (applied.has(file)) continue;
    const sql = await readFile(resolve(migrationsDir, file), "utf8");
    const applyMigration = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO "d1_migrations" ("name") VALUES (?)').run(file);
    });
    applyMigration();
    appliedCount++;
    console.log(`Applied ${file} to ${dbPath}`);
  }

  const integrity = db.pragma("integrity_check");
  if (integrity?.[0]?.integrity_check !== "ok") {
    throw new Error(`SQLite integrity check failed: ${JSON.stringify(integrity)}`);
  }

  const foreignKeyViolations = db.pragma("foreign_key_check");
  if (foreignKeyViolations.length > 0) {
    throw new Error(`SQLite foreign key violations: ${JSON.stringify(foreignKeyViolations)}`);
  }

  console.log(
    appliedCount > 0
      ? `✅ Local SQLite database ready at ${dbPath} (${appliedCount} migration(s) applied).`
      : `✅ Local SQLite database already up to date at ${dbPath}.`,
  );
} finally {
  db.close();
}
