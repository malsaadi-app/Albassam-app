-- Workflow Builder (generic)

CREATE TABLE IF NOT EXISTS "WorkflowDefinition" (
  "id" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkflowVersion" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  CONSTRAINT "WorkflowVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowVersion_workflowId_version_key" ON "WorkflowVersion"("workflowId","version");

CREATE TABLE IF NOT EXISTS "WorkflowRule" (
  "id" TEXT NOT NULL,
  "workflowVersionId" TEXT NOT NULL,
  "requestType" TEXT,
  "branchId" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkflowRule_requestType_idx" ON "WorkflowRule"("requestType");
CREATE INDEX IF NOT EXISTS "WorkflowRule_branchId_idx" ON "WorkflowRule"("branchId");

CREATE TABLE IF NOT EXISTS "WorkflowStepDefinition" (
  "id" TEXT NOT NULL,
  "workflowVersionId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "titleAr" TEXT NOT NULL,
  "titleEn" TEXT,
  "stepType" TEXT NOT NULL,
  "configJson" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "requireComment" BOOLEAN NOT NULL DEFAULT true,
  "allowConsult" BOOLEAN NOT NULL DEFAULT true,
  "allowDelegation" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "WorkflowStepDefinition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkflowStepDefinition_workflowVersionId_idx" ON "WorkflowStepDefinition"("workflowVersionId");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowStepDefinition_workflowVersionId_order_key" ON "WorkflowStepDefinition"("workflowVersionId","order");

-- FKs
DO $$ BEGIN
  ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowRule" ADD CONSTRAINT "WorkflowRule_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowStepDefinition" ADD CONSTRAINT "WorkflowStepDefinition_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowRule" ADD CONSTRAINT "WorkflowRule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowDefinition" ADD CONSTRAINT "WorkflowDefinition_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowDefinition" ADD CONSTRAINT "WorkflowDefinition_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
