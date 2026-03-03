-- Add conditions JSON to WorkflowRule for advanced matching (stage/department/etc)
ALTER TABLE "WorkflowRule" ADD COLUMN IF NOT EXISTS "conditionsJson" jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS "WorkflowRule_conditions_idx" ON "WorkflowRule" USING gin ("conditionsJson");
