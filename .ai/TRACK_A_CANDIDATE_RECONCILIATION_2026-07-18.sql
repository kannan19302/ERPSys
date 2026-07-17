-- CreateEnum
CREATE TYPE "CatchWeightVariance" AS ENUM ('WITHIN_TOLERANCE', 'OVER_TOLERANCE', 'UNDER_TOLERANCE');

-- CreateEnum
CREATE TYPE "RecallClass" AS ENUM ('CLASS_I', 'CLASS_II', 'CLASS_III');

-- CreateEnum
CREATE TYPE "RecallStatus" AS ENUM ('DRAFT', 'ISSUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecallActionType" AS ENUM ('RETURN', 'DESTROY', 'REWORK', 'QUARANTINE');

-- CreateEnum
CREATE TYPE "PackagingLevel" AS ENUM ('EACH', 'INNER', 'CASE', 'MASTER_CARTON', 'PALLET');

-- CreateEnum
CREATE TYPE "BarcodeSymbology" AS ENUM ('EAN13', 'EAN8', 'UPC_A', 'UPC_E', 'CODE128', 'CODE39', 'ITF14', 'GS1_128', 'DATA_MATRIX', 'QR_CODE', 'GS1_DATAMATRIX');

-- CreateEnum
CREATE TYPE "LabelTemplateType" AS ENUM ('ITEM', 'INNER', 'CASE', 'PALLET', 'SHIPPING', 'COMPLIANCE');

-- DropForeignKey
ALTER TABLE "asl_change_logs" DROP CONSTRAINT "asl_change_logs_approved_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "catch_weight_readings" DROP CONSTRAINT "catch_weight_readings_config_id_fkey";

-- DropForeignKey
ALTER TABLE "count_sheet_items" DROP CONSTRAINT "count_sheet_items_sheet_fk";

-- DropForeignKey
ALTER TABLE "count_sheets" DROP CONSTRAINT "count_sheets_stock_take_fk";

-- DropForeignKey
ALTER TABLE "gate_passes" DROP CONSTRAINT "gate_passes_appointment_fk";

-- DropForeignKey
ALTER TABLE "hazmat_manifest_lines" DROP CONSTRAINT "hazmat_manifest_lines_classification_id_fkey";

-- DropForeignKey
ALTER TABLE "hazmat_manifest_lines" DROP CONSTRAINT "hazmat_manifest_lines_manifest_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_cost_layers" DROP CONSTRAINT "inventory_cost_layers_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "item_barcodes" DROP CONSTRAINT "item_barcodes_packaging_spec_id_fkey";

-- DropForeignKey
ALTER TABLE "label_assignments" DROP CONSTRAINT "label_assignments_packaging_spec_id_fkey";

-- DropForeignKey
ALTER TABLE "label_assignments" DROP CONSTRAINT "label_assignments_template_id_fkey";

-- DropForeignKey
ALTER TABLE "landed_cost_allocations" DROP CONSTRAINT "landed_cost_allocations_voucherId_fkey";

-- DropForeignKey
ALTER TABLE "landed_cost_charge_lines" DROP CONSTRAINT "landed_cost_charge_lines_voucherId_fkey";

-- DropForeignKey
ALTER TABLE "landed_cost_receipt_links" DROP CONSTRAINT "landed_cost_receipt_links_voucherId_fkey";

-- DropForeignKey
ALTER TABLE "load_carton_items" DROP CONSTRAINT "load_carton_items_carton_id_fkey";

-- DropForeignKey
ALTER TABLE "load_cartons" DROP CONSTRAINT "load_cartons_packing_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "load_plan_items" DROP CONSTRAINT "load_plan_items_load_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "load_plan_pallets" DROP CONSTRAINT "load_plan_pallets_load_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "load_plan_pallets" DROP CONSTRAINT "load_plan_pallets_pallet_type_id_fkey";

-- DropForeignKey
ALTER TABLE "load_plans" DROP CONSTRAINT "load_plans_container_type_id_fkey";

-- DropForeignKey
ALTER TABLE "lot_disposal_records" DROP CONSTRAINT "lot_disposal_records_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "lot_expiry_alerts" DROP CONSTRAINT "lot_expiry_alerts_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "recall_affected_stocks" DROP CONSTRAINT "recall_affected_stocks_recall_id_fkey";

-- DropForeignKey
ALTER TABLE "recall_customer_notices" DROP CONSTRAINT "recall_customer_notices_recall_id_fkey";

-- DropForeignKey
ALTER TABLE "recall_disposal_records" DROP CONSTRAINT "recall_disposal_records_recall_id_fkey";

-- DropForeignKey
ALTER TABLE "safety_data_sheets" DROP CONSTRAINT "safety_data_sheets_classification_id_fkey";

-- DropForeignKey
ALTER TABLE "shipment_tracking_events" DROP CONSTRAINT "shipment_tracking_events_inbound_shipment_id_fkey";

-- DropForeignKey
ALTER TABLE "shipment_tracking_events" DROP CONSTRAINT "shipment_tracking_events_outbound_shipment_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_take_variances" DROP CONSTRAINT "stock_take_variances_stock_take_fk";

-- DropForeignKey
ALTER TABLE "supplier_car_requests" DROP CONSTRAINT "supplier_car_requests_ncr_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_car_requests" DROP CONSTRAINT "supplier_car_requests_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_ncrs" DROP CONSTRAINT "supplier_ncrs_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_price_tiers" DROP CONSTRAINT "supplier_price_tiers_approved_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_scorecards" DROP CONSTRAINT "supplier_scorecards_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "temperature_excursions" DROP CONSTRAINT "temperature_excursions_requirement_id_fkey";

-- DropForeignKey
ALTER TABLE "vmi_orders" DROP CONSTRAINT "vmi_orders_agreement_id_fkey";

-- DropForeignKey
ALTER TABLE "vmi_stock_snapshots" DROP CONSTRAINT "vmi_stock_snapshots_agreement_id_fkey";

-- DropForeignKey
ALTER TABLE "yard_appointments" DROP CONSTRAINT "yard_appointments_dock_door_fk";

-- DropForeignKey
ALTER TABLE "yard_moves" DROP CONSTRAINT "yard_moves_appointment_fk";

-- DropIndex
DROP INDEX "freight_claims_tenant_id_claim_type_idx";

-- DropIndex
DROP INDEX "inventory_cost_adjustments_tenant_id_adjustment_number_key";

-- DropIndex
DROP INDEX "inventory_cost_adjustments_tenant_id_idx";

-- DropIndex
DROP INDEX "inventory_cost_adjustments_tenant_id_profile_id_idx";

-- DropIndex
DROP INDEX "inventory_cost_layers_tenant_id_idx";

-- DropIndex
DROP INDEX "inventory_cost_layers_tenant_id_profile_id_idx";

-- DropIndex
DROP INDEX "inventory_cost_layers_tenant_id_profile_id_status_idx";

-- DropIndex
DROP INDEX "inventory_cost_profiles_tenant_id_idx";

-- DropIndex
DROP INDEX "inventory_cost_profiles_tenant_id_product_id_idx";

-- DropIndex
DROP INDEX "inventory_cost_profiles_tenant_id_product_id_warehouse_id_key";

-- DropIndex
DROP INDEX "landed_cost_receipt_links_voucherId_stockEntryId_key";

-- DropIndex
DROP INDEX "landed_cost_vouchers_tenantId_voucherNumber_key";

-- DropIndex
DROP INDEX "lot_disposal_records_tenant_id_disposal_number_key";

-- DropIndex
DROP INDEX "lot_disposal_records_tenant_id_idx";

-- DropIndex
DROP INDEX "lot_disposal_records_tenant_id_lot_id_idx";

-- DropIndex
DROP INDEX "lot_expiry_alerts_tenant_id_dismissed_idx";

-- DropIndex
DROP INDEX "lot_expiry_alerts_tenant_id_idx";

-- DropIndex
DROP INDEX "lot_expiry_alerts_tenant_id_lot_id_idx";

-- DropIndex
DROP INDEX "lot_expiry_records_tenant_id_expiry_date_idx";

-- DropIndex
DROP INDEX "lot_expiry_records_tenant_id_idx";

-- DropIndex
DROP INDEX "lot_expiry_records_tenant_id_lot_number_product_id_warehouse_ke";

-- DropIndex
DROP INDEX "lot_expiry_records_tenant_id_product_id_idx";

-- DropIndex
DROP INDEX "lot_expiry_records_tenant_id_status_idx";

-- DropIndex
DROP INDEX "vmi_agreements_tenant_id_agreement_number_key";

-- DropIndex
DROP INDEX "vmi_agreements_tenant_id_idx";

-- DropIndex
DROP INDEX "vmi_agreements_tenant_id_status_idx";

-- DropIndex
DROP INDEX "vmi_agreements_tenant_id_vendor_id_idx";

-- DropIndex
DROP INDEX "vmi_orders_tenant_id_agreement_id_idx";

-- DropIndex
DROP INDEX "vmi_orders_tenant_id_idx";

-- DropIndex
DROP INDEX "vmi_orders_tenant_id_order_number_key";

-- DropIndex
DROP INDEX "vmi_orders_tenant_id_status_idx";

-- DropIndex
DROP INDEX "vmi_orders_tenant_id_vendor_id_idx";

-- DropIndex
DROP INDEX "vmi_stock_snapshots_tenant_id_agreement_id_idx";

-- DropIndex
DROP INDEX "vmi_stock_snapshots_tenant_id_idx";

-- DropIndex
DROP INDEX "vmi_stock_snapshots_tenant_id_snapshot_date_idx";

-- AlterTable
ALTER TABLE "approved_suppliers" ALTER COLUMN "qualification_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expiry_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "asl_change_logs" ALTER COLUMN "changed_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "asl_compliance_rules" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "catch_weight_readings" DROP COLUMN "variance_status",
ADD COLUMN     "variance_status" "CatchWeightVariance" NOT NULL;

-- AlterTable
ALTER TABLE "cold_chain_requirements" ALTER COLUMN "min_temp_celsius" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "max_temp_celsius" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "min_humidity_pct" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "max_humidity_pct" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "connect_meetings" ADD COLUMN     "lobby" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "container_types" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "cross_dock_orders" DROP COLUMN "completedAt",
ADD COLUMN     "completed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "freight_claims" DROP COLUMN "claim_type",
ADD COLUMN     "claimType" "FreightClaimType" NOT NULL;

-- AlterTable
ALTER TABLE "hazmat_classifications" ALTER COLUMN "subsidiary_hazards" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "hazmat_incidents" ALTER COLUMN "incident_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "closed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "hazmat_manifests" ALTER COLUMN "shipped_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "delivered_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "hazmat_storage_rules" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "inventory_cost_adjustments" DROP COLUMN "adjusted_at",
DROP COLUMN "adjusted_by_id",
DROP COLUMN "adjustment_number",
DROP COLUMN "adjustment_type",
DROP COLUMN "created_at",
DROP COLUMN "profile_id",
DROP COLUMN "tenant_id",
ADD COLUMN     "adjustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "adjustedById" TEXT NOT NULL,
ADD COLUMN     "adjustmentNumber" TEXT NOT NULL,
ADD COLUMN     "adjustmentType" "CostAdjustmentType" NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inventory_cost_layers" DROP COLUMN "created_at",
DROP COLUMN "profile_id",
DROP COLUMN "qty_received",
DROP COLUMN "qty_remaining",
DROP COLUMN "receipt_date",
DROP COLUMN "receipt_ref",
DROP COLUMN "tenant_id",
DROP COLUMN "unit_cost",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "qtyReceived" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "qtyRemaining" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "receiptDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "receiptRef" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "unitCost" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "inventory_cost_profiles" DROP COLUMN "active_from",
DROP COLUMN "created_at",
DROP COLUMN "created_by_id",
DROP COLUMN "product_id",
DROP COLUMN "standard_cost",
DROP COLUMN "tenant_id",
DROP COLUMN "updated_at",
DROP COLUMN "warehouse_id",
ADD COLUMN     "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "standardCost" DECIMAL(18,4),
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "item_barcodes" DROP COLUMN "symbology",
ADD COLUMN     "symbology" "BarcodeSymbology" NOT NULL;

-- AlterTable
ALTER TABLE "label_templates" DROP COLUMN "template_type",
ADD COLUMN     "template_type" "LabelTemplateType" NOT NULL;

-- AlterTable
ALTER TABLE "landed_cost_allocations" DROP COLUMN "addedToItemCost",
DROP COLUMN "allocatedAmount",
DROP COLUMN "allocationBasis",
DROP COLUMN "allocationPct",
DROP COLUMN "chargeType",
DROP COLUMN "createdAt",
DROP COLUMN "productId",
DROP COLUMN "stockEntryId",
DROP COLUMN "stockEntryItemId",
DROP COLUMN "tenantId",
DROP COLUMN "updatedAt",
DROP COLUMN "voucherId",
ADD COLUMN     "added_to_item_cost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allocated_amount" DECIMAL(15,4) NOT NULL,
ADD COLUMN     "allocation_basis" DECIMAL(15,4) NOT NULL,
ADD COLUMN     "allocation_pct" DECIMAL(8,6) NOT NULL,
ADD COLUMN     "charge_type" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "stock_entry_id" TEXT NOT NULL,
ADD COLUMN     "stock_entry_item_id" TEXT,
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "voucher_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "landed_cost_charge_lines" DROP COLUMN "accountCode",
DROP COLUMN "chargeType",
DROP COLUMN "createdAt",
DROP COLUMN "tenantId",
DROP COLUMN "updatedAt",
DROP COLUMN "voucherId",
ADD COLUMN     "account_code" TEXT,
ADD COLUMN     "charge_type" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "voucher_id" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "landed_cost_receipt_links" DROP COLUMN "createdAt",
DROP COLUMN "stockEntryId",
DROP COLUMN "tenantId",
DROP COLUMN "totalQty",
DROP COLUMN "totalValue",
DROP COLUMN "totalVolume",
DROP COLUMN "totalWeight",
DROP COLUMN "updatedAt",
DROP COLUMN "voucherId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stock_entry_id" TEXT NOT NULL,
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "total_qty" DECIMAL(15,4) NOT NULL,
ADD COLUMN     "total_value" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "total_volume" DECIMAL(15,4),
ADD COLUMN     "total_weight" DECIMAL(15,4),
ADD COLUMN     "voucher_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "landed_cost_vouchers" DROP COLUMN "allocatedAt",
DROP COLUMN "allocationMethod",
DROP COLUMN "createdAt",
DROP COLUMN "createdBy",
DROP COLUMN "invoiceRef",
DROP COLUMN "tenantId",
DROP COLUMN "totalAmount",
DROP COLUMN "updatedAt",
DROP COLUMN "vendorId",
DROP COLUMN "voucherNumber",
ADD COLUMN     "allocated_at" TIMESTAMP(3),
ADD COLUMN     "allocation_method" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "invoice_ref" TEXT,
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "total_amount" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendor_id" TEXT,
ADD COLUMN     "voucher_number" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "load_plans" ALTER COLUMN "planned_load_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "lot_disposal_records" DROP COLUMN "created_at",
DROP COLUMN "disposal_method",
DROP COLUMN "disposal_number",
DROP COLUMN "disposed_at",
DROP COLUMN "disposed_by_id",
DROP COLUMN "lot_id",
DROP COLUMN "qty_disposed",
DROP COLUMN "tenant_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "disposalMethod" "DisposalMethod" NOT NULL,
ADD COLUMN     "disposalNumber" TEXT NOT NULL,
ADD COLUMN     "disposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "disposedById" TEXT NOT NULL,
ADD COLUMN     "lotId" TEXT NOT NULL,
ADD COLUMN     "qtyDisposed" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lot_expiry_alerts" DROP COLUMN "alert_level",
DROP COLUMN "alerted_at",
DROP COLUMN "days_to_expiry",
DROP COLUMN "lot_id",
DROP COLUMN "tenant_id",
ADD COLUMN     "alertLevel" "ExpiryAlertLevel" NOT NULL,
ADD COLUMN     "alertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "daysToExpiry" INTEGER NOT NULL,
ADD COLUMN     "lotId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lot_expiry_records" DROP COLUMN "created_at",
DROP COLUMN "created_by_id",
DROP COLUMN "expiry_date",
DROP COLUMN "lot_number",
DROP COLUMN "manufacture_date",
DROP COLUMN "product_id",
DROP COLUMN "receipt_ref",
DROP COLUMN "remaining_qty",
DROP COLUMN "supplier_id",
DROP COLUMN "tenant_id",
DROP COLUMN "updated_at",
DROP COLUMN "warehouse_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "expiryDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lotNumber" TEXT NOT NULL,
ADD COLUMN     "manufactureDate" TIMESTAMP(3),
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "receiptRef" TEXT,
ADD COLUMN     "remainingQty" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "packaging_specs" DROP COLUMN "level",
ADD COLUMN     "level" "PackagingLevel" NOT NULL;

-- AlterTable
ALTER TABLE "packing_plans" ALTER COLUMN "planned_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pallet_types" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "product_recalls" DROP COLUMN "recall_class",
ADD COLUMN     "recall_class" "RecallClass" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "RecallStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "affected_lot_numbers" DROP DEFAULT,
ALTER COLUMN "affected_serials" DROP DEFAULT,
DROP COLUMN "action_required",
ADD COLUMN     "action_required" "RecallActionType" NOT NULL;

-- AlterTable
ALTER TABLE "recall_disposal_records" DROP COLUMN "action_type",
ADD COLUMN     "action_type" "RecallActionType" NOT NULL;

-- AlterTable
ALTER TABLE "safety_data_sheets" ALTER COLUMN "issue_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expiry_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "acknowledged_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "stock_write_down_requests" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "original_value_per_unit" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "proposed_value_per_unit" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stock_write_off_records" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "book_value_per_unit" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "total_write_off" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "supplier_price_tiers" ALTER COLUMN "effective_from" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "effective_to" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "temperature_excursions" ALTER COLUMN "recorded_temp_c" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "recorded_humidity_pct" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_presence" ADD COLUMN     "clear_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendor_item_attributes" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vmi_agreements" DROP COLUMN "activated_at",
DROP COLUMN "agreement_number",
DROP COLUMN "created_at",
DROP COLUMN "created_by_id",
DROP COLUMN "max_qty",
DROP COLUMN "min_qty",
DROP COLUMN "product_id",
DROP COLUMN "replen_trigger",
DROP COLUMN "review_cycle_days",
DROP COLUMN "target_qty",
DROP COLUMN "tenant_id",
DROP COLUMN "terminated_at",
DROP COLUMN "updated_at",
DROP COLUMN "vendor_id",
DROP COLUMN "vendor_lead_days",
DROP COLUMN "warehouse_id",
ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "agreementNumber" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "maxQty" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "minQty" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "replenTrigger" "VmiReplenTrigger" NOT NULL DEFAULT 'BELOW_MIN',
ADD COLUMN     "reviewCycleDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "targetQty" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "terminatedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendorId" TEXT NOT NULL,
ADD COLUMN     "vendorLeadDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vmi_orders" DROP COLUMN "agreement_id",
DROP COLUMN "cancel_reason",
DROP COLUMN "cancelled_at",
DROP COLUMN "confirmed_at",
DROP COLUMN "created_at",
DROP COLUMN "order_number",
DROP COLUMN "ordered_qty",
DROP COLUMN "received_at",
DROP COLUMN "received_qty",
DROP COLUMN "shipped_at",
DROP COLUMN "tenant_id",
DROP COLUMN "triggered_at",
DROP COLUMN "triggered_by",
DROP COLUMN "updated_at",
DROP COLUMN "vendor_id",
ADD COLUMN     "agreementId" TEXT NOT NULL,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "orderNumber" TEXT NOT NULL,
ADD COLUMN     "orderedQty" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "receivedQty" DECIMAL(18,4),
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "triggeredBy" "VmiReplenTrigger" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vmi_stock_snapshots" DROP COLUMN "agreement_id",
DROP COLUMN "created_at",
DROP COLUMN "on_hand_qty",
DROP COLUMN "on_order_qty",
DROP COLUMN "recorded_by_id",
DROP COLUMN "snapshot_date",
DROP COLUMN "tenant_id",
ADD COLUMN     "agreementId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "onHandQty" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "onOrderQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "recordedById" TEXT NOT NULL,
ADD COLUMN     "snapshotDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "AllocationMethod";

-- DropEnum
DROP TYPE "LandedChargeType";

-- DropEnum
DROP TYPE "LandedCostStatus";

-- CreateTable
CREATE TABLE "saved_views" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resource_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_tabs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LINK',
    "label" TEXT NOT NULL,
    "icon" TEXT DEFAULT 'Link',
    "url" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_tabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_edits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "previous_content" TEXT NOT NULL,
    "new_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_edits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_forwards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "from_channel_id" TEXT NOT NULL,
    "to_channel_id" TEXT NOT NULL,
    "forwarded_by" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_forwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_moderation" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "slow_mode_secs" INTEGER NOT NULL DEFAULT 0,
    "who_can_post" TEXT NOT NULL DEFAULT 'EVERYONE',
    "only_admins_can_pin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_moderation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_participants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "is_hand_raised" BOOLEAN NOT NULL DEFAULT false,
    "is_screen_sharing" BOOLEAN NOT NULL DEFAULT false,
    "is_muted" BOOLEAN NOT NULL DEFAULT true,
    "is_video_on" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_chat_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_recordings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "file_url" TEXT,
    "file_size" INTEGER,
    "duration_secs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'RECORDING',
    "started_by" TEXT NOT NULL,

    CONSTRAINT "meeting_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_bots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT DEFAULT '🤖',
    "webhook_url" TEXT,
    "token" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connect_bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_status_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "presence" TEXT NOT NULL,
    "status_text" TEXT,
    "status_emoji" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_status_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "reactions" INTEGER NOT NULL DEFAULT 0,
    "threads" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_views_tenant_id_idx" ON "saved_views"("tenant_id");

-- CreateIndex
CREATE INDEX "saved_views_user_id_idx" ON "saved_views"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_views_tenant_id_user_id_resource_name_name_key" ON "saved_views"("tenant_id", "user_id", "resource_name", "name");

-- CreateIndex
CREATE INDEX "channel_tabs_tenant_id_channel_id_idx" ON "channel_tabs"("tenant_id", "channel_id");

-- CreateIndex
CREATE INDEX "message_edits_tenant_id_message_id_idx" ON "message_edits"("tenant_id", "message_id");

-- CreateIndex
CREATE INDEX "message_forwards_tenant_id_to_channel_id_idx" ON "message_forwards"("tenant_id", "to_channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_moderation_channel_id_key" ON "channel_moderation"("channel_id");

-- CreateIndex
CREATE INDEX "channel_moderation_tenant_id_idx" ON "channel_moderation"("tenant_id");

-- CreateIndex
CREATE INDEX "meeting_participants_tenant_id_meeting_id_idx" ON "meeting_participants"("tenant_id", "meeting_id");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participants_meeting_id_user_id_key" ON "meeting_participants"("meeting_id", "user_id");

-- CreateIndex
CREATE INDEX "meeting_chat_messages_tenant_id_meeting_id_idx" ON "meeting_chat_messages"("tenant_id", "meeting_id");

-- CreateIndex
CREATE INDEX "meeting_recordings_tenant_id_meeting_id_idx" ON "meeting_recordings"("tenant_id", "meeting_id");

-- CreateIndex
CREATE UNIQUE INDEX "connect_bots_webhook_url_key" ON "connect_bots"("webhook_url");

-- CreateIndex
CREATE INDEX "connect_bots_tenant_id_channel_id_idx" ON "connect_bots"("tenant_id", "channel_id");

-- CreateIndex
CREATE INDEX "user_status_schedules_tenant_id_user_id_idx" ON "user_status_schedules"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "user_status_schedules_tenant_id_start_time_end_time_idx" ON "user_status_schedules"("tenant_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "channel_analytics_tenant_id_channel_id_idx" ON "channel_analytics"("tenant_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_analytics_tenant_id_channel_id_date_key" ON "channel_analytics"("tenant_id", "channel_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "connect_poll_votes_poll_id_user_id_key" ON "connect_poll_votes"("poll_id", "user_id");

-- CreateIndex
CREATE INDEX "cost_adjustments_tenant_id_idx" ON "cost_adjustments"("tenant_id");

-- CreateIndex
CREATE INDEX "cost_adjustments_tenant_id_product_id_idx" ON "cost_adjustments"("tenant_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_emojis_tenant_id_name_key" ON "custom_emojis"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "freight_claims_tenant_id_claimType_idx" ON "freight_claims"("tenant_id", "claimType");

-- CreateIndex
CREATE INDEX "inventory_cost_adjustments_tenantId_idx" ON "inventory_cost_adjustments"("tenantId");

-- CreateIndex
CREATE INDEX "inventory_cost_adjustments_tenantId_profileId_idx" ON "inventory_cost_adjustments"("tenantId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_cost_adjustments_tenantId_adjustmentNumber_key" ON "inventory_cost_adjustments"("tenantId", "adjustmentNumber");

-- CreateIndex
CREATE INDEX "inventory_cost_layers_tenantId_idx" ON "inventory_cost_layers"("tenantId");

-- CreateIndex
CREATE INDEX "inventory_cost_layers_tenantId_profileId_idx" ON "inventory_cost_layers"("tenantId", "profileId");

-- CreateIndex
CREATE INDEX "inventory_cost_layers_tenantId_profileId_status_idx" ON "inventory_cost_layers"("tenantId", "profileId", "status");

-- CreateIndex
CREATE INDEX "inventory_cost_profiles_tenantId_idx" ON "inventory_cost_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "inventory_cost_profiles_tenantId_productId_idx" ON "inventory_cost_profiles"("tenantId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_cost_profiles_tenantId_productId_warehouseId_key" ON "inventory_cost_profiles"("tenantId", "productId", "warehouseId");

-- CreateIndex
CREATE INDEX "landed_cost_allocations_tenant_id_idx" ON "landed_cost_allocations"("tenant_id");

-- CreateIndex
CREATE INDEX "landed_cost_allocations_voucher_id_idx" ON "landed_cost_allocations"("voucher_id");

-- CreateIndex
CREATE INDEX "landed_cost_allocations_tenant_id_product_id_idx" ON "landed_cost_allocations"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "landed_cost_charge_lines_tenant_id_idx" ON "landed_cost_charge_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "landed_cost_charge_lines_voucher_id_idx" ON "landed_cost_charge_lines"("voucher_id");

-- CreateIndex
CREATE INDEX "landed_cost_receipt_links_tenant_id_idx" ON "landed_cost_receipt_links"("tenant_id");

-- CreateIndex
CREATE INDEX "landed_cost_receipt_links_voucher_id_idx" ON "landed_cost_receipt_links"("voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "landed_cost_receipt_links_voucher_id_stock_entry_id_key" ON "landed_cost_receipt_links"("voucher_id", "stock_entry_id");

-- CreateIndex
CREATE INDEX "landed_cost_vouchers_tenant_id_idx" ON "landed_cost_vouchers"("tenant_id");

-- CreateIndex
CREATE INDEX "landed_cost_vouchers_tenant_id_status_idx" ON "landed_cost_vouchers"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "landed_cost_vouchers_tenant_id_voucher_number_key" ON "landed_cost_vouchers"("tenant_id", "voucher_number");

-- CreateIndex
CREATE INDEX "lot_disposal_records_tenantId_idx" ON "lot_disposal_records"("tenantId");

-- CreateIndex
CREATE INDEX "lot_disposal_records_tenantId_lotId_idx" ON "lot_disposal_records"("tenantId", "lotId");

-- CreateIndex
CREATE UNIQUE INDEX "lot_disposal_records_tenantId_disposalNumber_key" ON "lot_disposal_records"("tenantId", "disposalNumber");

-- CreateIndex
CREATE INDEX "lot_expiry_alerts_tenantId_idx" ON "lot_expiry_alerts"("tenantId");

-- CreateIndex
CREATE INDEX "lot_expiry_alerts_tenantId_lotId_idx" ON "lot_expiry_alerts"("tenantId", "lotId");

-- CreateIndex
CREATE INDEX "lot_expiry_alerts_tenantId_dismissed_idx" ON "lot_expiry_alerts"("tenantId", "dismissed");

-- CreateIndex
CREATE INDEX "lot_expiry_records_tenantId_idx" ON "lot_expiry_records"("tenantId");

-- CreateIndex
CREATE INDEX "lot_expiry_records_tenantId_productId_idx" ON "lot_expiry_records"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "lot_expiry_records_tenantId_expiryDate_idx" ON "lot_expiry_records"("tenantId", "expiryDate");

-- CreateIndex
CREATE INDEX "lot_expiry_records_tenantId_status_idx" ON "lot_expiry_records"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lot_expiry_records_tenantId_lotNumber_productId_warehouseId_key" ON "lot_expiry_records"("tenantId", "lotNumber", "productId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "packaging_specs_tenant_id_product_id_level_key" ON "packaging_specs"("tenant_id", "product_id", "level");

-- CreateIndex
CREATE INDEX "product_recalls_tenant_id_status_idx" ON "product_recalls"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "stock_revaluation_lines_tenant_id_idx" ON "stock_revaluation_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_revaluation_lines_revaluation_id_idx" ON "stock_revaluation_lines"("revaluation_id");

-- CreateIndex
CREATE INDEX "stock_revaluations_tenant_id_idx" ON "stock_revaluations"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_valuation_ledger_tenant_id_idx" ON "stock_valuation_ledger"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_valuation_ledger_tenant_id_product_id_idx" ON "stock_valuation_ledger"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_valuation_ledger_tenant_id_product_id_warehouse_id_idx" ON "stock_valuation_ledger"("tenant_id", "product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "stock_valuation_ledger_transaction_ref_idx" ON "stock_valuation_ledger"("transaction_ref");

-- CreateIndex
CREATE INDEX "stock_valuation_policies_tenant_id_idx" ON "stock_valuation_policies"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_valuation_policies_tenant_id_product_id_idx" ON "stock_valuation_policies"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "transfer_order_lines_tenant_id_idx" ON "transfer_order_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "transfer_order_lines_transfer_order_id_idx" ON "transfer_order_lines"("transfer_order_id");

-- CreateIndex
CREATE INDEX "transfer_order_lines_tenant_id_product_id_idx" ON "transfer_order_lines"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "transfer_order_receipt_lines_tenant_id_idx" ON "transfer_order_receipt_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "transfer_order_receipt_lines_receipt_id_idx" ON "transfer_order_receipt_lines"("receipt_id");

-- CreateIndex
CREATE INDEX "transfer_order_receipts_tenant_id_idx" ON "transfer_order_receipts"("tenant_id");

-- CreateIndex
CREATE INDEX "transfer_order_receipts_transfer_order_id_idx" ON "transfer_order_receipts"("transfer_order_id");

-- CreateIndex
CREATE INDEX "transfer_orders_tenant_id_idx" ON "transfer_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "transfer_orders_tenant_id_from_warehouse_id_idx" ON "transfer_orders"("tenant_id", "from_warehouse_id");

-- CreateIndex
CREATE INDEX "transfer_orders_tenant_id_to_warehouse_id_idx" ON "transfer_orders"("tenant_id", "to_warehouse_id");

-- CreateIndex
CREATE INDEX "transfer_orders_tenant_id_status_idx" ON "transfer_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "vmi_agreements_tenantId_idx" ON "vmi_agreements"("tenantId");

-- CreateIndex
CREATE INDEX "vmi_agreements_tenantId_vendorId_idx" ON "vmi_agreements"("tenantId", "vendorId");

-- CreateIndex
CREATE INDEX "vmi_agreements_tenantId_status_idx" ON "vmi_agreements"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vmi_agreements_tenantId_agreementNumber_key" ON "vmi_agreements"("tenantId", "agreementNumber");

-- CreateIndex
CREATE INDEX "vmi_orders_tenantId_idx" ON "vmi_orders"("tenantId");

-- CreateIndex
CREATE INDEX "vmi_orders_tenantId_agreementId_idx" ON "vmi_orders"("tenantId", "agreementId");

-- CreateIndex
CREATE INDEX "vmi_orders_tenantId_status_idx" ON "vmi_orders"("tenantId", "status");

-- CreateIndex
CREATE INDEX "vmi_orders_tenantId_vendorId_idx" ON "vmi_orders"("tenantId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "vmi_orders_tenantId_orderNumber_key" ON "vmi_orders"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "vmi_stock_snapshots_tenantId_idx" ON "vmi_stock_snapshots"("tenantId");

-- CreateIndex
CREATE INDEX "vmi_stock_snapshots_tenantId_agreementId_idx" ON "vmi_stock_snapshots"("tenantId", "agreementId");

-- CreateIndex
CREATE INDEX "vmi_stock_snapshots_tenantId_snapshotDate_idx" ON "vmi_stock_snapshots"("tenantId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_tabs" ADD CONSTRAINT "channel_tabs_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_edits" ADD CONSTRAINT "message_edits_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_forwards" ADD CONSTRAINT "message_forwards_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_forwards" ADD CONSTRAINT "message_forwards_from_channel_id_fkey" FOREIGN KEY ("from_channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_forwards" ADD CONSTRAINT "message_forwards_to_channel_id_fkey" FOREIGN KEY ("to_channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_moderation" ADD CONSTRAINT "channel_moderation_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "connect_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_chat_messages" ADD CONSTRAINT "meeting_chat_messages_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "connect_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_recordings" ADD CONSTRAINT "meeting_recordings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "connect_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_bots" ADD CONSTRAINT "connect_bots_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_analytics" ADD CONSTRAINT "channel_analytics_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_scorecards" ADD CONSTRAINT "supplier_scorecards_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_ncrs" ADD CONSTRAINT "supplier_ncrs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_car_requests" ADD CONSTRAINT "supplier_car_requests_ncr_id_fkey" FOREIGN KEY ("ncr_id") REFERENCES "supplier_ncrs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_car_requests" ADD CONSTRAINT "supplier_car_requests_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_inbound_shipment_id_fkey" FOREIGN KEY ("inbound_shipment_id") REFERENCES "inbound_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_outbound_shipment_id_fkey" FOREIGN KEY ("outbound_shipment_id") REFERENCES "outbound_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landed_cost_charge_lines" ADD CONSTRAINT "landed_cost_charge_lines_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "landed_cost_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landed_cost_receipt_links" ADD CONSTRAINT "landed_cost_receipt_links_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "landed_cost_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landed_cost_allocations" ADD CONSTRAINT "landed_cost_allocations_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "landed_cost_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_appointments" ADD CONSTRAINT "yard_appointments_dock_door_id_fkey" FOREIGN KEY ("dock_door_id") REFERENCES "dock_doors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "yard_appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_moves" ADD CONSTRAINT "yard_moves_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "yard_appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "count_sheets" ADD CONSTRAINT "count_sheets_stock_take_id_fkey" FOREIGN KEY ("stock_take_id") REFERENCES "stock_takes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "count_sheet_items" ADD CONSTRAINT "count_sheet_items_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "count_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_take_variances" ADD CONSTRAINT "stock_take_variances_stock_take_id_fkey" FOREIGN KEY ("stock_take_id") REFERENCES "stock_takes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_data_sheets" ADD CONSTRAINT "safety_data_sheets_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "hazmat_classifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hazmat_manifest_lines" ADD CONSTRAINT "hazmat_manifest_lines_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "hazmat_manifests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hazmat_manifest_lines" ADD CONSTRAINT "hazmat_manifest_lines_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "hazmat_classifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_price_tiers" ADD CONSTRAINT "supplier_price_tiers_approved_supplier_id_fkey" FOREIGN KEY ("approved_supplier_id") REFERENCES "approved_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asl_change_logs" ADD CONSTRAINT "asl_change_logs_approved_supplier_id_fkey" FOREIGN KEY ("approved_supplier_id") REFERENCES "approved_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plans" ADD CONSTRAINT "load_plans_container_type_id_fkey" FOREIGN KEY ("container_type_id") REFERENCES "container_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plan_pallets" ADD CONSTRAINT "load_plan_pallets_load_plan_id_fkey" FOREIGN KEY ("load_plan_id") REFERENCES "load_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plan_pallets" ADD CONSTRAINT "load_plan_pallets_pallet_type_id_fkey" FOREIGN KEY ("pallet_type_id") REFERENCES "pallet_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plan_items" ADD CONSTRAINT "load_plan_items_load_plan_id_fkey" FOREIGN KEY ("load_plan_id") REFERENCES "load_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_cartons" ADD CONSTRAINT "load_cartons_packing_plan_id_fkey" FOREIGN KEY ("packing_plan_id") REFERENCES "packing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_carton_items" ADD CONSTRAINT "load_carton_items_carton_id_fkey" FOREIGN KEY ("carton_id") REFERENCES "load_cartons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catch_weight_readings" ADD CONSTRAINT "catch_weight_readings_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "catch_weight_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recall_affected_stocks" ADD CONSTRAINT "recall_affected_stocks_recall_id_fkey" FOREIGN KEY ("recall_id") REFERENCES "product_recalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recall_customer_notices" ADD CONSTRAINT "recall_customer_notices_recall_id_fkey" FOREIGN KEY ("recall_id") REFERENCES "product_recalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recall_disposal_records" ADD CONSTRAINT "recall_disposal_records_recall_id_fkey" FOREIGN KEY ("recall_id") REFERENCES "product_recalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_barcodes" ADD CONSTRAINT "item_barcodes_packaging_spec_id_fkey" FOREIGN KEY ("packaging_spec_id") REFERENCES "packaging_specs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "label_assignments" ADD CONSTRAINT "label_assignments_packaging_spec_id_fkey" FOREIGN KEY ("packaging_spec_id") REFERENCES "packaging_specs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "label_assignments" ADD CONSTRAINT "label_assignments_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "label_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_excursions" ADD CONSTRAINT "temperature_excursions_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "cold_chain_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vmi_stock_snapshots" ADD CONSTRAINT "vmi_stock_snapshots_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "vmi_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vmi_orders" ADD CONSTRAINT "vmi_orders_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "vmi_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_cost_layers" ADD CONSTRAINT "inventory_cost_layers_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "inventory_cost_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_expiry_alerts" ADD CONSTRAINT "lot_expiry_alerts_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lot_expiry_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_disposal_records" ADD CONSTRAINT "lot_disposal_records_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lot_expiry_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "bin_replenishment_rules_tenant_warehouse_product_bin_key" RENAME TO "bin_replenishment_rules_tenant_id_warehouse_id_product_id_a_key";

-- RenameIndex
ALTER INDEX "catch_weight_configs_tenant_product_key" RENAME TO "catch_weight_configs_tenant_id_product_id_key";

-- RenameIndex
ALTER INDEX "catch_weight_readings_ref_idx" RENAME TO "catch_weight_readings_reference_type_reference_id_idx";

-- RenameIndex
ALTER INDEX "catch_weight_tares_tenant_label_key" RENAME TO "catch_weight_tares_tenant_id_container_label_key";

-- RenameIndex
ALTER INDEX "count_sheets_tenant_stock_take_sheet_key" RENAME TO "count_sheets_tenant_id_stock_take_id_sheet_number_key";

-- RenameIndex
ALTER INDEX "dock_doors_tenant_warehouse_door_key" RENAME TO "dock_doors_tenant_id_warehouse_id_door_number_key";

-- RenameIndex
ALTER INDEX "gate_passes_tenant_number_key" RENAME TO "gate_passes_tenant_id_pass_number_key";

-- RenameIndex
ALTER INDEX "goods_receipt_notes_tenant_id_po_idx" RENAME TO "goods_receipt_notes_tenant_id_purchase_order_id_idx";

-- RenameIndex
ALTER INDEX "gs1_ai_tenant_ai_key" RENAME TO "gs1_application_identifiers_tenant_id_ai_key";

-- RenameIndex
ALTER INDEX "gs1_ai_tenant_id_idx" RENAME TO "gs1_application_identifiers_tenant_id_idx";

-- RenameIndex
ALTER INDEX "item_barcodes_spec_id_idx" RENAME TO "item_barcodes_packaging_spec_id_idx";

-- RenameIndex
ALTER INDEX "item_barcodes_tenant_barcode_key" RENAME TO "item_barcodes_tenant_id_barcode_value_key";

-- RenameIndex
ALTER INDEX "label_assignments_spec_id_idx" RENAME TO "label_assignments_packaging_spec_id_idx";

-- RenameIndex
ALTER INDEX "label_templates_tenant_name_version_key" RENAME TO "label_templates_tenant_id_name_version_key";

-- RenameIndex
ALTER INDEX "packing_carton_items_carton_id_idx" RENAME TO "load_carton_items_carton_id_idx";

-- RenameIndex
ALTER INDEX "packing_carton_items_tenant_id_idx" RENAME TO "load_carton_items_tenant_id_idx";

-- RenameIndex
ALTER INDEX "packaging_specs_tenant_product_idx" RENAME TO "packaging_specs_tenant_id_product_id_idx";

-- RenameIndex
ALTER INDEX "packaging_specs_tenant_product_level_key" RENAME TO "packaging_specs_tenant_id_product_id_level_key";

-- RenameIndex
ALTER INDEX "product_recalls_tenant_number_key" RENAME TO "product_recalls_tenant_id_recall_number_key";

-- RenameIndex
ALTER INDEX "product_recalls_tenant_status_idx" RENAME TO "product_recalls_tenant_id_status_idx";

-- RenameIndex
ALTER INDEX "product_velocity_snapshots_tenant_product_warehouse_month_key" RENAME TO "product_velocity_snapshots_tenant_id_product_id_warehouse_i_key";

-- RenameIndex
ALTER INDEX "reorder_points_tenant_product_warehouse_key" RENAME TO "reorder_points_tenant_id_product_id_warehouse_id_key";

-- RenameIndex
ALTER INDEX "replenishment_orders_tenant_order_number_key" RENAME TO "replenishment_orders_tenant_id_order_number_key";

-- RenameIndex
ALTER INDEX "safety_stock_configs_tenant_product_warehouse_key" RENAME TO "safety_stock_configs_tenant_id_product_id_warehouse_id_key";

-- RenameIndex
ALTER INDEX "sscc_records_tenant_sscc_key" RENAME TO "sscc_records_tenant_id_sscc_key";

-- RenameIndex
ALTER INDEX "stock_takes_tenant_number_key" RENAME TO "stock_takes_tenant_id_stock_take_number_key";

-- RenameIndex
ALTER INDEX "velocity_classification_items_run_id_product_id_warehouse_id_ke" RENAME TO "velocity_classification_items_run_id_product_id_warehouse_i_key";

-- RenameIndex
ALTER INDEX "vendor_item_attributes_product_vendor_idx" RENAME TO "vendor_item_attributes_product_id_vendor_id_idx";

-- RenameIndex
ALTER INDEX "yard_appointments_tenant_number_key" RENAME TO "yard_appointments_tenant_id_appointment_number_key";

