-- Add optimistic edit versions without changing existing public or draft content.
ALTER TABLE "wait_lists" ADD COLUMN "templateRevision" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "wait_list_revisions" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wait_list_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wait_list_revisions_waitListId_revision_key" ON "wait_list_revisions"("waitListId", "revision");
CREATE INDEX "wait_list_revisions_waitListId_createdAt_idx" ON "wait_list_revisions"("waitListId", "createdAt");
ALTER TABLE "wait_list_revisions" ADD CONSTRAINT "wait_list_revisions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
