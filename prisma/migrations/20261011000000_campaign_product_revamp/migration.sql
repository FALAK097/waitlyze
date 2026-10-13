-- PR #89 campaign-first product migration. The two main migrations remain unchanged.
-- Apply schema and legacy-data changes atomically.
BEGIN;


-- 20260927120000_workspace_expand
-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "wait_lists" ADD COLUMN     "workspaceId" TEXT;

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personalOwnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspaceId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_personalOwnerId_key" ON "workspaces"("personalOwnerId");

-- CreateIndex
CREATE INDEX "workspace_members_userId_workspaceId_idx" ON "workspace_members"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "wait_lists_workspaceId_id_idx" ON "wait_lists"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "wait_lists_userId_workspaceId_idx" ON "wait_lists"("userId", "workspaceId");

-- AddForeignKey
ALTER TABLE "wait_lists" ADD CONSTRAINT "wait_lists_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_personalOwnerId_fkey" FOREIGN KEY ("personalOwnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Existing users receive a personal workspace and OWNER membership during
-- deployment, so no separate operator backfill is needed. UUID text IDs are
-- valid Prisma String IDs; later application-created records continue using cuid.
INSERT INTO "workspaces" ("id", "name", "personalOwnerId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Personal workspace', "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users";

INSERT INTO "workspace_members" ("workspaceId", "userId", "role")
SELECT "id", "personalOwnerId", 'OWNER'::"WorkspaceRole"
FROM "workspaces" WHERE "personalOwnerId" IS NOT NULL;

UPDATE "wait_lists" AS campaign
SET "workspaceId" = workspace."id"
FROM "workspaces" AS workspace
WHERE campaign."userId" = workspace."personalOwnerId"
  AND campaign."workspaceId" IS NULL;


-- 20260927161500_campaign_drafts
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


-- 20260928100000_waitlist_revisions
-- Add optimistic edit versions without changing existing public or draft content.
ALTER TABLE "wait_lists" ADD COLUMN "templateRevision" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "wait_list_revisions" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wait_list_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wait_list_revisions_waitListId_revision_key" ON "wait_list_revisions"("waitListId", "revision");
CREATE INDEX "wait_list_revisions_waitListId_createdAt_idx" ON "wait_list_revisions"("waitListId", "createdAt");
ALTER TABLE "wait_list_revisions" ADD CONSTRAINT "wait_list_revisions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 20260928120000_waitlist_publications
-- Keep immutable public snapshots separate from the editable page draft.
ALTER TABLE "wait_lists" ADD COLUMN "publishedRevision" INTEGER;
ALTER TABLE "wait_lists" ADD COLUMN "publishedTemplateRevision" INTEGER;

CREATE TABLE "wait_list_publication_revisions" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "templateRevision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wait_list_publication_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wait_list_publication_revisions_waitListId_revision_key" ON "wait_list_publication_revisions"("waitListId", "revision");
CREATE INDEX "wait_list_publication_revisions_waitListId_createdAt_idx" ON "wait_list_publication_revisions"("waitListId", "createdAt");
ALTER TABLE "wait_list_publication_revisions" ADD CONSTRAINT "wait_list_publication_revisions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 20260928140000_signup_verification_outbox
-- Preserve old records while reserving normalized addresses for one canonical
-- record per campaign. The earliest record wins; historical duplicates remain
-- visible but cannot block new normalized signups.
ALTER TABLE "sign_ups" ADD COLUMN "emailNormalized" TEXT;
ALTER TABLE "sign_ups" ADD COLUMN "verifiedAt" TIMESTAMP(3);

WITH ranked AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "waitListId", lower(btrim("email"))
    ORDER BY "createdAt" ASC, "id" ASC
  ) AS position
  FROM "sign_ups"
)
UPDATE "sign_ups" AS signup
SET "emailNormalized" = CASE WHEN ranked.position = 1 THEN lower(btrim(signup."email")) ELSE NULL END,
    "verifiedAt" = signup."createdAt"
FROM ranked
WHERE ranked."id" = signup."id";

CREATE UNIQUE INDEX "sign_ups_waitListId_emailNormalized_key"
  ON "sign_ups"("waitListId", "emailNormalized");

