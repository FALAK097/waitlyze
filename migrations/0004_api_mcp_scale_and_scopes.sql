-- Workspace-scoped API keys and production load indexes for ranking, analytics, and outbox lookups.
ALTER TABLE "api_keys" ADD COLUMN "workspaceId" TEXT REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "api_keys_workspaceId_revokedAt_idx" ON "api_keys"("workspaceId", "revokedAt");
CREATE INDEX IF NOT EXISTS "api_keys_userId_revokedAt_idx" ON "api_keys"("userId", "revokedAt");
CREATE INDEX IF NOT EXISTS "sign_ups_waitListId_verifiedAt_idx" ON "sign_ups"("waitListId", "verifiedAt");
CREATE INDEX IF NOT EXISTS "sign_ups_waitListId_points_id_idx" ON "sign_ups"("waitListId", "points", "id");
CREATE INDEX IF NOT EXISTS "referrals_reviewStatus_createdAt_idx" ON "referrals"("reviewStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "outbox_events_waitListId_type_status_createdAt_idx" ON "outbox_events"("waitListId", "type", "status", "createdAt");
