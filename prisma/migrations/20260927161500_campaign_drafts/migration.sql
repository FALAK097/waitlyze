-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED');

-- AlterTable
ALTER TABLE "wait_lists" ADD COLUMN     "creationKey" TEXT,
ADD COLUMN     "publicSlug" TEXT,
ADD COLUMN     "status" "CampaignStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "templateSnapshot" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "wait_lists_publicSlug_key" ON "wait_lists"("publicSlug");

-- CreateIndex
CREATE INDEX "wait_lists_workspaceId_status_idx" ON "wait_lists"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "wait_lists_workspaceId_creationKey_key" ON "wait_lists"("workspaceId", "creationKey");


-- Preserve existing live waitlists; only future records default to private drafts.
ALTER TABLE "wait_lists" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
