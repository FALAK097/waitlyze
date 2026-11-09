ALTER TABLE "workspaces"
ADD COLUMN "signupUsageCount" INTEGER NOT NULL DEFAULT 0;

-- Preserve the current workspace signup usage when migrating from the former
-- live-row count. Future deletions must not replenish Free-plan capacity.
UPDATE "workspaces" AS workspace
SET "signupUsageCount" = usage.count
FROM (
  SELECT wait_list."workspaceId", COUNT(*)::INTEGER AS count
  FROM "sign_ups" AS signup
  JOIN "wait_lists" AS wait_list ON wait_list."id" = signup."waitListId"
  WHERE wait_list."workspaceId" IS NOT NULL
  GROUP BY wait_list."workspaceId"
) AS usage
WHERE workspace."id" = usage."workspaceId";
