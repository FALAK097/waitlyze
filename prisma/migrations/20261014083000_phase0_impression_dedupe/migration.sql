-- Deduplicate pre-existing impressions: keep the earliest row per
-- (waitListId, uniqueUserId), repoint signups at the kept row, drop the rest.
WITH ranked AS (
  SELECT id, "waitListId", "uniqueUserId",
    ROW_NUMBER() OVER (
      PARTITION BY "waitListId", "uniqueUserId"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM impressions
)
UPDATE sign_ups AS s
SET "impressionId" = keeper.id
FROM ranked AS dup
JOIN ranked AS keeper
  ON keeper."waitListId" = dup."waitListId"
  AND keeper."uniqueUserId" = dup."uniqueUserId"
  AND keeper.rn = 1
WHERE s."impressionId" = dup.id
  AND dup.rn > 1
  AND keeper.id <> dup.id;

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY "waitListId", "uniqueUserId"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM impressions
)
DELETE FROM impressions AS dup
USING ranked AS r
WHERE dup.id = r.id AND r.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "impressions_waitListId_uniqueUserId_key" ON "impressions"("waitListId", "uniqueUserId");
