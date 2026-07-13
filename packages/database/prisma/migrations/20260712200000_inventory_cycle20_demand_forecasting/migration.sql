-- Cycle 20: Demand Forecasting Migration

CREATE TABLE "demand_forecasts" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "product_id"      TEXT NOT NULL,
  "warehouse_id"    TEXT,
  "forecast_date"   TIMESTAMP(3) NOT NULL,
  "horizon"         INTEGER NOT NULL,
  "method"          TEXT NOT NULL,
  "forecasted_qty"  DECIMAL(15,4) NOT NULL,
  "confidence_low"  DECIMAL(15,4),
  "confidence_high" DECIMAL(15,4),
  "actual_qty"      DECIMAL(15,4),
  "mape"            DECIMAL(8,4),
  "status"          TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes"           TEXT,
  "created_by"      TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "demand_forecasts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "demand_forecasts_tenant_id_idx" ON "demand_forecasts"("tenant_id");
CREATE INDEX "demand_forecasts_tenant_id_product_id_idx" ON "demand_forecasts"("tenant_id", "product_id");
CREATE INDEX "demand_forecasts_tenant_id_forecast_date_idx" ON "demand_forecasts"("tenant_id", "forecast_date");

CREATE TABLE "reorder_points" (
  "id"               TEXT NOT NULL,
  "tenant_id"        TEXT NOT NULL,
  "product_id"       TEXT NOT NULL,
  "warehouse_id"     TEXT,
  "reorder_point"    DECIMAL(15,4) NOT NULL,
  "reorder_qty"      DECIMAL(15,4) NOT NULL,
  "safety_stock"     DECIMAL(15,4) NOT NULL,
  "lead_time_days"   INTEGER NOT NULL,
  "avg_daily_demand" DECIMAL(15,4) NOT NULL,
  "service_level"    DECIMAL(5,4) NOT NULL,
  "calculated_at"    TIMESTAMP(3) NOT NULL,
  "is_active"        BOOLEAN NOT NULL DEFAULT true,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reorder_points_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "reorder_points_tenant_product_warehouse_key" ON "reorder_points"("tenant_id", "product_id", "warehouse_id");
CREATE INDEX "reorder_points_tenant_id_idx" ON "reorder_points"("tenant_id");
CREATE INDEX "reorder_points_tenant_id_product_id_idx" ON "reorder_points"("tenant_id", "product_id");

CREATE TABLE "safety_stock_configs" (
  "id"                TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "product_id"        TEXT NOT NULL,
  "warehouse_id"      TEXT,
  "method"            TEXT NOT NULL DEFAULT 'FIXED',
  "fixed_qty"         DECIMAL(15,4),
  "coverage_days"     INTEGER,
  "service_level"     DECIMAL(5,4),
  "demand_std_dev"    DECIMAL(15,4),
  "lead_time_std_dev" DECIMAL(8,4),
  "calculated_safety" DECIMAL(15,4),
  "last_recalc_at"    TIMESTAMP(3),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "safety_stock_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "safety_stock_configs_tenant_product_warehouse_key" ON "safety_stock_configs"("tenant_id", "product_id", "warehouse_id");
CREATE INDEX "safety_stock_configs_tenant_id_idx" ON "safety_stock_configs"("tenant_id");

CREATE TABLE "replenishment_orders" (
  "id"             TEXT NOT NULL,
  "tenant_id"      TEXT NOT NULL,
  "order_number"   TEXT NOT NULL,
  "product_id"     TEXT NOT NULL,
  "warehouse_id"   TEXT NOT NULL,
  "suggested_qty"  DECIMAL(15,4) NOT NULL,
  "approved_qty"   DECIMAL(15,4),
  "uom"            TEXT NOT NULL DEFAULT 'EA',
  "trigger_type"   TEXT NOT NULL,
  "current_stock"  DECIMAL(15,4) NOT NULL,
  "reorder_point"  DECIMAL(15,4),
  "status"         TEXT NOT NULL DEFAULT 'PENDING',
  "priority"       TEXT NOT NULL DEFAULT 'NORMAL',
  "expected_date"  TIMESTAMP(3),
  "supplier_id"    TEXT,
  "notes"          TEXT,
  "created_by"     TEXT,
  "approved_by"    TEXT,
  "approved_at"    TIMESTAMP(3),
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "replenishment_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "replenishment_orders_tenant_order_number_key" ON "replenishment_orders"("tenant_id", "order_number");
CREATE INDEX "replenishment_orders_tenant_id_idx" ON "replenishment_orders"("tenant_id");
CREATE INDEX "replenishment_orders_tenant_id_status_idx" ON "replenishment_orders"("tenant_id", "status");
CREATE INDEX "replenishment_orders_tenant_id_product_id_idx" ON "replenishment_orders"("tenant_id", "product_id");

CREATE TABLE "stockout_predictions" (
  "id"                       TEXT NOT NULL,
  "tenant_id"                TEXT NOT NULL,
  "product_id"               TEXT NOT NULL,
  "warehouse_id"             TEXT NOT NULL,
  "current_stock"            DECIMAL(15,4) NOT NULL,
  "avg_daily_demand"         DECIMAL(15,4) NOT NULL,
  "days_of_stock"            DECIMAL(8,2) NOT NULL,
  "predicted_stockout_date"  TIMESTAMP(3),
  "risk_level"               TEXT NOT NULL,
  "recommended_action"       TEXT,
  "acknowledged"             BOOLEAN NOT NULL DEFAULT false,
  "acknowledged_by"          TEXT,
  "acknowledged_at"          TIMESTAMP(3),
  "created_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"               TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stockout_predictions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "stockout_predictions_tenant_id_idx" ON "stockout_predictions"("tenant_id");
CREATE INDEX "stockout_predictions_tenant_id_risk_level_idx" ON "stockout_predictions"("tenant_id", "risk_level");
CREATE INDEX "stockout_predictions_tenant_id_product_id_idx" ON "stockout_predictions"("tenant_id", "product_id");
