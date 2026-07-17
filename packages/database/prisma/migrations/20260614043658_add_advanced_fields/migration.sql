-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "api_scopes" TEXT,
ADD COLUMN     "ip_whitelist" TEXT;

-- AlterTable
ALTER TABLE "pos_terminals" ADD COLUMN     "diagnostic_data" JSONB,
ADD COLUMN     "layout_format" TEXT,
ADD COLUMN     "receipt_template" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "baseline_schedule" TEXT,
ADD COLUMN     "critical_path" TEXT,
ADD COLUMN     "overall_health" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "escalated_at" TIMESTAMP(3),
ADD COLUMN     "sla_hours" INTEGER;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "lot_number" TEXT,
ADD COLUMN     "oee_score" DECIMAL(5,2),
ADD COLUMN     "scrap_quantity" DECIMAL(15,3);

-- AlterTable
ALTER TABLE "workflow_steps" ADD COLUMN     "backup_assignee_role" TEXT,
ADD COLUMN     "sla_limit_hours" INTEGER;
