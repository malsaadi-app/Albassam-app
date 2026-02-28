-- Make certain Employee fields optional for bulk import from HR master sheet.
-- These values will be filled later from a dedicated file.

ALTER TABLE "Employee"
  ALTER COLUMN "dateOfBirth" DROP NOT NULL,
  ALTER COLUMN "gender" DROP NOT NULL,
  ALTER COLUMN "maritalStatus" DROP NOT NULL,
  ALTER COLUMN "hireDate" DROP NOT NULL,
  ALTER COLUMN "employmentType" DROP NOT NULL;
