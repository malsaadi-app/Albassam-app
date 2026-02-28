-- AlterTable
ALTER TABLE "FinanceRequest" ADD COLUMN     "accountantComment" TEXT,
ADD COLUMN     "accountantUserId" TEXT,
ADD COLUMN     "attachments" TEXT,
ADD COLUMN     "currentStep" TEXT NOT NULL DEFAULT 'DEPARTMENT_MANAGER',
ADD COLUMN     "department" TEXT,
ADD COLUMN     "departmentManagerComment" TEXT,
ADD COLUMN     "departmentManagerUserId" TEXT,
ADD COLUMN     "financeManagerComment" TEXT,
ADD COLUMN     "financeManagerUserId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "FinanceRequest_currentStep_idx" ON "FinanceRequest"("currentStep");

-- CreateIndex
CREATE INDEX "FinanceRequest_departmentManagerUserId_idx" ON "FinanceRequest"("departmentManagerUserId");

-- CreateIndex
CREATE INDEX "FinanceRequest_accountantUserId_idx" ON "FinanceRequest"("accountantUserId");

-- CreateIndex
CREATE INDEX "FinanceRequest_financeManagerUserId_idx" ON "FinanceRequest"("financeManagerUserId");

-- AddForeignKey
ALTER TABLE "FinanceRequest" ADD CONSTRAINT "FinanceRequest_departmentManagerUserId_fkey" FOREIGN KEY ("departmentManagerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRequest" ADD CONSTRAINT "FinanceRequest_accountantUserId_fkey" FOREIGN KEY ("accountantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRequest" ADD CONSTRAINT "FinanceRequest_financeManagerUserId_fkey" FOREIGN KEY ("financeManagerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
