CREATE TYPE "CustomDomainStatus" AS ENUM ('NEEDS_DNS', 'VERIFYING', 'ACTIVE', 'NEEDS_ATTENTION');

CREATE TABLE "custom_domains" (
  "id" TEXT NOT NULL,
  "hostname" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "waitListId" TEXT NOT NULL,
  "status" "CustomDomainStatus" NOT NULL DEFAULT 'NEEDS_DNS',
  "verification" JSONB,
  "dnsRecords" JSONB,
  "lastCheckedAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custom_domains_hostname_key" ON "custom_domains"("hostname");
CREATE UNIQUE INDEX "custom_domains_waitListId_key" ON "custom_domains"("waitListId");
CREATE INDEX "custom_domains_workspaceId_status_idx" ON "custom_domains"("workspaceId", "status");
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
