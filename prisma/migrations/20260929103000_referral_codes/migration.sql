ALTER TABLE "sign_ups"
ADD COLUMN "referralCode" TEXT NOT NULL DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX "sign_ups_referralCode_key"
ON "sign_ups"("referralCode");

CREATE INDEX "sign_ups_waitListId_uniqueUserId_idx"
ON "sign_ups"("waitListId", "uniqueUserId");
