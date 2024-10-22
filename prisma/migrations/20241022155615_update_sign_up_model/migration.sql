-- DropForeignKey
ALTER TABLE "sign_ups" DROP CONSTRAINT "sign_ups_impressionId_fkey";

-- AlterTable
ALTER TABLE "sign_ups" ALTER COLUMN "impressionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_impressionId_fkey" FOREIGN KEY ("impressionId") REFERENCES "impressions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
