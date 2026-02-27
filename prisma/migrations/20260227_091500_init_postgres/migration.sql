-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('SCHOOL', 'INSTITUTE', 'COMPANY');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MaintenanceTeam" AS ENUM ('BUILDING', 'IT');

-- CreateEnum
CREATE TYPE "MaintenanceRole" AS ENUM ('BUILDING_MANAGER', 'IT_MANAGER', 'BUILDING_TECH', 'IT_TECH');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('BUILDING', 'ELECTRONICS');

-- CreateEnum
CREATE TYPE "MaintenanceKind" AS ENUM ('CORRECTIVE', 'EMERGENCY', 'PREVENTIVE');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('NORMAL', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED_PENDING_CONFIRMATION', 'COMPLETED', 'CANCELLED', 'REJECTED', 'ON_HOLD', 'REOPENED');

-- CreateEnum
CREATE TYPE "MaintenanceHistoryAction" AS ENUM ('CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'COMMENT_ADDED', 'PART_ADDED', 'COMPLETED', 'RATED', 'ASSET_LINKED', 'ASSET_UNLINKED');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('ELECTRONICS', 'BUILDING_EQUIPMENT');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('GOOD', 'NEEDS_MAINTENANCE', 'BROKEN', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('EMPLOYEE', 'TEACHER', 'SUPERVISOR', 'COUNSELOR', 'DEPUTY', 'STAGE_MANAGER', 'BRANCH_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR_EMPLOYEE', 'USER');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('TRANSACTIONS', 'HR');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ON_HOLD', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('PERMANENT', 'TEMPORARY', 'CONTRACT');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'CASUAL', 'EMERGENCY', 'MATERNITY', 'HAJJ', 'UNPAID');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'ID', 'PASSPORT', 'CERTIFICATE', 'EXPERIENCE_LETTER', 'MEDICAL_REPORT', 'INSURANCE', 'WARNING_LETTER', 'PROMOTION_LETTER', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('LEAVE', 'UNPAID_LEAVE', 'TICKET_ALLOWANCE', 'FLIGHT_BOOKING', 'SALARY_CERTIFICATE', 'HOUSING_ALLOWANCE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING_REVIEW', 'RETURNED', 'PENDING_APPROVAL', 'FINANCE_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'EXCUSED');

-- CreateEnum
CREATE TYPE "PurchaseCategory" AS ENUM ('STATIONERY', 'CLEANING', 'MAINTENANCE', 'FOOD', 'EQUIPMENT', 'TECHNOLOGY', 'FURNITURE', 'TEXTBOOKS', 'UNIFORMS', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('PENDING_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttendanceRequestType" AS ENUM ('EXCUSE', 'PERMISSION', 'CORRECTION');

-- CreateEnum
CREATE TYPE "AttendanceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING', 'APPROVED', 'SENT', 'CONFIRMED', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('PENDING', 'INSPECTED', 'ACCEPTED', 'REJECTED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGE');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'LOCKED');

-- CreateEnum
CREATE TYPE "PayrollLineItemKind" AS ENUM ('ADDITION', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "WorkflowLevel" AS ENUM ('STAGE', 'DEPARTMENT', 'COMPANY');

-- CreateEnum
CREATE TYPE "WorkflowApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "WorkflowApproverType" AS ENUM ('SPECIFIC_USER', 'ROLE', 'DIRECT_MANAGER', 'SYSTEM_ROLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "roleId" TEXT,
    "passwordHash" TEXT NOT NULL,
    "telegramId" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyOverdue" BOOLEAN NOT NULL DEFAULT true,
    "notifyDueSoon" BOOLEAN NOT NULL DEFAULT true,
    "notifyDailySummary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TaskCategory" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'NEW',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT,
    "dueDate" TIMESTAMP(3),
    "checklist" TEXT,
    "dependsOn" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TaskCategory" NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "checklist" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullNameAr" TEXT NOT NULL,
    "fullNameEn" TEXT,
    "nationalId" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "departmentId" TEXT,
    "jobTitleId" TEXT,
    "directManager" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "contractEndDate" TIMESTAMP(3),
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "housingAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherAllowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "iban" TEXT,
    "education" TEXT,
    "specialization" TEXT,
    "certifications" TEXT,
    "photoUrl" TEXT,
    "userId" TEXT,
    "systemRoleId" TEXT,
    "branchId" TEXT,
    "stageId" TEXT,
    "employeeRole" "EmployeeRole" NOT NULL DEFAULT 'EMPLOYEE',
    "morningGraceMinutes" INTEGER,
    "maintenanceRole" "MaintenanceRole",
    "maintenanceTeam" "MaintenanceTeam",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "annualTotal" INTEGER NOT NULL DEFAULT 30,
    "annualUsed" INTEGER NOT NULL DEFAULT 0,
    "annualRemaining" INTEGER NOT NULL DEFAULT 30,
    "casualTotal" INTEGER NOT NULL DEFAULT 5,
    "casualUsed" INTEGER NOT NULL DEFAULT 0,
    "casualRemaining" INTEGER NOT NULL DEFAULT 5,
    "emergencyTotal" INTEGER NOT NULL DEFAULT 0,
    "emergencyUsed" INTEGER NOT NULL DEFAULT 0,
    "emergencyRemaining" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "category" TEXT,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HRRequest" (
    "id" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "currentWorkflowStep" INTEGER,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "leaveType" TEXT,
    "destination" TEXT,
    "travelDate" TIMESTAMP(3),
    "departureDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "period" TEXT,
    "purpose" TEXT,
    "recipientOrganization" TEXT,
    "reason" TEXT,
    "attachment" TEXT,
    "attachments" TEXT,
    "reviewedBy" TEXT,
    "reviewComment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvalComment" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HRRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HRRequestAuditLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT,
    "diffJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HRRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HRDelegation" (
    "id" TEXT NOT NULL,
    "delegateToUserId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startNotifiedAt" TIMESTAMP(3),
    "endNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HRDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "relatedId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplacementRequest" (
    "id" SERIAL NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "positionId" INTEGER NOT NULL,
    "currentEmployeeId" TEXT NOT NULL,
    "newEmployeeId" TEXT NOT NULL,
    "probationStartDate" TIMESTAMP(3) NOT NULL,
    "probationEndDate" TIMESTAMP(3) NOT NULL,
    "probationMonths" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "evaluationScore" INTEGER,
    "evaluationNotes" TEXT,
    "evaluatedByUserId" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "decision" TEXT,
    "decisionReason" TEXT,
    "decisionByUserId" TEXT,
    "decisionAt" TIMESTAMP(3),
    "replacementReason" TEXT NOT NULL,
    "expectedImprovement" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplacementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplacementNotification" (
    "id" SERIAL NOT NULL,
    "replacementId" INTEGER NOT NULL,
    "notificationType" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "recipientUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplacementNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplacementPerformanceReport" (
    "id" SERIAL NOT NULL,
    "replacementId" INTEGER NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportPeriod" TEXT NOT NULL,
    "currentEmployeeScore" INTEGER,
    "currentEmployeeNotes" TEXT,
    "newEmployeeScore" INTEGER,
    "newEmployeeNotes" TEXT,
    "comparisonNotes" TEXT,
    "recommendation" TEXT,
    "reportedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplacementPerformanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplacementTimeline" (
    "id" SERIAL NOT NULL,
    "replacementId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDescription" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplacementTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationalPosition" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "department" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VACANT',
    "currentEmployeeId" TEXT,
    "inReplacement" BOOLEAN NOT NULL DEFAULT false,
    "activeReplacementId" INTEGER,
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "description" TEXT,
    "requirements" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedBy" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedReason" TEXT,
    "approvalDocument" TEXT,
    "approvalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationalPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentHeadcount" (
    "id" SERIAL NOT NULL,
    "department" TEXT NOT NULL,
    "approvedCount" INTEGER NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "approvalDocument" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentHeadcount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeadcountChangeRequest" (
    "id" SERIAL NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "departmentHeadcountId" INTEGER NOT NULL,
    "requestType" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL,
    "requestedCount" INTEGER NOT NULL,
    "changeAmount" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "approvalDocument" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeadcountChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionHistory" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "employeeId" TEXT,
    "performedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionOpeningRequest" (
    "id" SERIAL NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "approvalDocument" TEXT NOT NULL,
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdPositionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionOpeningRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "fullNameAr" TEXT,
    "fullNameEn" TEXT,
    "nationalId" TEXT,
    "nationality" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "maritalStatus" TEXT,
    "applicantPhone" TEXT,
    "applicantEmail" TEXT,
    "address" TEXT,
    "city" TEXT,
    "education" TEXT,
    "certifications" TEXT,
    "experience" TEXT,
    "coverLetter" TEXT,
    "department" TEXT,
    "positionId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT DEFAULT 'INTERNAL',
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "kind" "MaintenanceKind" NOT NULL DEFAULT 'CORRECTIVE',
    "category" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "branchId" TEXT NOT NULL,
    "stageId" TEXT,
    "locationDetails" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imagesJson" TEXT,
    "assetId" TEXT,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "assignedById" TEXT,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "rating" INTEGER,
    "ratingComment" TEXT,
    "laborHours" DOUBLE PRECISION,
    "partsCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "branchId" TEXT NOT NULL,
    "stageId" TEXT,
    "locationDetails" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "warrantyStart" TIMESTAMP(3),
    "warrantyEnd" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "status" "AssetStatus" NOT NULL DEFAULT 'GOOD',
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "maintenanceInterval" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceComment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "assetId" TEXT,
    "action" "MaintenanceHistoryAction" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequestPart" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceRequestPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BranchType" NOT NULL,
    "commercialRegNo" TEXT,
    "buildingNo" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geofenceRadius" INTEGER NOT NULL DEFAULT 100,
    "phone" TEXT,
    "email" TEXT,
    "workStartTime" TEXT NOT NULL DEFAULT '07:00',
    "workEndTime" TEXT NOT NULL DEFAULT '14:00',
    "workDays" TEXT NOT NULL DEFAULT '0,1,2,3,4',
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geofenceRadius" INTEGER NOT NULL DEFAULT 100,
    "workStartTime" TEXT,
    "workEndTime" TEXT,
    "managerId" TEXT,
    "deputyId" TEXT,
    "status" "StageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3),
    "workHours" DOUBLE PRECISION,
    "location" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "branchId" TEXT,
    "stageId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "distanceFromBranch" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSettings" (
    "id" TEXT NOT NULL,
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 15,
    "workHoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "workingDaysPerMonth" INTEGER NOT NULL DEFAULT 22,
    "workStartTime" TEXT NOT NULL DEFAULT '08:00',
    "workEndTime" TEXT NOT NULL DEFAULT '16:00',
    "requireCheckOut" BOOLEAN NOT NULL DEFAULT true,
    "enableGpsTracking" BOOLEAN NOT NULL DEFAULT false,
    "enableGeofencing" BOOLEAN NOT NULL DEFAULT false,
    "officeLatitude" DOUBLE PRECISION,
    "officeLongitude" DOUBLE PRECISION,
    "maxDistanceMeters" INTEGER NOT NULL DEFAULT 500,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "category" "PurchaseCategory" NOT NULL,
    "items" TEXT NOT NULL,
    "priority" "PurchasePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "currentWorkflowStep" INTEGER,
    "justification" TEXT,
    "attachments" TEXT,
    "estimatedBudget" DOUBLE PRECISION,
    "requiredDate" TIMESTAMP(3),
    "supplierId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "category" TEXT,
    "taxNumber" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "quotedItems" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "validUntil" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "deliveryTime" TEXT,
    "notes" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'PENDING',
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementCategoryWorkflow" (
    "id" TEXT NOT NULL,
    "category" "PurchaseCategory" NOT NULL,
    "reviewerUserId" TEXT,
    "approverUserId" TEXT,
    "requireReview" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "reviewTimeoutDays" INTEGER NOT NULL DEFAULT 3,
    "approvalTimeoutDays" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ProcurementCategoryWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementWorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "statusName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementWorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HRWorkflowSettings" (
    "id" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "approverUserId" TEXT,
    "requireReview" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveLeave" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveTravel" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveSalary" BOOLEAN NOT NULL DEFAULT false,
    "reviewTimeoutDays" INTEGER NOT NULL DEFAULT 3,
    "approvalTimeoutDays" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "HRWorkflowSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HRRequestTypeWorkflow" (
    "id" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "reviewerUserId" TEXT,
    "approverUserId" TEXT,
    "requireReview" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "reviewTimeoutDays" INTEGER NOT NULL DEFAULT 3,
    "approvalTimeoutDays" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "HRRequestTypeWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HRWorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "statusName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HRWorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AttendanceRequestType" NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AttendanceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "attachment" TEXT,
    "attendanceRecordId" TEXT,
    "originalCheckIn" TIMESTAMP(3),
    "originalCheckOut" TIMESTAMP(3),
    "requestedCheckIn" TIMESTAMP(3),
    "requestedCheckOut" TIMESTAMP(3),
    "correctionType" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TIMESTAMP(3),
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "items" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalAmount" DOUBLE PRECISION NOT NULL,
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "notes" TEXT,
    "attachments" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedBy" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "qualityCheck" BOOLEAN NOT NULL DEFAULT false,
    "qualityNotes" TEXT,
    "damageReport" TEXT,
    "attachments" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxStock" DOUBLE PRECISION,
    "location" TEXT,
    "lastRestockDate" TIMESTAMP(3),
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "movementType" "StockMovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION,
    "reference" TEXT,
    "goodsReceiptId" TEXT,
    "notes" TEXT,
    "movedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollLine" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "bankName" TEXT,
    "iban" TEXT,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "transportAllowance" DOUBLE PRECISION NOT NULL,
    "housingAllowance" DOUBLE PRECISION NOT NULL,
    "otherAllowances" DOUBLE PRECISION NOT NULL,
    "additions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSalary" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollLineItem" (
    "id" TEXT NOT NULL,
    "payrollLineId" TEXT NOT NULL,
    "kind" "PayrollLineItemKind" NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRecurringItem" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "kind" "PayrollLineItemKind" NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollRecurringItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionAuditLog" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "adjustedAmount" DOUBLE PRECISION NOT NULL,
    "adjustmentReason" TEXT,
    "ignoredDetails" TEXT,
    "adjustedBy" TEXT NOT NULL,
    "adjustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeductionAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "headId" TEXT,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTitle" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "category" TEXT,
    "suggestedRoleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "PermissionAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "roleId" TEXT,
    "roleName" TEXT,
    "permissionId" TEXT,
    "permissionName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "beneficiaryName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requesterId" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "forHRType" TEXT,
    "forSpecificType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowBranch" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStage" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "level" "WorkflowLevel" NOT NULL,
    "approverType" "WorkflowApproverType" NOT NULL DEFAULT 'ROLE',
    "approverUserId" TEXT,
    "workflowRoleId" TEXT,
    "approverSystemRole" TEXT,
    "condition" TEXT,
    "allowReject" BOOLEAN NOT NULL DEFAULT true,
    "autoEscalateDays" INTEGER,
    "notifyOnEntry" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnApproval" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnReject" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRole" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "level" "WorkflowLevel" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowApprovalLog" (
    "id" TEXT NOT NULL,
    "workflowStepId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "WorkflowApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowReferral" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "referredToId" TEXT NOT NULL,
    "referredById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "response" TEXT,
    "priority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowReferral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "User_telegramId_idx" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "Task_ownerId_idx" ON "Task"("ownerId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_category_idx" ON "Task"("category");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Comment_taskId_idx" ON "Comment"("taskId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_taskId_idx" ON "ActivityLog"("taskId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nationalId_key" ON "Employee"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNumber_key" ON "Employee"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_employeeNumber_idx" ON "Employee"("employeeNumber");

-- CreateIndex
CREATE INDEX "Employee_nationalId_idx" ON "Employee"("nationalId");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "Employee_department_idx" ON "Employee"("department");

-- CreateIndex
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");

-- CreateIndex
CREATE INDEX "Employee_stageId_idx" ON "Employee"("stageId");

-- CreateIndex
CREATE INDEX "Leave_employeeId_idx" ON "Leave"("employeeId");

-- CreateIndex
CREATE INDEX "Leave_status_idx" ON "Leave"("status");

-- CreateIndex
CREATE INDEX "Leave_type_idx" ON "Leave"("type");

-- CreateIndex
CREATE INDEX "Leave_startDate_idx" ON "Leave"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_employeeId_key" ON "LeaveBalance"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveBalance_employeeId_idx" ON "LeaveBalance"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveBalance_year_idx" ON "LeaveBalance"("year");

-- CreateIndex
CREATE INDEX "Document_employeeId_idx" ON "Document"("employeeId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_expiryDate_idx" ON "Document"("expiryDate");

-- CreateIndex
CREATE INDEX "HRRequest_employeeId_idx" ON "HRRequest"("employeeId");

-- CreateIndex
CREATE INDEX "HRRequest_status_idx" ON "HRRequest"("status");

-- CreateIndex
CREATE INDEX "HRRequest_type_idx" ON "HRRequest"("type");

-- CreateIndex
CREATE INDEX "HRRequest_createdAt_idx" ON "HRRequest"("createdAt");

-- CreateIndex
CREATE INDEX "HRRequest_currentWorkflowStep_idx" ON "HRRequest"("currentWorkflowStep");

-- CreateIndex
CREATE INDEX "HRRequestAuditLog_requestId_idx" ON "HRRequestAuditLog"("requestId");

-- CreateIndex
CREATE INDEX "HRRequestAuditLog_actorUserId_idx" ON "HRRequestAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "HRRequestAuditLog_createdAt_idx" ON "HRRequestAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "HRDelegation_delegateToUserId_idx" ON "HRDelegation"("delegateToUserId");

-- CreateIndex
CREATE INDEX "HRDelegation_active_idx" ON "HRDelegation"("active");

-- CreateIndex
CREATE INDEX "HRDelegation_startAt_idx" ON "HRDelegation"("startAt");

-- CreateIndex
CREATE INDEX "HRDelegation_endAt_idx" ON "HRDelegation"("endAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReplacementRequest_requestNumber_key" ON "ReplacementRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "ReplacementRequest_positionId_idx" ON "ReplacementRequest"("positionId");

-- CreateIndex
CREATE INDEX "ReplacementRequest_status_idx" ON "ReplacementRequest"("status");

-- CreateIndex
CREATE INDEX "ReplacementRequest_probationEndDate_idx" ON "ReplacementRequest"("probationEndDate");

-- CreateIndex
CREATE INDEX "ReplacementNotification_replacementId_idx" ON "ReplacementNotification"("replacementId");

-- CreateIndex
CREATE INDEX "ReplacementNotification_recipientUserId_idx" ON "ReplacementNotification"("recipientUserId");

-- CreateIndex
CREATE INDEX "ReplacementNotification_sent_idx" ON "ReplacementNotification"("sent");

-- CreateIndex
CREATE INDEX "ReplacementNotification_scheduledFor_idx" ON "ReplacementNotification"("scheduledFor");

-- CreateIndex
CREATE INDEX "ReplacementPerformanceReport_replacementId_idx" ON "ReplacementPerformanceReport"("replacementId");

-- CreateIndex
CREATE INDEX "ReplacementPerformanceReport_reportDate_idx" ON "ReplacementPerformanceReport"("reportDate");

-- CreateIndex
CREATE INDEX "ReplacementPerformanceReport_reportedByUserId_idx" ON "ReplacementPerformanceReport"("reportedByUserId");

-- CreateIndex
CREATE INDEX "ReplacementTimeline_replacementId_idx" ON "ReplacementTimeline"("replacementId");

-- CreateIndex
CREATE INDEX "ReplacementTimeline_createdAt_idx" ON "ReplacementTimeline"("createdAt");

-- CreateIndex
CREATE INDEX "ReplacementTimeline_eventType_idx" ON "ReplacementTimeline"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationalPosition_code_key" ON "OrganizationalPosition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationalPosition_currentEmployeeId_key" ON "OrganizationalPosition"("currentEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationalPosition_activeReplacementId_key" ON "OrganizationalPosition"("activeReplacementId");

-- CreateIndex
CREATE INDEX "OrganizationalPosition_department_idx" ON "OrganizationalPosition"("department");

-- CreateIndex
CREATE INDEX "OrganizationalPosition_status_idx" ON "OrganizationalPosition"("status");

-- CreateIndex
CREATE INDEX "OrganizationalPosition_level_idx" ON "OrganizationalPosition"("level");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentHeadcount_department_key" ON "DepartmentHeadcount"("department");

-- CreateIndex
CREATE INDEX "DepartmentHeadcount_department_idx" ON "DepartmentHeadcount"("department");

-- CreateIndex
CREATE UNIQUE INDEX "HeadcountChangeRequest_requestNumber_key" ON "HeadcountChangeRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "HeadcountChangeRequest_department_idx" ON "HeadcountChangeRequest"("department");

-- CreateIndex
CREATE INDEX "HeadcountChangeRequest_status_idx" ON "HeadcountChangeRequest"("status");

-- CreateIndex
CREATE INDEX "HeadcountChangeRequest_requestedAt_idx" ON "HeadcountChangeRequest"("requestedAt");

-- CreateIndex
CREATE INDEX "PositionHistory_positionId_idx" ON "PositionHistory"("positionId");

-- CreateIndex
CREATE INDEX "PositionHistory_createdAt_idx" ON "PositionHistory"("createdAt");

-- CreateIndex
CREATE INDEX "PositionHistory_action_idx" ON "PositionHistory"("action");

-- CreateIndex
CREATE UNIQUE INDEX "PositionOpeningRequest_requestNumber_key" ON "PositionOpeningRequest"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PositionOpeningRequest_createdPositionId_key" ON "PositionOpeningRequest"("createdPositionId");

-- CreateIndex
CREATE INDEX "PositionOpeningRequest_department_idx" ON "PositionOpeningRequest"("department");

-- CreateIndex
CREATE INDEX "PositionOpeningRequest_status_idx" ON "PositionOpeningRequest"("status");

-- CreateIndex
CREATE INDEX "PositionOpeningRequest_requestedAt_idx" ON "PositionOpeningRequest"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_applicationNumber_key" ON "JobApplication"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_nationalId_key" ON "JobApplication"("nationalId");

-- CreateIndex
CREATE INDEX "JobApplication_department_idx" ON "JobApplication"("department");

-- CreateIndex
CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");

-- CreateIndex
CREATE INDEX "JobApplication_positionId_idx" ON "JobApplication"("positionId");

-- CreateIndex
CREATE INDEX "JobApplication_createdAt_idx" ON "JobApplication"("createdAt");

-- CreateIndex
CREATE INDEX "JobApplication_nationalId_idx" ON "JobApplication"("nationalId");

-- CreateIndex
CREATE INDEX "JobApplication_source_idx" ON "JobApplication"("source");

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
CREATE INDEX "Branch_name_idx" ON "Branch"("name");

-- CreateIndex
CREATE INDEX "Branch_type_idx" ON "Branch"("type");

-- CreateIndex
CREATE INDEX "Branch_status_idx" ON "Branch"("status");

-- CreateIndex
CREATE INDEX "Stage_branchId_idx" ON "Stage"("branchId");

-- CreateIndex
CREATE INDEX "Stage_name_idx" ON "Stage"("name");

-- CreateIndex
CREATE INDEX "Stage_managerId_idx" ON "Stage"("managerId");

-- CreateIndex
CREATE INDEX "Stage_status_idx" ON "Stage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_branchId_name_key" ON "Stage"("branchId", "name");

-- CreateIndex
CREATE INDEX "AttendanceRecord_userId_idx" ON "AttendanceRecord"("userId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_branchId_idx" ON "AttendanceRecord"("branchId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_stageId_idx" ON "AttendanceRecord"("stageId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_userId_date_idx" ON "AttendanceRecord"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_requestNumber_key" ON "PurchaseRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequest_requestedById_idx" ON "PurchaseRequest"("requestedById");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequest_category_idx" ON "PurchaseRequest"("category");

-- CreateIndex
CREATE INDEX "PurchaseRequest_createdAt_idx" ON "PurchaseRequest"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseRequest_supplierId_idx" ON "PurchaseRequest"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_currentWorkflowStep_idx" ON "PurchaseRequest"("currentWorkflowStep");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_purchaseRequestId_idx" ON "Quotation"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "Quotation_supplierId_idx" ON "Quotation"("supplierId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementCategoryWorkflow_category_key" ON "ProcurementCategoryWorkflow"("category");

-- CreateIndex
CREATE INDEX "ProcurementCategoryWorkflow_category_idx" ON "ProcurementCategoryWorkflow"("category");

-- CreateIndex
CREATE INDEX "ProcurementCategoryWorkflow_reviewerUserId_idx" ON "ProcurementCategoryWorkflow"("reviewerUserId");

-- CreateIndex
CREATE INDEX "ProcurementCategoryWorkflow_approverUserId_idx" ON "ProcurementCategoryWorkflow"("approverUserId");

-- CreateIndex
CREATE INDEX "ProcurementWorkflowStep_workflowId_idx" ON "ProcurementWorkflowStep"("workflowId");

-- CreateIndex
CREATE INDEX "ProcurementWorkflowStep_order_idx" ON "ProcurementWorkflowStep"("order");

-- CreateIndex
CREATE INDEX "ProcurementWorkflowStep_userId_idx" ON "ProcurementWorkflowStep"("userId");

-- CreateIndex
CREATE INDEX "HRWorkflowSettings_reviewerUserId_idx" ON "HRWorkflowSettings"("reviewerUserId");

-- CreateIndex
CREATE INDEX "HRWorkflowSettings_approverUserId_idx" ON "HRWorkflowSettings"("approverUserId");

-- CreateIndex
CREATE UNIQUE INDEX "HRRequestTypeWorkflow_requestType_key" ON "HRRequestTypeWorkflow"("requestType");

-- CreateIndex
CREATE INDEX "HRRequestTypeWorkflow_requestType_idx" ON "HRRequestTypeWorkflow"("requestType");

-- CreateIndex
CREATE INDEX "HRRequestTypeWorkflow_reviewerUserId_idx" ON "HRRequestTypeWorkflow"("reviewerUserId");

-- CreateIndex
CREATE INDEX "HRRequestTypeWorkflow_approverUserId_idx" ON "HRRequestTypeWorkflow"("approverUserId");

-- CreateIndex
CREATE INDEX "HRWorkflowStep_workflowId_idx" ON "HRWorkflowStep"("workflowId");

-- CreateIndex
CREATE INDEX "HRWorkflowStep_order_idx" ON "HRWorkflowStep"("order");

-- CreateIndex
CREATE INDEX "HRWorkflowStep_userId_idx" ON "HRWorkflowStep"("userId");

-- CreateIndex
CREATE INDEX "AttendanceRequest_userId_idx" ON "AttendanceRequest"("userId");

-- CreateIndex
CREATE INDEX "AttendanceRequest_status_idx" ON "AttendanceRequest"("status");

-- CreateIndex
CREATE INDEX "AttendanceRequest_requestDate_idx" ON "AttendanceRequest"("requestDate");

-- CreateIndex
CREATE INDEX "AttendanceRequest_attendanceRecordId_idx" ON "AttendanceRequest"("attendanceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");

-- CreateIndex
CREATE INDEX "PurchaseOrder_purchaseRequestId_idx" ON "PurchaseOrder"("purchaseRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_receiptNumber_key" ON "GoodsReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchaseOrderId_idx" ON "GoodsReceipt"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_receiptDate_idx" ON "GoodsReceipt"("receiptDate");

-- CreateIndex
CREATE INDEX "GoodsReceipt_status_idx" ON "GoodsReceipt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_itemCode_key" ON "StockItem"("itemCode");

-- CreateIndex
CREATE INDEX "StockItem_category_idx" ON "StockItem"("category");

-- CreateIndex
CREATE INDEX "StockItem_currentStock_idx" ON "StockItem"("currentStock");

-- CreateIndex
CREATE INDEX "StockItem_itemCode_idx" ON "StockItem"("itemCode");

-- CreateIndex
CREATE INDEX "StockMovement_stockItemId_idx" ON "StockMovement"("stockItemId");

-- CreateIndex
CREATE INDEX "StockMovement_movementType_idx" ON "StockMovement"("movementType");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_goodsReceiptId_idx" ON "StockMovement"("goodsReceiptId");

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

-- CreateIndex
CREATE UNIQUE INDEX "Department_nameAr_key" ON "Department"("nameAr");

-- CreateIndex
CREATE UNIQUE INDEX "Department_headId_key" ON "Department"("headId");

-- CreateIndex
CREATE INDEX "Department_isActive_idx" ON "Department"("isActive");

-- CreateIndex
CREATE INDEX "Department_sortOrder_idx" ON "Department"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "JobTitle_nameAr_key" ON "JobTitle"("nameAr");

-- CreateIndex
CREATE INDEX "JobTitle_isActive_idx" ON "JobTitle"("isActive");

-- CreateIndex
CREATE INDEX "JobTitle_category_idx" ON "JobTitle"("category");

-- CreateIndex
CREATE INDEX "JobTitle_sortOrder_idx" ON "JobTitle"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_module_idx" ON "Permission"("module");

-- CreateIndex
CREATE INDEX "Permission_name_idx" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemRole_name_key" ON "SystemRole"("name");

-- CreateIndex
CREATE INDEX "SystemRole_isActive_idx" ON "SystemRole"("isActive");

-- CreateIndex
CREATE INDEX "SystemRole_sortOrder_idx" ON "SystemRole"("sortOrder");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "PermissionAuditLog_userId_idx" ON "PermissionAuditLog"("userId");

-- CreateIndex
CREATE INDEX "PermissionAuditLog_action_idx" ON "PermissionAuditLog"("action");

-- CreateIndex
CREATE INDEX "PermissionAuditLog_createdAt_idx" ON "PermissionAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceRequest_requestNumber_key" ON "FinanceRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "FinanceRequest_requesterId_idx" ON "FinanceRequest"("requesterId");

-- CreateIndex
CREATE INDEX "FinanceRequest_status_idx" ON "FinanceRequest"("status");

-- CreateIndex
CREATE INDEX "FinanceRequest_createdAt_idx" ON "FinanceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "FinanceRequest_sourceType_sourceId_idx" ON "FinanceRequest"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Workflow_type_idx" ON "Workflow"("type");

-- CreateIndex
CREATE INDEX "Workflow_forSpecificType_idx" ON "Workflow"("forSpecificType");

-- CreateIndex
CREATE INDEX "Workflow_isActive_idx" ON "Workflow"("isActive");

-- CreateIndex
CREATE INDEX "WorkflowBranch_workflowId_idx" ON "WorkflowBranch"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowBranch_branchId_idx" ON "WorkflowBranch"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowBranch_workflowId_branchId_key" ON "WorkflowBranch"("workflowId", "branchId");

-- CreateIndex
CREATE INDEX "WorkflowStage_workflowId_idx" ON "WorkflowStage"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowStage_stageId_idx" ON "WorkflowStage"("stageId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStage_workflowId_stageId_key" ON "WorkflowStage"("workflowId", "stageId");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_idx" ON "WorkflowStep"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowStep_order_idx" ON "WorkflowStep"("order");

-- CreateIndex
CREATE INDEX "WorkflowStep_approverUserId_idx" ON "WorkflowStep"("approverUserId");

-- CreateIndex
CREATE INDEX "WorkflowStep_approverType_idx" ON "WorkflowStep"("approverType");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowRole_slug_key" ON "WorkflowRole"("slug");

-- CreateIndex
CREATE INDEX "WorkflowRole_level_idx" ON "WorkflowRole"("level");

-- CreateIndex
CREATE INDEX "WorkflowApprovalLog_requestType_requestId_idx" ON "WorkflowApprovalLog"("requestType", "requestId");

-- CreateIndex
CREATE INDEX "WorkflowApprovalLog_approverId_idx" ON "WorkflowApprovalLog"("approverId");

-- CreateIndex
CREATE INDEX "WorkflowApprovalLog_status_idx" ON "WorkflowApprovalLog"("status");

-- CreateIndex
CREATE INDEX "WorkflowApprovalLog_createdAt_idx" ON "WorkflowApprovalLog"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowReferral_approvalId_idx" ON "WorkflowReferral"("approvalId");

-- CreateIndex
CREATE INDEX "WorkflowReferral_referredToId_idx" ON "WorkflowReferral"("referredToId");

-- CreateIndex
CREATE INDEX "WorkflowReferral_status_idx" ON "WorkflowReferral"("status");

-- CreateIndex
CREATE INDEX "WorkflowReferral_createdAt_idx" ON "WorkflowReferral"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SystemRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_systemRoleId_fkey" FOREIGN KEY ("systemRoleId") REFERENCES "SystemRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRRequest" ADD CONSTRAINT "HRRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRRequest" ADD CONSTRAINT "HRRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRRequest" ADD CONSTRAINT "HRRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRRequestAuditLog" ADD CONSTRAINT "HRRequestAuditLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HRRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRRequestAuditLog" ADD CONSTRAINT "HRRequestAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRDelegation" ADD CONSTRAINT "HRDelegation_delegateToUserId_fkey" FOREIGN KEY ("delegateToUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRDelegation" ADD CONSTRAINT "HRDelegation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementRequest" ADD CONSTRAINT "ReplacementRequest_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "OrganizationalPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementRequest" ADD CONSTRAINT "ReplacementRequest_currentEmployeeId_fkey" FOREIGN KEY ("currentEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementRequest" ADD CONSTRAINT "ReplacementRequest_newEmployeeId_fkey" FOREIGN KEY ("newEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementRequest" ADD CONSTRAINT "ReplacementRequest_evaluatedByUserId_fkey" FOREIGN KEY ("evaluatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementRequest" ADD CONSTRAINT "ReplacementRequest_decisionByUserId_fkey" FOREIGN KEY ("decisionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementRequest" ADD CONSTRAINT "ReplacementRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementNotification" ADD CONSTRAINT "ReplacementNotification_replacementId_fkey" FOREIGN KEY ("replacementId") REFERENCES "ReplacementRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementNotification" ADD CONSTRAINT "ReplacementNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementPerformanceReport" ADD CONSTRAINT "ReplacementPerformanceReport_replacementId_fkey" FOREIGN KEY ("replacementId") REFERENCES "ReplacementRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementPerformanceReport" ADD CONSTRAINT "ReplacementPerformanceReport_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementTimeline" ADD CONSTRAINT "ReplacementTimeline_replacementId_fkey" FOREIGN KEY ("replacementId") REFERENCES "ReplacementRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementTimeline" ADD CONSTRAINT "ReplacementTimeline_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationalPosition" ADD CONSTRAINT "OrganizationalPosition_currentEmployeeId_fkey" FOREIGN KEY ("currentEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationalPosition" ADD CONSTRAINT "OrganizationalPosition_activeReplacementId_fkey" FOREIGN KEY ("activeReplacementId") REFERENCES "ReplacementRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationalPosition" ADD CONSTRAINT "OrganizationalPosition_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentHeadcount" ADD CONSTRAINT "DepartmentHeadcount_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadcountChangeRequest" ADD CONSTRAINT "HeadcountChangeRequest_departmentHeadcountId_fkey" FOREIGN KEY ("departmentHeadcountId") REFERENCES "DepartmentHeadcount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadcountChangeRequest" ADD CONSTRAINT "HeadcountChangeRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadcountChangeRequest" ADD CONSTRAINT "HeadcountChangeRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionHistory" ADD CONSTRAINT "PositionHistory_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "OrganizationalPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionHistory" ADD CONSTRAINT "PositionHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionHistory" ADD CONSTRAINT "PositionHistory_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionOpeningRequest" ADD CONSTRAINT "PositionOpeningRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionOpeningRequest" ADD CONSTRAINT "PositionOpeningRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionOpeningRequest" ADD CONSTRAINT "PositionOpeningRequest_createdPositionId_fkey" FOREIGN KEY ("createdPositionId") REFERENCES "OrganizationalPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "OrganizationalPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceComment" ADD CONSTRAINT "MaintenanceComment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceComment" ADD CONSTRAINT "MaintenanceComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequestPart" ADD CONSTRAINT "MaintenanceRequestPart_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_deputyId_fkey" FOREIGN KEY ("deputyId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementCategoryWorkflow" ADD CONSTRAINT "ProcurementCategoryWorkflow_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementCategoryWorkflow" ADD CONSTRAINT "ProcurementCategoryWorkflow_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementCategoryWorkflow" ADD CONSTRAINT "ProcurementCategoryWorkflow_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementWorkflowStep" ADD CONSTRAINT "ProcurementWorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ProcurementCategoryWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementWorkflowStep" ADD CONSTRAINT "ProcurementWorkflowStep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRWorkflowSettings" ADD CONSTRAINT "HRWorkflowSettings_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRWorkflowSettings" ADD CONSTRAINT "HRWorkflowSettings_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRWorkflowSettings" ADD CONSTRAINT "HRWorkflowSettings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRRequestTypeWorkflow" ADD CONSTRAINT "HRRequestTypeWorkflow_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRRequestTypeWorkflow" ADD CONSTRAINT "HRRequestTypeWorkflow_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRRequestTypeWorkflow" ADD CONSTRAINT "HRRequestTypeWorkflow_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRWorkflowStep" ADD CONSTRAINT "HRWorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "HRRequestTypeWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRWorkflowStep" ADD CONSTRAINT "HRWorkflowStep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRequest" ADD CONSTRAINT "AttendanceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRequest" ADD CONSTRAINT "AttendanceRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLineItem" ADD CONSTRAINT "PayrollLineItem_payrollLineId_fkey" FOREIGN KEY ("payrollLineId") REFERENCES "PayrollLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecurringItem" ADD CONSTRAINT "PayrollRecurringItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionAuditLog" ADD CONSTRAINT "DeductionAuditLog_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionAuditLog" ADD CONSTRAINT "DeductionAuditLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_headId_fkey" FOREIGN KEY ("headId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTitle" ADD CONSTRAINT "JobTitle_suggestedRoleId_fkey" FOREIGN KEY ("suggestedRoleId") REFERENCES "SystemRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SystemRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRequest" ADD CONSTRAINT "FinanceRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRequest" ADD CONSTRAINT "FinanceRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRequest" ADD CONSTRAINT "FinanceRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowBranch" ADD CONSTRAINT "WorkflowBranch_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowBranch" ADD CONSTRAINT "WorkflowBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowRoleId_fkey" FOREIGN KEY ("workflowRoleId") REFERENCES "WorkflowRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowApprovalLog" ADD CONSTRAINT "WorkflowApprovalLog_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "WorkflowStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowApprovalLog" ADD CONSTRAINT "WorkflowApprovalLog_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowReferral" ADD CONSTRAINT "WorkflowReferral_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "WorkflowApprovalLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowReferral" ADD CONSTRAINT "WorkflowReferral_referredToId_fkey" FOREIGN KEY ("referredToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowReferral" ADD CONSTRAINT "WorkflowReferral_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

