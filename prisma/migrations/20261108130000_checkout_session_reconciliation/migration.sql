ALTER TABLE "workspace_subscriptions"
ADD COLUMN "checkoutSessionId" TEXT,
ADD COLUMN "checkoutUrlExpiresAt" TIMESTAMP(3),
ADD COLUMN "checkoutCreationStartedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "workspace_subscriptions_checkoutSessionId_key"
ON "workspace_subscriptions"("checkoutSessionId");
