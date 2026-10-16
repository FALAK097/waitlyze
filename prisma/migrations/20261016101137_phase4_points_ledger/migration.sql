-- CreateEnum
CREATE TYPE "PointLedgerKind" AS ENUM ('SIGNUP_VERIFIED', 'REFERRAL_CREDIT');

-- CreateTable
CREATE TABLE "point_ledger" (
    "id" TEXT NOT NULL,
    "waitListId" TEXT NOT NULL,
    "signUpId" TEXT NOT NULL,
    "kind" "PointLedgerKind" NOT NULL,
    "points" INTEGER NOT NULL,
    "eventKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "point_ledger_eventKey_key" ON "point_ledger"("eventKey");

-- CreateIndex
CREATE INDEX "point_ledger_waitListId_signUpId_idx" ON "point_ledger"("waitListId", "signUpId");
