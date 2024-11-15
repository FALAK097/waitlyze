/*
  Warnings:

  - You are about to drop the column `referralId` on the `referrals` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[signUpId]` on the table `referrals` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "referrals" DROP COLUMN "referralId",
ADD COLUMN     "referredById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "referrals_signUpId_key" ON "referrals"("signUpId");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "sign_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
