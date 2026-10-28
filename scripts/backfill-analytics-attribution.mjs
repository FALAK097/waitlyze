import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { Prisma, PrismaClient } from "../src/generated/prisma/client.ts";
import { getCanonicalAttribution } from "../src/utils/server/attribution.mjs";

const DEFAULT_BATCH_SIZE = 200;
const MAX_BATCH_SIZE = 500;

function parseArguments(args) {
  let batchSize = DEFAULT_BATCH_SIZE;
  let apply = false;

  for (const argument of args) {
    if (argument === "--apply") {
      apply = true;
      continue;
    }
    const batchMatch = argument.match(/^--batch-size=(\d+)$/);
    if (batchMatch) {
      batchSize = Number(batchMatch[1]);
      continue;
    }
    throw new Error(`Unknown option: ${argument}`);
  }

  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE) {
    throw new Error(`Batch size must be between 1 and ${MAX_BATCH_SIZE}.`);
  }

  return { apply, batchSize };
}

function attributionFields(row) {
  return getCanonicalAttribution({
    utmMedium: row.utmMedium,
    utmSource: row.utmSource,
    referrer: row.referrer,
  });
}

async function backfillModel(prisma, model, table, batchSize, apply) {
  let cursor = undefined;
  let scanned = 0;
  let updated = 0;

  while (true) {
    const rows = await model.findMany({
      where: {
        attributionChannel: null,
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: "asc" },
      take: batchSize,
      select: {
        id: true,
        referrer: true,
        utmMedium: true,
        utmSource: true,
      },
    });
    if (rows.length === 0) break;

    scanned += rows.length;
    cursor = rows.at(-1).id;

    if (!apply) continue;

    const values = rows.map((row) => {
      const canonical = attributionFields(row);
      return Prisma.sql`(${row.id}::text, ${canonical.attributionChannel}::text, ${canonical.referrerHost}::text)`;
    });
    updated += await prisma.$executeRaw(Prisma.sql`
      UPDATE ${Prisma.raw(`"${table}"`)} AS target
      SET "attributionChannel" = source.channel,
          "referrerHost" = source.host
      FROM (VALUES ${Prisma.join(values)}) AS source(id, channel, host)
      WHERE target.id = source.id
        AND target."attributionChannel" IS NULL
    `);
  }

  return { scanned, updated };
}

const { apply, batchSize } = parseArguments(process.argv.slice(2));
if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is required. Load the intended environment before running this script.",
  );
  process.exitCode = 1;
} else {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    if (!apply) {
      console.log(
        "Dry run only. No rows were changed. Pass --apply to backfill missing canonical attribution.",
      );
    }

    for (const [name, model] of [
      ["impressions", prisma.impression],
      ["signups", prisma.signUp],
    ]) {
      const result = await backfillModel(
        prisma,
        model,
        name === "impressions" ? "impressions" : "sign_ups",
        batchSize,
        apply,
      );
      console.log(
        `${name}: ${apply ? "updated" : "pending"} ${apply ? result.updated : result.scanned} of ${result.scanned} scanned`,
      );
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
