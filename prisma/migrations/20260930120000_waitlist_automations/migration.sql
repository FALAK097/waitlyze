CREATE TYPE "AutomationRecipeType" AS ENUM ('WELCOME', 'REFERRAL_REMINDER', 'REFERRAL_MILESTONE');
CREATE TYPE "AutomationRecipeStatus" AS ENUM ('DRAFT', 'ENABLED', 'PAUSED');
CREATE TYPE "AutomationRunStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'SKIPPED', 'FAILED', 'CANCELED');
CREATE TYPE "AutomationStepStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'SKIPPED', 'FAILED', 'CANCELED');

CREATE TABLE "automation_recipes" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "type" "AutomationRecipeType" NOT NULL,
    "status" "AutomationRecipeStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "automation_recipes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "automation_recipe_versions" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_recipe_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "recipeVersionId" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "signUpId" TEXT NOT NULL,
    "triggerKey" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "skipReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "automation_run_steps" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "AutomationStepStatus" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3) NOT NULL,
    "outboxEventKey" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "automation_run_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "automation_recipes_waitListId_type_key" ON "automation_recipes"("waitListId", "type");
CREATE INDEX "automation_recipes_waitListId_status_idx" ON "automation_recipes"("waitListId", "status");
CREATE UNIQUE INDEX "automation_recipe_versions_recipeId_version_key" ON "automation_recipe_versions"("recipeId", "version");
CREATE UNIQUE INDEX "automation_runs_recipeId_triggerKey_key" ON "automation_runs"("recipeId", "triggerKey");
CREATE INDEX "automation_runs_waitListId_createdAt_idx" ON "automation_runs"("waitListId", "createdAt");
CREATE INDEX "automation_runs_status_scheduledAt_idx" ON "automation_runs"("status", "scheduledAt");
CREATE UNIQUE INDEX "automation_run_steps_outboxEventKey_key" ON "automation_run_steps"("outboxEventKey");
CREATE UNIQUE INDEX "automation_run_steps_runId_stepKey_key" ON "automation_run_steps"("runId", "stepKey");
CREATE INDEX "automation_run_steps_runId_position_idx" ON "automation_run_steps"("runId", "position");
CREATE INDEX "automation_run_steps_status_availableAt_idx" ON "automation_run_steps"("status", "availableAt");

ALTER TABLE "automation_recipes" ADD CONSTRAINT "automation_recipes_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_recipe_versions" ADD CONSTRAINT "automation_recipe_versions_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "automation_recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_recipeVersionId_fkey" FOREIGN KEY ("recipeVersionId") REFERENCES "automation_recipe_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "automation_recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_signUpId_fkey" FOREIGN KEY ("signUpId") REFERENCES "sign_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_run_steps" ADD CONSTRAINT "automation_run_steps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "automation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
