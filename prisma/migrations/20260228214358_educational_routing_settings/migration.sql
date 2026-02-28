-- EducationalRoutingSettings: branch-level VP educational affairs approver.

CREATE TABLE IF NOT EXISTS "EducationalRoutingSettings" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "vpEducationalUserId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EducationalRoutingSettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EducationalRoutingSettings_branchId_key" UNIQUE ("branchId"),
  CONSTRAINT "EducationalRoutingSettings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EducationalRoutingSettings_vpEducationalUserId_fkey" FOREIGN KEY ("vpEducationalUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EducationalRoutingSettings_vpEducationalUserId_idx" ON "EducationalRoutingSettings"("vpEducationalUserId");
