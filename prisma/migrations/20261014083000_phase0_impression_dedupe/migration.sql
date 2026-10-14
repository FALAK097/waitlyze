-- CreateIndex
CREATE UNIQUE INDEX "impressions_waitListId_uniqueUserId_key" ON "impressions"("waitListId", "uniqueUserId");
