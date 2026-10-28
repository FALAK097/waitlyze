ALTER TABLE "impressions"
ADD COLUMN "attributionChannel" TEXT,
ADD COLUMN "referrerHost" TEXT;

ALTER TABLE "sign_ups"
ADD COLUMN "attributionChannel" TEXT,
ADD COLUMN "referrerHost" TEXT;