CREATE TABLE "sign_up_verifications" (
  "id" TEXT NOT NULL,
  "signUpId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sign_up_verifications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sign_up_verifications_signUpId_key" ON "sign_up_verifications"("signUpId");
CREATE UNIQUE INDEX "sign_up_verifications_tokenHash_key" ON "sign_up_verifications"("tokenHash");
CREATE INDEX "sign_up_verifications_expiresAt_idx" ON "sign_up_verifications"("expiresAt");
ALTER TABLE "sign_up_verifications"
  ADD CONSTRAINT "sign_up_verifications_signUpId_fkey"
  FOREIGN KEY ("signUpId") REFERENCES "sign_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED');
CREATE TABLE "outbox_events" (
  "id" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "outbox_events_eventKey_key" ON "outbox_events"("eventKey");
CREATE INDEX "outbox_events_status_availableAt_idx" ON "outbox_events"("status", "availableAt");


-- 20260929100000_verified_referral_positions
-- Support campaign-scoped deterministic position lookups without updating every
-- signup whenever a referral is accepted or verified.
CREATE INDEX "sign_ups_waitListId_createdAt_id_idx"
  ON "sign_ups"("waitListId", "createdAt", "id");

CREATE INDEX "referrals_referredById_idx"
  ON "referrals"("referredById");


-- 20260929103000_referral_codes
ALTER TABLE "sign_ups"
ADD COLUMN "referralCode" TEXT NOT NULL DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX "sign_ups_referralCode_key"
ON "sign_ups"("referralCode");

CREATE INDEX "sign_ups_waitListId_uniqueUserId_idx"
ON "sign_ups"("waitListId", "uniqueUserId");


-- 20260929113000_launch_rehearsal_referral_review
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


-- 20260929150000_transactional_delivery
ALTER TABLE "outbox_events"
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "waitListId" TEXT,
  ADD COLUMN "providerMessageId" TEXT,
  ADD COLUMN "lastErrorCode" TEXT;

UPDATE "outbox_events"
SET "waitListId" = "payload"->>'waitListId'
WHERE "waitListId" IS NULL AND jsonb_typeof("payload") = 'object';

CREATE INDEX "outbox_events_status_lockedAt_idx" ON "outbox_events"("status", "lockedAt");

CREATE TABLE "email_suppressions" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "emailNormalized" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_suppressions_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "email_suppressions_workspaceId_emailNormalized_key"
  ON "email_suppressions"("workspaceId", "emailNormalized");
CREATE INDEX "email_suppressions_workspaceId_createdAt_idx"
  ON "email_suppressions"("workspaceId", "createdAt");

CREATE TABLE "email_provider_events" (
  "id" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "providerMessageId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "isPermanent" BOOLEAN NOT NULL DEFAULT false,
  "recipientEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_provider_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_provider_events_providerEventId_key" ON "email_provider_events"("providerEventId");
CREATE INDEX "email_provider_events_providerMessageId_type_idx" ON "email_provider_events"("providerMessageId", "type");


-- 20260930100000_marketing_broadcasts
ALTER TABLE "sign_ups"
  ADD COLUMN "marketingConsentAt" TIMESTAMP(3),
  ADD COLUMN "marketingUnsubscribedAt" TIMESTAMP(3),
  ADD COLUMN "unsubscribeTokenHash" TEXT;

CREATE UNIQUE INDEX "sign_ups_unsubscribeTokenHash_key"
  ON "sign_ups"("unsubscribeTokenHash");

CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'CANCELED', 'FAILED');
CREATE TYPE "BroadcastRecipientStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'SKIPPED', 'CANCELED');

CREATE TABLE "marketing_broadcasts" (
  "id" TEXT NOT NULL,
  "waitListId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "previewText" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "marketing_broadcasts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "marketing_broadcasts_waitListId_fkey"
    FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "marketing_broadcasts_waitListId_updatedAt_idx"
  ON "marketing_broadcasts"("waitListId", "updatedAt");

CREATE TABLE "broadcast_recipients" (
  "id" TEXT NOT NULL,
  "broadcastId" TEXT NOT NULL,
  "signUpId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailNormalized" TEXT NOT NULL,
  "status" "BroadcastRecipientStatus" NOT NULL DEFAULT 'PENDING',
  "providerMessageId" TEXT,
  "lastErrorCode" TEXT,
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "broadcast_recipients_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "broadcast_recipients_broadcastId_fkey"
    FOREIGN KEY ("broadcastId") REFERENCES "marketing_broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "broadcast_recipients_signUpId_fkey"
    FOREIGN KEY ("signUpId") REFERENCES "sign_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "broadcast_recipients_broadcastId_signUpId_key"
  ON "broadcast_recipients"("broadcastId", "signUpId");
CREATE INDEX "broadcast_recipients_broadcastId_status_idx"
  ON "broadcast_recipients"("broadcastId", "status");

CREATE TYPE "MarketingConsentAction" AS ENUM ('OPTED_IN', 'OPTED_OUT');
CREATE TYPE "MarketingConsentSource" AS ENUM ('PUBLIC_SIGNUP', 'PUBLIC_UNSUBSCRIBE');

CREATE TABLE "marketing_consent_events" (
  "id" TEXT NOT NULL,
  "waitListId" TEXT NOT NULL,
  "signUpId" TEXT NOT NULL,
  "action" "MarketingConsentAction" NOT NULL,
  "source" "MarketingConsentSource" NOT NULL,
  "consentText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketing_consent_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "marketing_consent_events_waitListId_fkey"
    FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "marketing_consent_events_signUpId_fkey"
    FOREIGN KEY ("signUpId") REFERENCES "sign_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "marketing_consent_events_signUpId_createdAt_idx"
  ON "marketing_consent_events"("signUpId", "createdAt");
CREATE INDEX "marketing_consent_events_waitListId_createdAt_idx"
  ON "marketing_consent_events"("waitListId", "createdAt");


-- 20260930120000_waitlist_automations
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


-- 20260930180000_waitlist_scoped_api_keys
ALTER TABLE "api_keys"
  ADD COLUMN "keyId" TEXT,
  ADD COLUMN "scopes" TEXT[] NOT NULL DEFAULT ARRAY['waitlist:write']::TEXT[],
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "lastUsedAt" TIMESTAMP(3),
  ADD COLUMN "revokedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "api_keys_keyId_key" ON "api_keys"("keyId");
CREATE INDEX "api_keys_waitlistId_revokedAt_idx" ON "api_keys"("waitlistId", "revokedAt");


-- 20261001100000_signed_webhooks
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'PAUSED');

CREATE TABLE "webhook_subscriptions" (
  "id" TEXT NOT NULL,
  "waitListId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "eventTypes" TEXT[] NOT NULL DEFAULT ARRAY['signup.created']::TEXT[],
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "secretCiphertext" TEXT NOT NULL,
  "secretIv" TEXT NOT NULL,
  "secretTag" TEXT NOT NULL,
  "previousSecretCiphertext" TEXT,
  "previousSecretIv" TEXT,
  "previousSecretTag" TEXT,
  "previousSecretValidUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastDeliveredAt" TIMESTAMP(3),
  CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_deliveries" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "replayCount" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "responseStatus" INTEGER,
  "lastErrorCode" TEXT,
  CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webhook_deliveries_eventKey_key" ON "webhook_deliveries"("eventKey");
CREATE INDEX "webhook_subscriptions_waitListId_enabled_idx" ON "webhook_subscriptions"("waitListId", "enabled");
CREATE INDEX "webhook_deliveries_status_availableAt_idx" ON "webhook_deliveries"("status", "availableAt");
CREATE INDEX "webhook_deliveries_status_lockedAt_idx" ON "webhook_deliveries"("status", "lockedAt");
CREATE INDEX "webhook_deliveries_subscriptionId_createdAt_idx" ON "webhook_deliveries"("subscriptionId", "createdAt");

ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "webhook_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 20261002100000_resend_workspace_connection
CREATE TABLE "workspace_integrations" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEEDS_TEST',
  "secretCiphertext" TEXT NOT NULL,
  "secretIv" TEXT NOT NULL,
  "secretTag" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  "lastTestedAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workspace_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_integrations_workspaceId_provider_key" ON "workspace_integrations"("workspaceId", "provider");
CREATE INDEX "workspace_integrations_workspaceId_status_idx" ON "workspace_integrations"("workspaceId", "status");
ALTER TABLE "workspace_integrations" ADD CONSTRAINT "workspace_integrations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 20261003100000_custom_domains
CREATE TYPE "CustomDomainStatus" AS ENUM ('NEEDS_DNS', 'VERIFYING', 'ACTIVE', 'NEEDS_ATTENTION');

CREATE TABLE "custom_domains" (
  "id" TEXT NOT NULL,
  "hostname" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "waitListId" TEXT NOT NULL,
  "status" "CustomDomainStatus" NOT NULL DEFAULT 'NEEDS_DNS',
  "verification" JSONB,
  "dnsRecords" JSONB,
  "lastCheckedAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custom_domains_hostname_key" ON "custom_domains"("hostname");
CREATE UNIQUE INDEX "custom_domains_waitListId_key" ON "custom_domains"("waitListId");
CREATE INDEX "custom_domains_workspaceId_status_idx" ON "custom_domains"("workspaceId", "status");
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 20261003143000_add_waitlist_timestamps
ALTER TABLE "wait_lists"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;


-- 20261003170000_workspace_invitations
CREATE TYPE "WorkspaceInvitationStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REVOKED',
  'EXPIRED',
  'SEND_FAILED'
);

CREATE TABLE "workspace_invitations" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "emailNormalized" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
  "tokenHash" TEXT NOT NULL,
  "tokenCiphertext" TEXT NOT NULL,
  "tokenIv" TEXT NOT NULL,
  "tokenTag" TEXT NOT NULL,
  "status" "WorkspaceInvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "acceptedByUserId" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workspace_invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "workspace_invitations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "workspace_invitations_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "workspace_invitations_tokenHash_key" ON "workspace_invitations"("tokenHash");
CREATE INDEX "workspace_invitations_workspaceId_status_createdAt_idx" ON "workspace_invitations"("workspaceId", "status", "createdAt");
CREATE UNIQUE INDEX "workspace_invitations_active_email_key" ON "workspace_invitations"("workspaceId", "emailNormalized") WHERE "status" IN ('PENDING', 'SEND_FAILED');

-- Keep updatedAt managed by Prisma after backfilling existing records.
ALTER TABLE "wait_lists" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Shared public abuse limits must survive requests to different app instances.
CREATE TABLE "rate_limit_buckets" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "rate_limit_buckets_expiresAt_idx" ON "rate_limit_buckets"("expiresAt");

COMMIT;
