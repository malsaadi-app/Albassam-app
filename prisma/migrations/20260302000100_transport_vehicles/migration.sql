-- CreateTable
CREATE TABLE IF NOT EXISTS "TransportVehicle" (
  "id" TEXT NOT NULL,
  "plateNumber" TEXT NOT NULL,
  "vehicleType" TEXT NOT NULL,
  "model" TEXT,
  "year" INTEGER,
  "capacity" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "branchId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TransportVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TransportVehicle_plateNumber_key" ON "TransportVehicle"("plateNumber");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "TransportVehicle" ADD CONSTRAINT "TransportVehicle_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
