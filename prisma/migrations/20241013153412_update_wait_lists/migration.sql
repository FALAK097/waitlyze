/*
  Warnings:

  - You are about to drop the column `backgroundColor` on the `wait_lists` table. All the data in the column will be lost.
  - You are about to drop the column `borderColor` on the `wait_lists` table. All the data in the column will be lost.
  - You are about to drop the column `buttonFontColor` on the `wait_lists` table. All the data in the column will be lost.
  - You are about to drop the column `fontColor` on the `wait_lists` table. All the data in the column will be lost.
  - You are about to drop the column `signUpButtonText` on the `wait_lists` table. All the data in the column will be lost.
  - You are about to drop the column `submitButtonColor` on the `wait_lists` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `wait_lists` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `wait_lists` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wait_lists" DROP COLUMN "backgroundColor",
DROP COLUMN "borderColor",
DROP COLUMN "buttonFontColor",
DROP COLUMN "fontColor",
DROP COLUMN "signUpButtonText",
DROP COLUMN "submitButtonColor",
DROP COLUMN "title",
DROP COLUMN "url",
ADD COLUMN     "bgColor" TEXT,
ADD COLUMN     "borderRadius" TEXT,
ADD COLUMN     "borderWidth" TEXT,
ADD COLUMN     "buttonBorder" TEXT,
ADD COLUMN     "buttonColor" TEXT,
ADD COLUMN     "buttonText" TEXT,
ADD COLUMN     "buttonTextColor" TEXT,
ADD COLUMN     "enableReferrals" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fontWeight" TEXT,
ADD COLUMN     "inputBorder" TEXT,
ADD COLUMN     "inputColor" TEXT,
ADD COLUMN     "inputTextColor" TEXT,
ADD COLUMN     "logoSize" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "placeholderText" TEXT,
ADD COLUMN     "showLogo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showSocialProof" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "successMessage" TEXT,
ADD COLUMN     "websiteUrl" TEXT;
