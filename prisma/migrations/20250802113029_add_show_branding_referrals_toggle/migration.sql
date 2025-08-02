/*
  Warnings:

  - You are about to drop the column `enableReferrals` on the `wait_lists` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wait_lists" DROP COLUMN "enableReferrals",
ADD COLUMN     "showBranding" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showReferrals" BOOLEAN NOT NULL DEFAULT true;
