CREATE TABLE IF NOT EXISTS "PurchaseRequestAuditLog" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "requestId" text NOT NULL,
  "actorUserId" text NOT NULL,
  "action" text NOT NULL,
  "message" text NULL,
  "diffJson" text NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "PurchaseRequestAuditLog_requestId_idx" ON "PurchaseRequestAuditLog" ("requestId");
CREATE INDEX IF NOT EXISTS "PurchaseRequestAuditLog_actorUserId_idx" ON "PurchaseRequestAuditLog" ("actorUserId");
CREATE INDEX IF NOT EXISTS "PurchaseRequestAuditLog_createdAt_idx" ON "PurchaseRequestAuditLog" ("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseRequestAuditLog_requestId_fkey'
  ) THEN
    ALTER TABLE "PurchaseRequestAuditLog"
      ADD CONSTRAINT "PurchaseRequestAuditLog_requestId_fkey"
      FOREIGN KEY ("requestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseRequestAuditLog_actorUserId_fkey'
  ) THEN
    ALTER TABLE "PurchaseRequestAuditLog"
      ADD CONSTRAINT "PurchaseRequestAuditLog_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
END $$;
