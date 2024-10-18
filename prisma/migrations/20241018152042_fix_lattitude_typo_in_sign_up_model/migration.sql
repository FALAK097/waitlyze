/*
  Warnings:

  - You are about to drop the column `lattitude` on the `sign_ups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sign_ups" DROP COLUMN "lattitude",
ADD COLUMN     "latitude" TEXT;
