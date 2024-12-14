-- AlterTable
ALTER TABLE "wait_lists" ADD COLUMN     "enableBgColor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableMainBgColor" BOOLEAN NOT NULL DEFAULT false;
