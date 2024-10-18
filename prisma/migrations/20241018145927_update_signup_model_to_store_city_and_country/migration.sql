/*
  Warnings:

  - You are about to drop the column `region` on the `sign_ups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sign_ups" DROP COLUMN "region",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "timezone" TEXT;
