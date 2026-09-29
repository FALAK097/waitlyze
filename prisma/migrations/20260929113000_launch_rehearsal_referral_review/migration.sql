CREATE TYPE "ReferralReviewStatus" AS ENUM ('CLEAR', 'NEEDS_REVIEW', 'APPROVED', 'EXCLUDED');
CREATE TYPE "LaunchRehearsalStatus" AS ENUM ('PASSED', 'NEEDS_ATTENTION');

ALTER TABLE "referrals"
  ADD COLUMN "reviewStatus" "ReferralReviewStatus" NOT NULL DEFAULT 'CLEAR',
  ADD COLUMN "reviewReason" TEXT,
  ADD COLUMN "resolution" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedById" TEXT;

DROP INDEX IF EXISTS "referrals_referredById_idx";
CREATE INDEX "referrals_referredById_reviewStatus_idx" ON "referrals"("referredById", "reviewStatus");

CREATE TABLE "launch_rehearsal_runs" (
  "id" TEXT NOT NULL,
  "waitListId" TEXT NOT NULL,
  "status" "LaunchRehearsalStatus" NOT NULL,
  "checksPassed" INTEGER NOT NULL,
  "checksFailed" INTEGER NOT NULL,
  "checkResults" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "launch_rehearsal_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "launch_rehearsal_runs_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "launch_rehearsal_runs_waitListId_createdAt_idx" ON "launch_rehearsal_runs"("waitListId", "createdAt");
