-- EmployeeBranchCoverage: allow assigning cross-branch coverage per module.

-- CoverageModule enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CoverageModule') THEN
    CREATE TYPE "CoverageModule" AS ENUM ('HR', 'PROCUREMENT', 'MAINTENANCE');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "EmployeeBranchCoverage" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "module" "CoverageModule" NOT NULL,
  "role" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmployeeBranchCoverage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmployeeBranchCoverage_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EmployeeBranchCoverage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeBranchCoverage_employeeId_branchId_module_key" ON "EmployeeBranchCoverage"("employeeId", "branchId", "module");
CREATE INDEX IF NOT EXISTS "EmployeeBranchCoverage_branchId_module_idx" ON "EmployeeBranchCoverage"("branchId", "module");
CREATE INDEX IF NOT EXISTS "EmployeeBranchCoverage_employeeId_module_idx" ON "EmployeeBranchCoverage"("employeeId", "module");
