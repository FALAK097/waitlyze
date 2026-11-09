-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "WorkspaceBillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "WorkspaceBillingStatus" AS ENUM ('FREE', 'ACTIVE', 'PAST_DUE', 'ON_HOLD', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "workspace_subscriptions" (
    "workspaceId" TEXT NOT NULL,
    "plan" "WorkspacePlan" NOT NULL DEFAULT 'FREE',
    "status" "WorkspaceBillingStatus" NOT NULL DEFAULT 'FREE',
    "interval" "WorkspaceBillingInterval",
    "dodoCustomerId" TEXT,
    "dodoSubscriptionId" TEXT,
    "dodoProductId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "pastDueEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_subscriptions_pkey" PRIMARY KEY ("workspaceId")
);

-- CreateTable
CREATE TABLE "dodo_webhook_receipts" (
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "workspaceId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dodo_webhook_receipts_pkey" PRIMARY KEY ("webhookId")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_subscriptions_dodoSubscriptionId_key" ON "workspace_subscriptions"("dodoSubscriptionId");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_status_currentPeriodEnd_idx" ON "workspace_subscriptions"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_dodoCustomerId_idx" ON "workspace_subscriptions"("dodoCustomerId");

-- CreateIndex
CREATE INDEX "dodo_webhook_receipts_workspaceId_processedAt_idx" ON "dodo_webhook_receipts"("workspaceId", "processedAt");

-- AddForeignKey
ALTER TABLE "workspace_subscriptions" ADD CONSTRAINT "workspace_subscriptions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
