-- DropForeignKey
ALTER TABLE "impressions" DROP CONSTRAINT "impressions_waitListId_fkey";

-- DropForeignKey
ALTER TABLE "sign_ups" DROP CONSTRAINT "sign_ups_waitListId_fkey";

-- DropForeignKey
ALTER TABLE "wait_lists" DROP CONSTRAINT "wait_lists_userId_fkey";

-- AddForeignKey
ALTER TABLE "wait_lists" ADD CONSTRAINT "wait_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impressions" ADD CONSTRAINT "impressions_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
