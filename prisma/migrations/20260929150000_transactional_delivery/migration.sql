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
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_provider_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_provider_events_providerEventId_key" ON "email_provider_events"("providerEventId");
CREATE INDEX "email_provider_events_providerMessageId_type_idx" ON "email_provider_events"("providerMessageId", "type");
