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
