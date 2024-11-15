/*
  Warnings:

  - Added the required column `updatedAt` to the `impressions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `referrals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `sign_ups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "impressions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "referrals" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "sign_ups" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
