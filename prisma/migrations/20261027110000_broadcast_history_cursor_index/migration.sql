-- Replace the prefix index with the composite order used by broadcast history keyset paging.
DROP INDEX "marketing_broadcasts_waitListId_updatedAt_idx";
CREATE INDEX "marketing_broadcasts_waitListId_updatedAt_id_idx"
  ON "marketing_broadcasts"("waitListId", "updatedAt", "id");
