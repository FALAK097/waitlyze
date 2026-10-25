-- Phase 6 stream B: workspace plan (history windows), per-waitlist pipeline
-- stage labels, and per-signup pipeline stage. Fully additive: new columns
-- carry defaults so existing rows keep their behavior untouched.
ALTER TABLE "workspaces" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'FREE';

ALTER TABLE "wait_lists" ADD COLUMN "pipelineStages" JSONB;

ALTER TABLE "sign_ups" ADD COLUMN "pipelineStage" TEXT NOT NULL DEFAULT 'WAITLIST';

CREATE INDEX "sign_ups_waitListId_pipelineStage_idx" ON "sign_ups"("waitListId", "pipelineStage");
