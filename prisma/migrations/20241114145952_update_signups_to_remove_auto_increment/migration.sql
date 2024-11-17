-- AlterTable
ALTER TABLE "sign_ups" ALTER COLUMN "rank" DROP NOT NULL,
ALTER COLUMN "rank" DROP DEFAULT;
DROP SEQUENCE "sign_ups_rank_seq";
