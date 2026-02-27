-- Create Branch table
CREATE TABLE IF NOT EXISTS "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SCHOOL',
    "commercialRegNo" TEXT,
    "buildingNo" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "geofenceRadius" INTEGER NOT NULL DEFAULT 100,
    "phone" TEXT,
    "email" TEXT,
    "workStartTime" TEXT NOT NULL DEFAULT '07:00',
    "workEndTime" TEXT NOT NULL DEFAULT '14:00',
    "workDays" TEXT NOT NULL DEFAULT '0,1,2,3,4',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Branch_name_idx" ON "Branch"("name");
CREATE INDEX IF NOT EXISTS "Branch_type_idx" ON "Branch"("type");
CREATE INDEX IF NOT EXISTS "Branch_status_idx" ON "Branch"("status");

-- Create Stage table
CREATE TABLE IF NOT EXISTS "Stage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "geofenceRadius" INTEGER NOT NULL DEFAULT 100,
    "workStartTime" TEXT,
    "workEndTime" TEXT,
    "managerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Stage_branchId_idx" ON "Stage"("branchId");
CREATE INDEX IF NOT EXISTS "Stage_name_idx" ON "Stage"("name");
CREATE INDEX IF NOT EXISTS "Stage_managerId_idx" ON "Stage"("managerId");
CREATE INDEX IF NOT EXISTS "Stage_status_idx" ON "Stage"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Stage_branchId_name_key" ON "Stage"("branchId", "name");

-- Add branchId, stageId, employeeRole columns to Employee table
ALTER TABLE "Employee" ADD COLUMN "branchId" TEXT;
ALTER TABLE "Employee" ADD COLUMN "stageId" TEXT;
ALTER TABLE "Employee" ADD COLUMN "employeeRole" TEXT DEFAULT 'EMPLOYEE';

-- Add indices for Employee branch/stage
CREATE INDEX IF NOT EXISTS "Employee_branchId_idx" ON "Employee"("branchId");
CREATE INDEX IF NOT EXISTS "Employee_stageId_idx" ON "Employee"("stageId");

-- Add branchId, stageId, GPS columns to AttendanceRecord table
ALTER TABLE "AttendanceRecord" ADD COLUMN "branchId" TEXT;
ALTER TABLE "AttendanceRecord" ADD COLUMN "stageId" TEXT;
ALTER TABLE "AttendanceRecord" ADD COLUMN "latitude" REAL;
ALTER TABLE "AttendanceRecord" ADD COLUMN "longitude" REAL;
ALTER TABLE "AttendanceRecord" ADD COLUMN "distanceFromBranch" REAL;

-- Add indices for AttendanceRecord branch/stage
CREATE INDEX IF NOT EXISTS "AttendanceRecord_branchId_idx" ON "AttendanceRecord"("branchId");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_stageId_idx" ON "AttendanceRecord"("stageId");
