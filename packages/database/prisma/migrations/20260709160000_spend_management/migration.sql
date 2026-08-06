-- Unified Spend Management (card spend limits) — idempotent migration

ALTER TABLE "corporate_cards" ADD COLUMN IF NOT EXISTS "is_frozen" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "card_spend_limits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT,
    "period" TEXT NOT NULL,
    "amount_cap" DECIMAL(15,2) NOT NULL,
    "current_spend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "breach_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_spend_limits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "card_spend_limits_tenant_id_idx" ON "card_spend_limits"("tenant_id");
CREATE INDEX IF NOT EXISTS "card_spend_limits_tenant_id_card_id_idx" ON "card_spend_limits"("tenant_id", "card_id");
CREATE INDEX IF NOT EXISTS "card_spend_limits_tenant_id_period_end_idx" ON "card_spend_limits"("tenant_id", "period_end");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'card_spend_limits_card_id_fkey'
  ) THEN
    ALTER TABLE "card_spend_limits"
      ADD CONSTRAINT "card_spend_limits_card_id_fkey"
      FOREIGN KEY ("card_id") REFERENCES "corporate_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "card_category_limits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "mcc_category" TEXT NOT NULL,
    "amount_cap" DECIMAL(15,2) NOT NULL,
    "current_spend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "breach_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_category_limits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "card_category_limits_tenant_id_idx" ON "card_category_limits"("tenant_id");
CREATE INDEX IF NOT EXISTS "card_category_limits_tenant_id_card_id_idx" ON "card_category_limits"("tenant_id", "card_id");
CREATE INDEX IF NOT EXISTS "card_category_limits_tenant_id_period_end_idx" ON "card_category_limits"("tenant_id", "period_end");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'card_category_limits_card_id_fkey'
  ) THEN
    ALTER TABLE "card_category_limits"
      ADD CONSTRAINT "card_category_limits_card_id_fkey"
      FOREIGN KEY ("card_id") REFERENCES "corporate_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "card_limit_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "limit_id" TEXT NOT NULL,
    "limit_type" TEXT NOT NULL,
    "changed_by_user_id" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_limit_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "card_limit_audit_logs_tenant_id_idx" ON "card_limit_audit_logs"("tenant_id");
CREATE INDEX IF NOT EXISTS "card_limit_audit_logs_tenant_id_limit_id_idx" ON "card_limit_audit_logs"("tenant_id", "limit_id");

CREATE TABLE IF NOT EXISTS "card_limit_increase_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "limit_id" TEXT NOT NULL,
    "requested_by_user_id" TEXT NOT NULL,
    "current_cap" DECIMAL(15,2) NOT NULL,
    "requested_cap" DECIMAL(15,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_limit_increase_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "card_limit_increase_requests_tenant_id_idx" ON "card_limit_increase_requests"("tenant_id");
CREATE INDEX IF NOT EXISTS "card_limit_increase_requests_tenant_id_limit_id_idx" ON "card_limit_increase_requests"("tenant_id", "limit_id");
