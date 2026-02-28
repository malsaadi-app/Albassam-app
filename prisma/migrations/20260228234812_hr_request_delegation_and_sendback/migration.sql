-- HR Request delegation + send-back support

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HRRequestDelegationStatus') THEN
    CREATE TYPE "HRRequestDelegationStatus" AS ENUM ('ACTIVE', 'USED', 'CANCELLED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "HRRequestDelegation" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "delegatedToUserId" TEXT NOT NULL,
  "delegatedByUserId" TEXT NOT NULL,
  "stepIndex" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "status" "HRRequestDelegationStatus" NOT NULL DEFAULT 'ACTIVE',
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HRRequestDelegation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HRRequestDelegation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HRRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HRRequestDelegation_delegatedToUserId_fkey" FOREIGN KEY ("delegatedToUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HRRequestDelegation_delegatedByUserId_fkey" FOREIGN KEY ("delegatedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "HRRequestDelegation_requestId_status_idx" ON "HRRequestDelegation"("requestId", "status");
CREATE INDEX IF NOT EXISTS "HRRequestDelegation_delegatedToUserId_status_idx" ON "HRRequestDelegation"("delegatedToUserId", "status");
