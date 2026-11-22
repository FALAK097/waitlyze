-- CreateTable: tool_blueprints for Waitlyze Launch Lab anonymous-to-campaign handoff
CREATE TABLE IF NOT EXISTS "tool_blueprints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" INTEGER NOT NULL DEFAULT 1,
    "toolSlug" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "claimedByUserId" TEXT,
    "claimedWaitlistId" TEXT,
    "claimedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tool_blueprints_expiresAt_idx" ON "tool_blueprints"("expiresAt");
CREATE INDEX IF NOT EXISTS "tool_blueprints_toolSlug_createdAt_idx" ON "tool_blueprints"("toolSlug", "createdAt");
CREATE INDEX IF NOT EXISTS "tool_blueprints_claimedWaitlistId_idx" ON "tool_blueprints"("claimedWaitlistId");
