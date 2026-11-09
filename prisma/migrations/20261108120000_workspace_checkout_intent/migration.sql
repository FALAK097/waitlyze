ALTER TABLE "workspace_subscriptions"
ADD COLUMN "checkoutIntentId" TEXT,
ADD COLUMN "checkoutInterval" "WorkspaceBillingInterval",
ADD COLUMN "checkoutUrl" TEXT,
ADD COLUMN "checkoutPendingUntil" TIMESTAMP(3);

CREATE UNIQUE INDEX "workspace_subscriptions_checkoutIntentId_key"
ON "workspace_subscriptions"("checkoutIntentId");
