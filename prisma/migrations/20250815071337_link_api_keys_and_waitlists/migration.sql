-- DropIndex
DROP INDEX "api_keys_keyHash_idx";

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "waitlistId" TEXT;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "wait_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
