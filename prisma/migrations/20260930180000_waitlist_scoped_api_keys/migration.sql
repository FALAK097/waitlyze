ALTER TABLE "api_keys"
  ADD COLUMN "keyId" TEXT,
  ADD COLUMN "scopes" TEXT[] NOT NULL DEFAULT ARRAY['waitlist:write']::TEXT[],
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "lastUsedAt" TIMESTAMP(3),
  ADD COLUMN "revokedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "api_keys_keyId_key" ON "api_keys"("keyId");
CREATE INDEX "api_keys_waitlistId_revokedAt_idx" ON "api_keys"("waitlistId", "revokedAt");
