-- CreateTable
CREATE TABLE "pipeline_risk_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "days_in_stage" INTEGER,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "snoozed_until" TIMESTAMP(3),
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_risk_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_payment_intents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "portal_user_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" TEXT NOT NULL DEFAULT 'mock_gateway',
    "gateway_intent_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUIRES_CONFIRMATION',
    "payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "portal_payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipeline_risk_alerts_tenant_id_idx" ON "pipeline_risk_alerts"("tenant_id");

-- CreateIndex
CREATE INDEX "pipeline_risk_alerts_tenant_id_status_idx" ON "pipeline_risk_alerts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "pipeline_risk_alerts_opportunity_id_idx" ON "pipeline_risk_alerts"("opportunity_id");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_risk_alerts_tenant_id_opportunity_id_alert_type_key" ON "pipeline_risk_alerts"("tenant_id", "opportunity_id", "alert_type");

-- CreateIndex
CREATE INDEX "portal_payment_intents_tenant_id_idx" ON "portal_payment_intents"("tenant_id");

-- CreateIndex
CREATE INDEX "portal_payment_intents_invoice_id_idx" ON "portal_payment_intents"("invoice_id");

-- CreateIndex
CREATE INDEX "portal_payment_intents_tenant_id_customer_id_idx" ON "portal_payment_intents"("tenant_id", "customer_id");

-- AddForeignKey
ALTER TABLE "pipeline_risk_alerts" ADD CONSTRAINT "pipeline_risk_alerts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_payment_intents" ADD CONSTRAINT "portal_payment_intents_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
