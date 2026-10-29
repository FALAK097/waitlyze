import "server-only";
import pg from "pg";

// Prisma's sqltag builds `?` placeholders; pg numbers them `$1..$n`. Both
// interleave 1:1 with `.values`, so a single ordered pass converts safely.
function toPgParams(sql) {
  let index = 0;
  const text = sql.sql.replace(/\?/g, () => `$${++index}`);
  if (index !== sql.values.length) {
    throw new Error(
      `PostgreSQL cursor query has ${index} placeholders but ${sql.values.length} values`,
    );
  }
  return { text, values: sql.values };
}

/**
 * Stream `(id, position)` batches for a ranked audience query in exact rank
 * order using a PostgreSQL server-side cursor pinned in a read-only
 * REPEATABLE READ transaction. The snapshot is taken once at DECLARE, so ranks
 * cannot shift between FETCH batches the way an OFFSET over a recomputed
 * ROW_NUMBER would. Memory stays bounded to one batch. Cleanup runs on normal
 * exhaustion, a thrown error, and generator `.return()` (stream cancellation):
 * CLOSE the cursor, ROLLBACK, release the connection.
 */
export async function* streamRankedPositions(sql, { batchSize = 500, cursorName } = {}) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5000) {
    throw new RangeError("batchSize must be an integer between 1 and 5000");
  }
  const name = cursorName ?? `waitlyze_rank_${Math.random().toString(36).slice(2, 10)}`;
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  let connected = false;
  let declared = false;
  try {
    await client.connect();
    connected = true;
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const { text, values } = toPgParams(sql);
    await client.query(`DECLARE ${name} NO SCROLL CURSOR FOR ${text}`, values);
    declared = true;
    while (true) {
      const { rows } = await client.query(`FETCH FORWARD ${Number(batchSize)} FROM ${name}`);
      if (rows.length === 0) break;
      yield rows;
      if (rows.length < batchSize) break;
    }
  } finally {
    if (connected) {
      if (declared) await client.query(`CLOSE ${name}`).catch(() => {});
      await client.query("ROLLBACK").catch(() => {});
      await client.end().catch(() => {});
    }
  }
}
