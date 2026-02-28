-- CreateEnum
CREATE TYPE "PettyCashSettlementStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCOUNTANT_APPROVED', 'FINANCE_MANAGER_APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PettyCashTopUpStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- AlterTable
ALTER TABLE "FinanceRequest" ADD COLUMN     "pettyCashInitialAmount" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PettyCashSettlement" (
    "id" TEXT NOT NULL,
    "financeRequestId" TEXT NOT NULL,
    "status" "PettyCashSettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "accountantComment" TEXT,
    "financeManagerComment" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashExpenseItem" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "vendor" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashTopUpRequest" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "PettyCashTopUpStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashTopUpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PettyCashSettlement_financeRequestId_key" ON "PettyCashSettlement"("financeRequestId");

-- CreateIndex
CREATE INDEX "PettyCashSettlement_status_idx" ON "PettyCashSettlement"("status");

-- CreateIndex
CREATE INDEX "PettyCashSettlement_createdAt_idx" ON "PettyCashSettlement"("createdAt");

-- CreateIndex
CREATE INDEX "PettyCashExpenseItem_settlementId_idx" ON "PettyCashExpenseItem"("settlementId");

-- CreateIndex
CREATE INDEX "PettyCashTopUpRequest_settlementId_idx" ON "PettyCashTopUpRequest"("settlementId");

-- CreateIndex
CREATE INDEX "PettyCashTopUpRequest_status_idx" ON "PettyCashTopUpRequest"("status");

-- CreateIndex
CREATE INDEX "PettyCashTopUpRequest_requestedById_idx" ON "PettyCashTopUpRequest"("requestedById");

-- AddForeignKey
ALTER TABLE "PettyCashSettlement" ADD CONSTRAINT "PettyCashSettlement_financeRequestId_fkey" FOREIGN KEY ("financeRequestId") REFERENCES "FinanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashExpenseItem" ADD CONSTRAINT "PettyCashExpenseItem_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "PettyCashSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashTopUpRequest" ADD CONSTRAINT "PettyCashTopUpRequest_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "PettyCashSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashTopUpRequest" ADD CONSTRAINT "PettyCashTopUpRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashTopUpRequest" ADD CONSTRAINT "PettyCashTopUpRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
