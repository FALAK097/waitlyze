ALTER TABLE "custom_domains" ADD COLUMN "providerId" TEXT;

CREATE UNIQUE INDEX "custom_domains_providerId_key" ON "custom_domains"("providerId");
