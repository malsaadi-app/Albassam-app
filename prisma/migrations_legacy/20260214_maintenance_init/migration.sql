-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'CORRECTIVE',
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "branchId" TEXT NOT NULL,
    "stageId" TEXT,
    "locationDetails" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imagesJson" TEXT,
    "assetId" TEXT,
    "assignedToId" TEXT,
    "assignedAt" DATETIME,
    "assignedById" TEXT,
    "requestedById" TEXT NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "completedById" TEXT,
    "rating" INTEGER,
    "ratingComment" TEXT,
    "laborHours" REAL,
    "partsCost" REAL,
    "totalCost" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "branchId" TEXT NOT NULL,
    "stageId" TEXT,
    "locationDetails" TEXT NOT NULL,
    "purchaseDate" DATETIME,
    "warrantyStart" DATETIME,
    "warrantyEnd" DATETIME,
    "purchasePrice" REAL,
    "status" TEXT NOT NULL DEFAULT 'GOOD',
    "lastMaintenanceDate" DATETIME,
    "nextMaintenanceDate" DATETIME,
    "maintenanceInterval" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Asset_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceComment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT,
    "assetId" TEXT,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceRequestPart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceRequestPart_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PayrollLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "bankName" TEXT,
    "iban" TEXT,
    "basicSalary" REAL NOT NULL,
    "transportAllowance" REAL NOT NULL,
    "housingAllowance" REAL NOT NULL,
    "otherAllowances" REAL NOT NULL,
    "additions" REAL NOT NULL DEFAULT 0,
    "deductions" REAL NOT NULL DEFAULT 0,
    "totalSalary" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayrollLine_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollLine_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollLineId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollLineItem_payrollLineId_fkey" FOREIGN KEY ("payrollLineId") REFERENCES "PayrollLine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollRecurringItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startAt" DATETIME,
    "endAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollRecurringItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeductionAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "originalAmount" REAL NOT NULL,
    "adjustedAmount" REAL NOT NULL,
    "adjustmentReason" TEXT,
    "ignoredDetails" TEXT,
    "adjustedBy" TEXT NOT NULL,
    "adjustedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeductionAuditLog_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeductionAuditLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME,
    "workHours" REAL,
    "location" TEXT,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "branchId" TEXT,
    "stageId" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "distanceFromBranch" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceRecord" ("branchId", "checkIn", "checkOut", "createdAt", "date", "distanceFromBranch", "id", "latitude", "location", "longitude", "notes", "stageId", "status", "updatedAt", "userId", "workHours") SELECT "branchId", "checkIn", "checkOut", "createdAt", "date", "distanceFromBranch", "id", "latitude", "location", "longitude", "notes", "stageId", "status", "updatedAt", "userId", "workHours" FROM "AttendanceRecord";
DROP TABLE "AttendanceRecord";
ALTER TABLE "new_AttendanceRecord" RENAME TO "AttendanceRecord";
CREATE INDEX "AttendanceRecord_userId_idx" ON "AttendanceRecord"("userId");
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");
CREATE INDEX "AttendanceRecord_branchId_idx" ON "AttendanceRecord"("branchId");
CREATE INDEX "AttendanceRecord_stageId_idx" ON "AttendanceRecord"("stageId");
CREATE UNIQUE INDEX "AttendanceRecord_userId_date_key" ON "AttendanceRecord"("userId", "date");
CREATE TABLE "new_AttendanceSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 15,
    "workHoursPerDay" REAL NOT NULL DEFAULT 8,
    "workingDaysPerMonth" INTEGER NOT NULL DEFAULT 22,
    "workStartTime" TEXT NOT NULL DEFAULT '08:00',
    "workEndTime" TEXT NOT NULL DEFAULT '16:00',
    "requireCheckOut" BOOLEAN NOT NULL DEFAULT true,
    "enableGpsTracking" BOOLEAN NOT NULL DEFAULT false,
    "enableGeofencing" BOOLEAN NOT NULL DEFAULT false,
    "officeLatitude" REAL,
    "officeLongitude" REAL,
    "maxDistanceMeters" INTEGER NOT NULL DEFAULT 500,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AttendanceSettings" ("enableGeofencing", "enableGpsTracking", "id", "lateThresholdMinutes", "maxDistanceMeters", "officeLatitude", "officeLongitude", "requireCheckOut", "updatedAt", "workEndTime", "workHoursPerDay", "workStartTime") SELECT "enableGeofencing", "enableGpsTracking", "id", "lateThresholdMinutes", "maxDistanceMeters", "officeLatitude", "officeLongitude", "requireCheckOut", "updatedAt", "workEndTime", "workHoursPerDay", "workStartTime" FROM "AttendanceSettings";
