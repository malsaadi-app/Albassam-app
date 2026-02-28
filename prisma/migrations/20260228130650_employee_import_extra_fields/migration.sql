-- Extra Employee fields found in HR Excel that need first-class columns.

ALTER TABLE "Employee"
  ADD COLUMN IF NOT EXISTS "nationalIdExpiry" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passportNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "passportExpiry" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "schoolName" TEXT;
