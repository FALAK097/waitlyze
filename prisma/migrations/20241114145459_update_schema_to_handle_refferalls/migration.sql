-- AlterTable
ALTER TABLE "sign_ups" ADD COLUMN     "rank" SERIAL;

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "signUpId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_signUpId_fkey" FOREIGN KEY ("signUpId") REFERENCES "sign_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
