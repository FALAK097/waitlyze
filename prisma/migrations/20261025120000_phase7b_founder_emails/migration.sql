-- Phase 7b: founder email builder, template set, automation v1, broadcast segments + scheduling.
ALTER TYPE "EmailTemplateType" ADD VALUE 'REFERRAL_CONGRATS';
ALTER TYPE "EmailTemplateType" ADD VALUE 'LAUNCH_INVITE';
ALTER TYPE "AutomationRecipeType" ADD VALUE 'WELCOME_FOLLOWUP';
ALTER TYPE "AutomationRecipeType" ADD VALUE 'LAUNCH_COUNTDOWN';
ALTER TYPE "BroadcastStatus" ADD VALUE 'SCHEDULED';
ALTER TABLE "marketing_broadcasts" ADD COLUMN "segment" TEXT NOT NULL DEFAULT 'ALL';
ALTER TABLE "marketing_broadcasts" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "broadcast_recipients" ADD COLUMN "vars" JSONB;
