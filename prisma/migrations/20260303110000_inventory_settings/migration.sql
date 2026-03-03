-- Inventory settings (single-row table)
CREATE TABLE IF NOT EXISTS "InventorySettings" (
  "id" text PRIMARY KEY DEFAULT 'default',
  "allowNegativeStock" boolean NOT NULL DEFAULT true,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "updatedBy" text NULL
);

-- Ensure default row
INSERT INTO "InventorySettings" ("id") VALUES ('default')
ON CONFLICT ("id") DO NOTHING;

CREATE INDEX IF NOT EXISTS "InventorySettings_updatedAt_idx" ON "InventorySettings" ("updatedAt");
