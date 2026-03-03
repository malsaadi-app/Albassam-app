-- CreateTable
CREATE TABLE IF NOT EXISTS "HRRoutingRule" (
  "id" TEXT NOT NULL,
  "requestType" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "useStageHead" BOOLEAN NOT NULL DEFAULT true,
  "vpUserId" TEXT,
  "hrManagerUserId" TEXT,
  "allowDelegation" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,

  CONSTRAINT "HRRoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HRRoutingRule_requestType_key" ON "HRRoutingRule"("requestType");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "HRRoutingRule" ADD CONSTRAINT "HRRoutingRule_vpUserId_fkey" FOREIGN KEY ("vpUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "HRRoutingRule" ADD CONSTRAINT "HRRoutingRule_hrManagerUserId_fkey" FOREIGN KEY ("hrManagerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "HRRoutingRule" ADD CONSTRAINT "HRRoutingRule_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
