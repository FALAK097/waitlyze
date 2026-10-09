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
