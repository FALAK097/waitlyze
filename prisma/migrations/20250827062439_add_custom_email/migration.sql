-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('SIGNUP', 'OFFBOARDING');

-- AlterTable
ALTER TABLE "sign_ups" ADD COLUMN     "signUpEmailSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "type" "EmailTemplateType" NOT NULL,
    "subject" TEXT NOT NULL,
    "previewText" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "subHeader" TEXT NOT NULL,
    "mainBody" TEXT NOT NULL,
    "subBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_waitListId_type_key" ON "email_templates"("waitListId", "type");

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
