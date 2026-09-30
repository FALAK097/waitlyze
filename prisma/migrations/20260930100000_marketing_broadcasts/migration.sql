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
