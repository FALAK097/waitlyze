-- CreateTable
CREATE TABLE "share_events" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "share_events_waitListId_createdAt_idx" ON "share_events"("waitListId", "createdAt");

-- AddForeignKey
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
