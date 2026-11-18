ALTER TABLE "wait_lists"
ALTER COLUMN "logoUrl" SET DEFAULT '/apple-icon.png';

UPDATE "wait_lists"
SET "logoUrl" = '/apple-icon.png'
WHERE "logoUrl" = '/images/logo.png';
