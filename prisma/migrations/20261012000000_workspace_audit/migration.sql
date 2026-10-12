-- Workspace audit events for the settings Audit log.
CREATE TABLE "workspace_audit_events" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "resourceName" TEXT,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_audit_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "workspace_audit_events_workspaceId_createdAt_idx" ON "workspace_audit_events"("workspaceId", "createdAt");
ALTER TABLE "workspace_audit_events" ADD CONSTRAINT "workspace_audit_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_audit_events" ADD CONSTRAINT "workspace_audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
