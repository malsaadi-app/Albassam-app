-- CreateTable
CREATE TABLE "MaintenanceRoutingSettings" (
    "id" TEXT NOT NULL,
    "maintenanceManagerUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRoutingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceBranchForwarder" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceBranchForwarder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceRoutingSettings_maintenanceManagerUserId_idx" ON "MaintenanceRoutingSettings"("maintenanceManagerUserId");

-- CreateIndex
CREATE INDEX "MaintenanceBranchForwarder_userId_idx" ON "MaintenanceBranchForwarder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceBranchForwarder_branchId_key" ON "MaintenanceBranchForwarder"("branchId");

-- AddForeignKey
ALTER TABLE "MaintenanceRoutingSettings" ADD CONSTRAINT "MaintenanceRoutingSettings_maintenanceManagerUserId_fkey" FOREIGN KEY ("maintenanceManagerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceBranchForwarder" ADD CONSTRAINT "MaintenanceBranchForwarder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceBranchForwarder" ADD CONSTRAINT "MaintenanceBranchForwarder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
