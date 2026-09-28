import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { createWorkspaceService } from "../src/lib/workspaces/service.mjs";

// No dotenv import: the operator must explicitly select the destination.
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL explicitly; no .env is loaded.");
const apply = process.argv.includes("--apply");
if (process.argv.slice(2).some((arg) => arg !== "--apply")) throw new Error("Usage: backfill-workspaces.mjs [--apply]");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  let cursor;
  let processed = 0;
  const service = createWorkspaceService(db);
  if (apply) {
    while (true) {
      const users = await db.user.findMany({ take: 100, orderBy: { id: "asc" }, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: { id: true } });
      if (!users.length) break;
      for (const user of users) { await service.ensurePersonal(user.id); processed++; }
      cursor = users.at(-1).id;
    }
  }
  const unlinked = await db.waitList.count({ where: { workspaceId: null } });
  const missingPersonal = await db.user.count({ where: { personalWorkspace: null } });
  const [ownership] = await db.$queryRaw`SELECT COUNT(*)::int AS count FROM workspaces w
    WHERE w."personalOwnerId" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM workspace_members m WHERE m."workspaceId" = w.id
      AND m."userId" = w."personalOwnerId" AND m.role = 'OWNER'
    )`;
  console.log(JSON.stringify({ invalidPersonalOwnership: ownership.count, mode: apply ? "apply" : "report", processed, unlinkedCampaigns: unlinked, usersWithoutPersonalWorkspace: missingPersonal }));
  if (apply && (unlinked || missingPersonal || ownership.count)) process.exitCode = 1;
} finally {
  await db.$disconnect();
}
