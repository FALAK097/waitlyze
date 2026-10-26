-- Phase 7c: per-waitlist BYOK sender identity + Slack/Discord notification channels.
-- Fresh-only additive tables; no changes to existing tables.
CREATE TABLE "waitlist_email_senders" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_TEST',
    "secretCiphertext" TEXT NOT NULL,
    "secretIv" TEXT NOT NULL,
    "secretTag" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "lastTestedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_email_senders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "waitlist_email_senders_waitListId_key" ON "waitlist_email_senders"("waitListId");

ALTER TABLE "waitlist_email_senders" ADD CONSTRAINT "waitlist_email_senders_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "waitlist_notification_channels" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_TEST',
    "secretCiphertext" TEXT NOT NULL,
    "secretIv" TEXT NOT NULL,
    "secretTag" TEXT NOT NULL,
    "lastTestedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_notification_channels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "waitlist_notification_channels_waitListId_provider_key" ON "waitlist_notification_channels"("waitListId", "provider");
CREATE INDEX "waitlist_notification_channels_waitListId_status_idx" ON "waitlist_notification_channels"("waitListId", "status");

ALTER TABLE "waitlist_notification_channels" ADD CONSTRAINT "waitlist_notification_channels_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
