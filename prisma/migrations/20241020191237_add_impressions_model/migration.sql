/*
  Warnings:

  - Added the required column `impressionId` to the `sign_ups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sign_ups" ADD COLUMN     "impressionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "impressions" (
    "id" TEXT NOT NULL,
    "uniqueUserId" TEXT NOT NULL,
    "device" TEXT,
    "deviceType" TEXT,
    "city" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "ipAddress" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "waitListId" TEXT NOT NULL,

    CONSTRAINT "impressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "impressions_uniqueUserId_key" ON "impressions"("uniqueUserId");

-- AddForeignKey
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_impressionId_fkey" FOREIGN KEY ("impressionId") REFERENCES "impressions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impressions" ADD CONSTRAINT "impressions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
