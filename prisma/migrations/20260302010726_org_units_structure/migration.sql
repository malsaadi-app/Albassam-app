-- CreateEnum
CREATE TYPE "OrgUnitType" AS ENUM ('SCHOOL', 'STAGE', 'DEPARTMENT', 'SUB_DEPARTMENT');

-- CreateEnum
CREATE TYPE "OrgAssignmentType" AS ENUM ('ADMIN', 'FUNCTIONAL');

-- CreateEnum
CREATE TYPE "OrgAssignmentRole" AS ENUM ('HEAD', 'SUPERVISOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "OrgCoverageScope" AS ENUM ('BRANCH', 'MULTI_BRANCH', 'ALL');

-- CreateTable
CREATE TABLE "OrgUnit" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "type" "OrgUnitType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUnitAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "assignmentType" "OrgAssignmentType" NOT NULL,
    "role" "OrgAssignmentRole" NOT NULL DEFAULT 'MEMBER',
    "coverageScope" "OrgCoverageScope" NOT NULL DEFAULT 'BRANCH',
    "coverageBranchIds" TEXT,
    "weightPercent" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgUnitAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgUnit_branchId_idx" ON "OrgUnit"("branchId");

-- CreateIndex
CREATE INDEX "OrgUnit_parentId_idx" ON "OrgUnit"("parentId");

-- CreateIndex
CREATE INDEX "OrgUnit_type_idx" ON "OrgUnit"("type");

-- CreateIndex
CREATE UNIQUE INDEX "OrgUnit_branchId_parentId_name_type_key" ON "OrgUnit"("branchId", "parentId", "name", "type");

-- CreateIndex
CREATE INDEX "OrgUnitAssignment_employeeId_idx" ON "OrgUnitAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "OrgUnitAssignment_orgUnitId_idx" ON "OrgUnitAssignment"("orgUnitId");

-- CreateIndex
CREATE INDEX "OrgUnitAssignment_assignmentType_idx" ON "OrgUnitAssignment"("assignmentType");

-- CreateIndex
CREATE UNIQUE INDEX "OrgUnitAssignment_employeeId_orgUnitId_assignmentType_key" ON "OrgUnitAssignment"("employeeId", "orgUnitId", "assignmentType");

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUnitAssignment" ADD CONSTRAINT "OrgUnitAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUnitAssignment" ADD CONSTRAINT "OrgUnitAssignment_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
