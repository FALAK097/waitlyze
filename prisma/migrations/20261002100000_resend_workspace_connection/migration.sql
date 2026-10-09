CREATE TABLE "workspace_integrations" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEEDS_TEST',
  "secretCiphertext" TEXT NOT NULL,
  "secretIv" TEXT NOT NULL,
  "secretTag" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  "lastTestedAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workspace_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_integrations_workspaceId_provider_key" ON "workspace_integrations"("workspaceId", "provider");
CREATE INDEX "workspace_integrations_workspaceId_status_idx" ON "workspace_integrations"("workspaceId", "status");
ALTER TABLE "workspace_integrations" ADD CONSTRAINT "workspace_integrations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