DROP TABLE "AttendanceSettings";
ALTER TABLE "new_AttendanceSettings" RENAME TO "AttendanceSettings";
CREATE TABLE "new_Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
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
INSERT INTO "new_Branch" ("address", "buildingNo", "city", "commercialRegNo", "createdAt", "email", "geofenceRadius", "id", "latitude", "longitude", "name", "phone", "postalCode", "status", "type", "updatedAt", "workDays", "workEndTime", "workStartTime") SELECT "address", "buildingNo", "city", "commercialRegNo", "createdAt", "email", "geofenceRadius", "id", "latitude", "longitude", "name", "phone", "postalCode", "status", "type", "updatedAt", "workDays", "workEndTime", "workStartTime" FROM "Branch";
DROP TABLE "Branch";
ALTER TABLE "new_Branch" RENAME TO "Branch";
CREATE INDEX "Branch_name_idx" ON "Branch"("name");
CREATE INDEX "Branch_type_idx" ON "Branch"("type");
CREATE INDEX "Branch_status_idx" ON "Branch"("status");
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullNameAr" TEXT NOT NULL,
    "fullNameEn" TEXT,
    "nationalId" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "maritalStatus" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "directManager" TEXT,
    "hireDate" DATETIME NOT NULL,
    "employmentType" TEXT NOT NULL,
    "contractEndDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "basicSalary" REAL NOT NULL,
    "housingAllowance" REAL NOT NULL DEFAULT 0,
    "transportAllowance" REAL NOT NULL DEFAULT 0,
    "otherAllowances" REAL NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "iban" TEXT,
    "education" TEXT,
    "certifications" TEXT,
    "photoUrl" TEXT,
    "userId" TEXT,
    "branchId" TEXT,
    "stageId" TEXT,
    "employeeRole" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "maintenanceRole" TEXT,
    "maintenanceTeam" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Employee_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("address", "bankAccountNumber", "bankName", "basicSalary", "branchId", "certifications", "city", "contractEndDate", "createdAt", "dateOfBirth", "department", "directManager", "education", "email", "employeeNumber", "employeeRole", "employmentType", "fullNameAr", "fullNameEn", "gender", "hireDate", "housingAllowance", "iban", "id", "maritalStatus", "nationalId", "nationality", "otherAllowances", "phone", "photoUrl", "position", "stageId", "status", "transportAllowance", "updatedAt", "userId") SELECT "address", "bankAccountNumber", "bankName", "basicSalary", "branchId", "certifications", "city", "contractEndDate", "createdAt", "dateOfBirth", "department", "directManager", "education", "email", "employeeNumber", coalesce("employeeRole", 'EMPLOYEE') AS "employeeRole", "employmentType", "fullNameAr", "fullNameEn", "gender", "hireDate", "housingAllowance", "iban", "id", "maritalStatus", "nationalId", "nationality", "otherAllowances", "phone", "photoUrl", "position", "stageId", "status", "transportAllowance", "updatedAt", "userId" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_nationalId_key" ON "Employee"("nationalId");
