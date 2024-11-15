/*
  Warnings:

  - A unique constraint covering the columns `[uniqueUserId]` on the table `sign_ups` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uniqueUserId` to the `sign_ups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sign_ups" ADD COLUMN     "uniqueUserId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sign_ups_uniqueUserId_key" ON "sign_ups"("uniqueUserId");
