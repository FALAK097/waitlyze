ALTER TABLE "custom_domains" ADD COLUMN "providerId" TEXT;

CREATE UNIQUE INDEX "custom_domains_providerId_key" ON "custom_domains"("providerId");

-- Rows verified by the former host have no Cloudflare hostname. Reset them
-- so every reader (settings, builder, readiness, exports) agrees that their
-- DNS setup is pending instead of showing them active.
UPDATE "custom_domains"
SET "status" = 'NEEDS_DNS'
WHERE "providerId" IS NULL AND "status" = 'ACTIVE';
