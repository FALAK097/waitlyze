/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification_tokens` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[clerkUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clerkUserId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
DROP COLUMN "image",
DROP COLUMN "name",
ADD COLUMN     "clerkUserId" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastName" TEXT;

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "sessions";

-- DropTable
DROP TABLE "verification_tokens";

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");