CREATE UNIQUE INDEX "Employee_employeeNumber_key" ON "Employee"("employeeNumber");
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");
CREATE INDEX "Employee_employeeNumber_idx" ON "Employee"("employeeNumber");
CREATE INDEX "Employee_nationalId_idx" ON "Employee"("nationalId");
CREATE INDEX "Employee_status_idx" ON "Employee"("status");
CREATE INDEX "Employee_department_idx" ON "Employee"("department");
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");
CREATE INDEX "Employee_stageId_idx" ON "Employee"("stageId");
CREATE TABLE "new_Stage" (
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
    CONSTRAINT "Stage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Stage_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Stage" ("branchId", "code", "createdAt", "geofenceRadius", "id", "latitude", "longitude", "managerId", "name", "status", "updatedAt", "workEndTime", "workStartTime") SELECT "branchId", "code", "createdAt", "geofenceRadius", "id", "latitude", "longitude", "managerId", "name", "status", "updatedAt", "workEndTime", "workStartTime" FROM "Stage";
DROP TABLE "Stage";
ALTER TABLE "new_Stage" RENAME TO "Stage";
CREATE INDEX "Stage_branchId_idx" ON "Stage"("branchId");
CREATE INDEX "Stage_name_idx" ON "Stage"("name");
CREATE INDEX "Stage_managerId_idx" ON "Stage"("managerId");
CREATE INDEX "Stage_status_idx" ON "Stage"("status");
CREATE UNIQUE INDEX "Stage_branchId_name_key" ON "Stage"("branchId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRequest_requestNumber_key" ON "MaintenanceRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_type_idx" ON "MaintenanceRequest"("type");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_priority_idx" ON "MaintenanceRequest"("priority");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_branchId_idx" ON "MaintenanceRequest"("branchId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_stageId_idx" ON "MaintenanceRequest"("stageId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_assignedToId_idx" ON "MaintenanceRequest"("assignedToId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_requestedById_idx" ON "MaintenanceRequest"("requestedById");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_assetId_idx" ON "MaintenanceRequest"("assetId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_createdAt_idx" ON "MaintenanceRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetNumber_key" ON "Asset"("assetNumber");

-- CreateIndex
CREATE INDEX "Asset_category_idx" ON "Asset"("category");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_branchId_idx" ON "Asset"("branchId");

-- CreateIndex
CREATE INDEX "Asset_stageId_idx" ON "Asset"("stageId");

-- CreateIndex
CREATE INDEX "Asset_serialNumber_idx" ON "Asset"("serialNumber");

-- CreateIndex
CREATE INDEX "MaintenanceComment_requestId_idx" ON "MaintenanceComment"("requestId");

-- CreateIndex
CREATE INDEX "MaintenanceComment_createdAt_idx" ON "MaintenanceComment"("createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_requestId_idx" ON "MaintenanceHistory"("requestId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_assetId_idx" ON "MaintenanceHistory"("assetId");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_action_idx" ON "MaintenanceHistory"("action");

-- CreateIndex
CREATE INDEX "MaintenanceHistory_createdAt_idx" ON "MaintenanceHistory"("createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceRequestPart_requestId_idx" ON "MaintenanceRequestPart"("requestId");

-- CreateIndex
CREATE INDEX "PayrollRun_status_idx" ON "PayrollRun"("status");

-- CreateIndex
CREATE INDEX "PayrollRun_createdAt_idx" ON "PayrollRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_year_month_key" ON "PayrollRun"("year", "month");

-- CreateIndex
CREATE INDEX "PayrollLine_employeeId_idx" ON "PayrollLine"("employeeId");

-- CreateIndex
CREATE INDEX "PayrollLine_payrollRunId_idx" ON "PayrollLine"("payrollRunId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollLine_payrollRunId_employeeId_key" ON "PayrollLine"("payrollRunId", "employeeId");

-- CreateIndex
CREATE INDEX "PayrollLineItem_payrollLineId_idx" ON "PayrollLineItem"("payrollLineId");

-- CreateIndex
CREATE INDEX "PayrollLineItem_kind_idx" ON "PayrollLineItem"("kind");

-- CreateIndex
CREATE INDEX "PayrollRecurringItem_employeeId_idx" ON "PayrollRecurringItem"("employeeId");

-- CreateIndex
CREATE INDEX "PayrollRecurringItem_active_idx" ON "PayrollRecurringItem"("active");

-- CreateIndex
CREATE INDEX "DeductionAuditLog_payrollRunId_idx" ON "DeductionAuditLog"("payrollRunId");

-- CreateIndex
CREATE INDEX "DeductionAuditLog_employeeId_idx" ON "DeductionAuditLog"("employeeId");

-- CreateIndex
CREATE INDEX "DeductionAuditLog_adjustedAt_idx" ON "DeductionAuditLog"("adjustedAt");

