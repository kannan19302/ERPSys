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

ALTER TABLE "approved_suppliers" ALTER COLUMN "qualification_date" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "approved_suppliers" ALTER COLUMN "expiry_date" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "approved_suppliers" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "approved_suppliers" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "approved_suppliers" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "asl_change_logs" ALTER COLUMN "changed_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "asl_compliance_rules" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "asl_compliance_rules" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "asl_compliance_rules" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "catch_weight_readings" ALTER COLUMN "variance_status" DROP DEFAULT;
ALTER TABLE "catch_weight_readings" ALTER COLUMN "variance_status" TYPE "CatchWeightVariance" USING "variance_status"::text::"CatchWeightVariance";

ALTER TABLE "cold_chain_requirements" ALTER COLUMN "min_temp_celsius" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "cold_chain_requirements" ALTER COLUMN "max_temp_celsius" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "cold_chain_requirements" ALTER COLUMN "min_humidity_pct" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "cold_chain_requirements" ALTER COLUMN "max_humidity_pct" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "cold_chain_requirements" ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "connect_meetings" ADD COLUMN     "lobby" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "container_types" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "cross_dock_orders" RENAME COLUMN "completedAt" TO "completed_at";
ALTER TABLE "cross_dock_orders" ALTER COLUMN "completed_at" DROP DEFAULT;
ALTER TABLE "cross_dock_orders" ALTER COLUMN "completed_at" TYPE TIMESTAMP(3) USING "completed_at"::text::TIMESTAMP(3);

ALTER TABLE "freight_claims" RENAME COLUMN "claim_type" TO "claimType";
ALTER TABLE "freight_claims" ALTER COLUMN "claimType" DROP DEFAULT;
ALTER TABLE "freight_claims" ALTER COLUMN "claimType" TYPE "FreightClaimType" USING "claimType"::text::"FreightClaimType";

ALTER TABLE "hazmat_classifications" ALTER COLUMN "subsidiary_hazards" DROP DEFAULT;
ALTER TABLE "hazmat_classifications" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "hazmat_classifications" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "hazmat_classifications" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "hazmat_incidents" ALTER COLUMN "incident_date" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "hazmat_incidents" ALTER COLUMN "closed_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "hazmat_incidents" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "hazmat_incidents" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "hazmat_incidents" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "hazmat_manifests" ALTER COLUMN "shipped_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "hazmat_manifests" ALTER COLUMN "delivered_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "hazmat_manifests" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "hazmat_manifests" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "hazmat_manifests" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "hazmat_storage_rules" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "inventory_cost_adjustments" RENAME COLUMN "adjusted_at" TO "adjustedAt";
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "adjustedAt" DROP DEFAULT;
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "adjustedAt" TYPE TIMESTAMP(3) USING "adjustedAt"::text::TIMESTAMP(3);
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "adjustedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "inventory_cost_adjustments" RENAME COLUMN "adjusted_by_id" TO "adjustedById";
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "adjustedById" DROP DEFAULT;
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "adjustedById" TYPE TEXT USING "adjustedById"::text::TEXT;
ALTER TABLE "inventory_cost_adjustments" RENAME COLUMN "adjustment_number" TO "adjustmentNumber";
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "adjustmentNumber" DROP DEFAULT;
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "adjustmentNumber" TYPE TEXT USING "adjustmentNumber"::text::TEXT;
ALTER TABLE "inventory_cost_adjustments" RENAME COLUMN "adjustment_type" TO "adjustmentType";
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "adjustmentType" DROP DEFAULT;
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "adjustmentType" TYPE "CostAdjustmentType" USING "adjustmentType"::text::"CostAdjustmentType";
ALTER TABLE "inventory_cost_adjustments" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt"::text::TIMESTAMP(3);
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "inventory_cost_adjustments" RENAME COLUMN "profile_id" TO "profileId";
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "profileId" DROP DEFAULT;
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "profileId" TYPE TEXT USING "profileId"::text::TEXT;
ALTER TABLE "inventory_cost_adjustments" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "inventory_cost_adjustments" ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::text::TEXT;

ALTER TABLE "inventory_cost_layers" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt"::text::TIMESTAMP(3);
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "inventory_cost_layers" RENAME COLUMN "profile_id" TO "profileId";
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "profileId" DROP DEFAULT;
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "profileId" TYPE TEXT USING "profileId"::text::TEXT;
ALTER TABLE "inventory_cost_layers" RENAME COLUMN "qty_received" TO "qtyReceived";
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "qtyReceived" DROP DEFAULT;
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "qtyReceived" TYPE DECIMAL(18,4) USING "qtyReceived"::text::DECIMAL(18,4);
ALTER TABLE "inventory_cost_layers" RENAME COLUMN "qty_remaining" TO "qtyRemaining";
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "qtyRemaining" DROP DEFAULT;
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "qtyRemaining" TYPE DECIMAL(18,4) USING "qtyRemaining"::text::DECIMAL(18,4);
ALTER TABLE "inventory_cost_layers" RENAME COLUMN "receipt_date" TO "receiptDate";
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "receiptDate" DROP DEFAULT;
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "receiptDate" TYPE TIMESTAMP(3) USING "receiptDate"::text::TIMESTAMP(3);
ALTER TABLE "inventory_cost_layers" RENAME COLUMN "receipt_ref" TO "receiptRef";
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "receiptRef" DROP DEFAULT;
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "receiptRef" TYPE TEXT USING "receiptRef"::text::TEXT;
ALTER TABLE "inventory_cost_layers" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::text::TEXT;
ALTER TABLE "inventory_cost_layers" RENAME COLUMN "unit_cost" TO "unitCost";
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "unitCost" DROP DEFAULT;
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "unitCost" TYPE DECIMAL(18,4) USING "unitCost"::text::DECIMAL(18,4);
ALTER TABLE "inventory_cost_layers" RENAME COLUMN "updated_at" TO "updatedAt";
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "inventory_cost_layers" ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt"::text::TIMESTAMP(3);

ALTER TABLE "inventory_cost_profiles" RENAME COLUMN "active_from" TO "activeFrom";
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "activeFrom" DROP DEFAULT;
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "activeFrom" TYPE TIMESTAMP(3) USING "activeFrom"::text::TIMESTAMP(3);
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "activeFrom" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "inventory_cost_profiles" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt"::text::TIMESTAMP(3);
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "inventory_cost_profiles" RENAME COLUMN "created_by_id" TO "createdById";
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "createdById" DROP DEFAULT;
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "createdById" TYPE TEXT USING "createdById"::text::TEXT;
ALTER TABLE "inventory_cost_profiles" RENAME COLUMN "product_id" TO "productId";
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "productId" DROP DEFAULT;
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "productId" TYPE TEXT USING "productId"::text::TEXT;
ALTER TABLE "inventory_cost_profiles" RENAME COLUMN "standard_cost" TO "standardCost";
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "standardCost" DROP DEFAULT;
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "standardCost" TYPE DECIMAL(18,4) USING "standardCost"::text::DECIMAL(18,4);
ALTER TABLE "inventory_cost_profiles" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::text::TEXT;
ALTER TABLE "inventory_cost_profiles" RENAME COLUMN "updated_at" TO "updatedAt";
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt"::text::TIMESTAMP(3);
ALTER TABLE "inventory_cost_profiles" RENAME COLUMN "warehouse_id" TO "warehouseId";
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "warehouseId" DROP DEFAULT;
ALTER TABLE "inventory_cost_profiles" ALTER COLUMN "warehouseId" TYPE TEXT USING "warehouseId"::text::TEXT;

ALTER TABLE "item_barcodes" ALTER COLUMN "symbology" DROP DEFAULT;
ALTER TABLE "item_barcodes" ALTER COLUMN "symbology" TYPE "BarcodeSymbology" USING "symbology"::text::"BarcodeSymbology";

ALTER TABLE "label_templates" ALTER COLUMN "template_type" DROP DEFAULT;
ALTER TABLE "label_templates" ALTER COLUMN "template_type" TYPE "LabelTemplateType" USING "template_type"::text::"LabelTemplateType";

ALTER TABLE "landed_cost_allocations" RENAME COLUMN "addedToItemCost" TO "added_to_item_cost";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "added_to_item_cost" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "added_to_item_cost" TYPE BOOLEAN USING "added_to_item_cost"::text::BOOLEAN;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "added_to_item_cost" SET DEFAULT false;
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "allocatedAmount" TO "allocated_amount";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "allocated_amount" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "allocated_amount" TYPE DECIMAL(15,4) USING "allocated_amount"::text::DECIMAL(15,4);
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "allocationBasis" TO "allocation_basis";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "allocation_basis" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "allocation_basis" TYPE DECIMAL(15,4) USING "allocation_basis"::text::DECIMAL(15,4);
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "allocationPct" TO "allocation_pct";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "allocation_pct" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "allocation_pct" TYPE DECIMAL(8,6) USING "allocation_pct"::text::DECIMAL(8,6);
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "chargeType" TO "charge_type";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "charge_type" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "charge_type" TYPE TEXT USING "charge_type"::text::TEXT;
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at"::text::TIMESTAMP(3);
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "product_id" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "product_id" TYPE TEXT USING "product_id"::text::TEXT;
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "stockEntryId" TO "stock_entry_id";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "stock_entry_id" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "stock_entry_id" TYPE TEXT USING "stock_entry_id"::text::TEXT;
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "stockEntryItemId" TO "stock_entry_item_id";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "stock_entry_item_id" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "stock_entry_item_id" TYPE TEXT USING "stock_entry_item_id"::text::TEXT;
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "tenantId" TO "tenant_id";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text::TEXT;
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "updated_at" TYPE TIMESTAMP(3) USING "updated_at"::text::TIMESTAMP(3);
ALTER TABLE "landed_cost_allocations" RENAME COLUMN "voucherId" TO "voucher_id";
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "voucher_id" DROP DEFAULT;
ALTER TABLE "landed_cost_allocations" ALTER COLUMN "voucher_id" TYPE TEXT USING "voucher_id"::text::TEXT;

ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2);
ALTER TABLE "landed_cost_charge_lines" RENAME COLUMN "accountCode" TO "account_code";
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "account_code" DROP DEFAULT;
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "account_code" TYPE TEXT USING "account_code"::text::TEXT;
ALTER TABLE "landed_cost_charge_lines" RENAME COLUMN "chargeType" TO "charge_type";
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "charge_type" DROP DEFAULT;
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "charge_type" TYPE TEXT USING "charge_type"::text::TEXT;
ALTER TABLE "landed_cost_charge_lines" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at"::text::TIMESTAMP(3);
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "landed_cost_charge_lines" RENAME COLUMN "tenantId" TO "tenant_id";
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text::TEXT;
ALTER TABLE "landed_cost_charge_lines" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "updated_at" TYPE TIMESTAMP(3) USING "updated_at"::text::TIMESTAMP(3);
ALTER TABLE "landed_cost_charge_lines" RENAME COLUMN "voucherId" TO "voucher_id";
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "voucher_id" DROP DEFAULT;
ALTER TABLE "landed_cost_charge_lines" ALTER COLUMN "voucher_id" TYPE TEXT USING "voucher_id"::text::TEXT;

ALTER TABLE "landed_cost_receipt_links" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at"::text::TIMESTAMP(3);
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "landed_cost_receipt_links" RENAME COLUMN "stockEntryId" TO "stock_entry_id";
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "stock_entry_id" DROP DEFAULT;
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "stock_entry_id" TYPE TEXT USING "stock_entry_id"::text::TEXT;
ALTER TABLE "landed_cost_receipt_links" RENAME COLUMN "tenantId" TO "tenant_id";
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text::TEXT;
ALTER TABLE "landed_cost_receipt_links" RENAME COLUMN "totalQty" TO "total_qty";
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "total_qty" DROP DEFAULT;
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "total_qty" TYPE DECIMAL(15,4) USING "total_qty"::text::DECIMAL(15,4);
ALTER TABLE "landed_cost_receipt_links" RENAME COLUMN "totalValue" TO "total_value";
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "total_value" DROP DEFAULT;
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "total_value" TYPE DECIMAL(15,2) USING "total_value"::text::DECIMAL(15,2);
ALTER TABLE "landed_cost_receipt_links" RENAME COLUMN "totalVolume" TO "total_volume";
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "total_volume" DROP DEFAULT;
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "total_volume" TYPE DECIMAL(15,4) USING "total_volume"::text::DECIMAL(15,4);
ALTER TABLE "landed_cost_receipt_links" RENAME COLUMN "totalWeight" TO "total_weight";
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "total_weight" DROP DEFAULT;
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "total_weight" TYPE DECIMAL(15,4) USING "total_weight"::text::DECIMAL(15,4);
ALTER TABLE "landed_cost_receipt_links" RENAME COLUMN "voucherId" TO "voucher_id";
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "voucher_id" DROP DEFAULT;
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "voucher_id" TYPE TEXT USING "voucher_id"::text::TEXT;
ALTER TABLE "landed_cost_receipt_links" RENAME COLUMN "updatedAt" TO "legacy_updated_at";
ALTER TABLE "landed_cost_receipt_links" ALTER COLUMN "legacy_updated_at" DROP NOT NULL;

ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "allocatedAt" TO "allocated_at";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "allocated_at" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "allocated_at" TYPE TIMESTAMP(3) USING "allocated_at"::text::TIMESTAMP(3);
ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "allocationMethod" TO "allocation_method";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "allocation_method" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "allocation_method" TYPE TEXT USING "allocation_method"::text::TEXT;
ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at"::text::TIMESTAMP(3);
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "createdBy" TO "created_by";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "created_by" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "created_by" TYPE TEXT USING "created_by"::text::TEXT;
ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "invoiceRef" TO "invoice_ref";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "invoice_ref" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "invoice_ref" TYPE TEXT USING "invoice_ref"::text::TEXT;
ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "tenantId" TO "tenant_id";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text::TEXT;
ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "totalAmount" TO "total_amount";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "total_amount" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "total_amount" TYPE DECIMAL(15,2) USING "total_amount"::text::DECIMAL(15,2);
ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "updated_at" TYPE TIMESTAMP(3) USING "updated_at"::text::TIMESTAMP(3);
ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "vendorId" TO "vendor_id";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "vendor_id" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "vendor_id" TYPE TEXT USING "vendor_id"::text::TEXT;
ALTER TABLE "landed_cost_vouchers" RENAME COLUMN "voucherNumber" TO "voucher_number";
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "voucher_number" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "voucher_number" TYPE TEXT USING "voucher_number"::text::TEXT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "status" TYPE TEXT USING "status"::text::TEXT;
ALTER TABLE "landed_cost_vouchers" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "load_plans" ALTER COLUMN "planned_load_date" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "load_plans" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "load_plans" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "load_plans" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "lot_disposal_records" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "lot_disposal_records" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "lot_disposal_records" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt"::text::TIMESTAMP(3);
ALTER TABLE "lot_disposal_records" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "lot_disposal_records" RENAME COLUMN "disposal_method" TO "disposalMethod";
ALTER TABLE "lot_disposal_records" ALTER COLUMN "disposalMethod" DROP DEFAULT;
ALTER TABLE "lot_disposal_records" ALTER COLUMN "disposalMethod" TYPE "DisposalMethod" USING "disposalMethod"::text::"DisposalMethod";
ALTER TABLE "lot_disposal_records" RENAME COLUMN "disposal_number" TO "disposalNumber";
ALTER TABLE "lot_disposal_records" ALTER COLUMN "disposalNumber" DROP DEFAULT;
ALTER TABLE "lot_disposal_records" ALTER COLUMN "disposalNumber" TYPE TEXT USING "disposalNumber"::text::TEXT;
ALTER TABLE "lot_disposal_records" RENAME COLUMN "disposed_at" TO "disposedAt";
ALTER TABLE "lot_disposal_records" ALTER COLUMN "disposedAt" DROP DEFAULT;
ALTER TABLE "lot_disposal_records" ALTER COLUMN "disposedAt" TYPE TIMESTAMP(3) USING "disposedAt"::text::TIMESTAMP(3);
ALTER TABLE "lot_disposal_records" ALTER COLUMN "disposedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "lot_disposal_records" RENAME COLUMN "disposed_by_id" TO "disposedById";
ALTER TABLE "lot_disposal_records" ALTER COLUMN "disposedById" DROP DEFAULT;
ALTER TABLE "lot_disposal_records" ALTER COLUMN "disposedById" TYPE TEXT USING "disposedById"::text::TEXT;
ALTER TABLE "lot_disposal_records" RENAME COLUMN "lot_id" TO "lotId";
ALTER TABLE "lot_disposal_records" ALTER COLUMN "lotId" DROP DEFAULT;
ALTER TABLE "lot_disposal_records" ALTER COLUMN "lotId" TYPE TEXT USING "lotId"::text::TEXT;
ALTER TABLE "lot_disposal_records" RENAME COLUMN "qty_disposed" TO "qtyDisposed";
ALTER TABLE "lot_disposal_records" ALTER COLUMN "qtyDisposed" DROP DEFAULT;
ALTER TABLE "lot_disposal_records" ALTER COLUMN "qtyDisposed" TYPE DECIMAL(18,4) USING "qtyDisposed"::text::DECIMAL(18,4);
ALTER TABLE "lot_disposal_records" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "lot_disposal_records" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "lot_disposal_records" ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::text::TEXT;

ALTER TABLE "lot_expiry_alerts" RENAME COLUMN "alert_level" TO "alertLevel";
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "alertLevel" DROP DEFAULT;
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "alertLevel" TYPE "ExpiryAlertLevel" USING "alertLevel"::text::"ExpiryAlertLevel";
ALTER TABLE "lot_expiry_alerts" RENAME COLUMN "alerted_at" TO "alertedAt";
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "alertedAt" DROP DEFAULT;
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "alertedAt" TYPE TIMESTAMP(3) USING "alertedAt"::text::TIMESTAMP(3);
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "alertedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "lot_expiry_alerts" RENAME COLUMN "days_to_expiry" TO "daysToExpiry";
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "daysToExpiry" DROP DEFAULT;
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "daysToExpiry" TYPE INTEGER USING "daysToExpiry"::text::INTEGER;
ALTER TABLE "lot_expiry_alerts" RENAME COLUMN "lot_id" TO "lotId";
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "lotId" DROP DEFAULT;
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "lotId" TYPE TEXT USING "lotId"::text::TEXT;
ALTER TABLE "lot_expiry_alerts" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "lot_expiry_alerts" ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::text::TEXT;

ALTER TABLE "lot_expiry_records" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt"::text::TIMESTAMP(3);
ALTER TABLE "lot_expiry_records" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "lot_expiry_records" RENAME COLUMN "created_by_id" TO "createdById";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "createdById" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "createdById" TYPE TEXT USING "createdById"::text::TEXT;
ALTER TABLE "lot_expiry_records" RENAME COLUMN "expiry_date" TO "expiryDate";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "expiryDate" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "expiryDate" TYPE TIMESTAMP(3) USING "expiryDate"::text::TIMESTAMP(3);
ALTER TABLE "lot_expiry_records" RENAME COLUMN "lot_number" TO "lotNumber";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "lotNumber" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "lotNumber" TYPE TEXT USING "lotNumber"::text::TEXT;
ALTER TABLE "lot_expiry_records" RENAME COLUMN "manufacture_date" TO "manufactureDate";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "manufactureDate" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "manufactureDate" TYPE TIMESTAMP(3) USING "manufactureDate"::text::TIMESTAMP(3);
ALTER TABLE "lot_expiry_records" RENAME COLUMN "product_id" TO "productId";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "productId" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "productId" TYPE TEXT USING "productId"::text::TEXT;
ALTER TABLE "lot_expiry_records" RENAME COLUMN "receipt_ref" TO "receiptRef";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "receiptRef" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "receiptRef" TYPE TEXT USING "receiptRef"::text::TEXT;
ALTER TABLE "lot_expiry_records" RENAME COLUMN "remaining_qty" TO "remainingQty";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "remainingQty" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "remainingQty" TYPE DECIMAL(18,4) USING "remainingQty"::text::DECIMAL(18,4);
ALTER TABLE "lot_expiry_records" RENAME COLUMN "supplier_id" TO "supplierId";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "supplierId" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "supplierId" TYPE TEXT USING "supplierId"::text::TEXT;
ALTER TABLE "lot_expiry_records" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::text::TEXT;
ALTER TABLE "lot_expiry_records" RENAME COLUMN "updated_at" TO "updatedAt";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt"::text::TIMESTAMP(3);
ALTER TABLE "lot_expiry_records" RENAME COLUMN "warehouse_id" TO "warehouseId";
ALTER TABLE "lot_expiry_records" ALTER COLUMN "warehouseId" DROP DEFAULT;
ALTER TABLE "lot_expiry_records" ALTER COLUMN "warehouseId" TYPE TEXT USING "warehouseId"::text::TEXT;

ALTER TABLE "packaging_specs" ALTER COLUMN "level" DROP DEFAULT;
ALTER TABLE "packaging_specs" ALTER COLUMN "level" TYPE "PackagingLevel" USING "level"::text::"PackagingLevel";

ALTER TABLE "packing_plans" ALTER COLUMN "planned_date" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "packing_plans" ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "packing_plans" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "packing_plans" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "packing_plans" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "pallet_types" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "product_recalls" ALTER COLUMN "affected_lot_numbers" DROP DEFAULT;
ALTER TABLE "product_recalls" ALTER COLUMN "affected_serials" DROP DEFAULT;
ALTER TABLE "product_recalls" ALTER COLUMN "recall_class" DROP DEFAULT;
ALTER TABLE "product_recalls" ALTER COLUMN "recall_class" TYPE "RecallClass" USING "recall_class"::text::"RecallClass";
ALTER TABLE "product_recalls" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "product_recalls" ALTER COLUMN "status" TYPE "RecallStatus" USING "status"::text::"RecallStatus";
ALTER TABLE "product_recalls" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "product_recalls" ALTER COLUMN "action_required" DROP DEFAULT;
ALTER TABLE "product_recalls" ALTER COLUMN "action_required" TYPE "RecallActionType" USING "action_required"::text::"RecallActionType";

ALTER TABLE "recall_disposal_records" ALTER COLUMN "action_type" DROP DEFAULT;
ALTER TABLE "recall_disposal_records" ALTER COLUMN "action_type" TYPE "RecallActionType" USING "action_type"::text::"RecallActionType";

ALTER TABLE "safety_data_sheets" ALTER COLUMN "issue_date" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "safety_data_sheets" ALTER COLUMN "expiry_date" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "safety_data_sheets" ALTER COLUMN "acknowledged_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "safety_data_sheets" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "safety_data_sheets" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "safety_data_sheets" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "stock_write_down_requests" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "stock_write_down_requests" ALTER COLUMN "original_value_per_unit" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "stock_write_down_requests" ALTER COLUMN "proposed_value_per_unit" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "stock_write_down_requests" ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "stock_write_off_records" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "stock_write_off_records" ALTER COLUMN "book_value_per_unit" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "stock_write_off_records" ALTER COLUMN "total_write_off" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "stock_write_off_records" ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "supplier_price_tiers" ALTER COLUMN "effective_from" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "supplier_price_tiers" ALTER COLUMN "effective_to" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "temperature_excursions" ALTER COLUMN "recorded_temp_c" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "temperature_excursions" ALTER COLUMN "recorded_humidity_pct" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "temperature_excursions" ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "user_presence" ADD COLUMN     "clear_at" TIMESTAMP(3);

ALTER TABLE "vendor_item_attributes" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

ALTER TABLE "vmi_agreements" RENAME COLUMN "activated_at" TO "activatedAt";
ALTER TABLE "vmi_agreements" ALTER COLUMN "activatedAt" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "activatedAt" TYPE TIMESTAMP(3) USING "activatedAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_agreements" RENAME COLUMN "agreement_number" TO "agreementNumber";
ALTER TABLE "vmi_agreements" ALTER COLUMN "agreementNumber" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "agreementNumber" TYPE TEXT USING "agreementNumber"::text::TEXT;
ALTER TABLE "vmi_agreements" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "vmi_agreements" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_agreements" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "vmi_agreements" RENAME COLUMN "created_by_id" TO "createdById";
ALTER TABLE "vmi_agreements" ALTER COLUMN "createdById" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "createdById" TYPE TEXT USING "createdById"::text::TEXT;
ALTER TABLE "vmi_agreements" RENAME COLUMN "max_qty" TO "maxQty";
ALTER TABLE "vmi_agreements" ALTER COLUMN "maxQty" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "maxQty" TYPE DECIMAL(18,4) USING "maxQty"::text::DECIMAL(18,4);
ALTER TABLE "vmi_agreements" RENAME COLUMN "min_qty" TO "minQty";
ALTER TABLE "vmi_agreements" ALTER COLUMN "minQty" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "minQty" TYPE DECIMAL(18,4) USING "minQty"::text::DECIMAL(18,4);
ALTER TABLE "vmi_agreements" RENAME COLUMN "product_id" TO "productId";
ALTER TABLE "vmi_agreements" ALTER COLUMN "productId" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "productId" TYPE TEXT USING "productId"::text::TEXT;
ALTER TABLE "vmi_agreements" RENAME COLUMN "replen_trigger" TO "replenTrigger";
ALTER TABLE "vmi_agreements" ALTER COLUMN "replenTrigger" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "replenTrigger" TYPE "VmiReplenTrigger" USING "replenTrigger"::text::"VmiReplenTrigger";
ALTER TABLE "vmi_agreements" ALTER COLUMN "replenTrigger" SET DEFAULT 'BELOW_MIN';
ALTER TABLE "vmi_agreements" RENAME COLUMN "review_cycle_days" TO "reviewCycleDays";
ALTER TABLE "vmi_agreements" ALTER COLUMN "reviewCycleDays" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "reviewCycleDays" TYPE INTEGER USING "reviewCycleDays"::text::INTEGER;
ALTER TABLE "vmi_agreements" ALTER COLUMN "reviewCycleDays" SET DEFAULT 7;
ALTER TABLE "vmi_agreements" RENAME COLUMN "target_qty" TO "targetQty";
ALTER TABLE "vmi_agreements" ALTER COLUMN "targetQty" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "targetQty" TYPE DECIMAL(18,4) USING "targetQty"::text::DECIMAL(18,4);
ALTER TABLE "vmi_agreements" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "vmi_agreements" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::text::TEXT;
ALTER TABLE "vmi_agreements" RENAME COLUMN "terminated_at" TO "terminatedAt";
ALTER TABLE "vmi_agreements" ALTER COLUMN "terminatedAt" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "terminatedAt" TYPE TIMESTAMP(3) USING "terminatedAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_agreements" RENAME COLUMN "updated_at" TO "updatedAt";
ALTER TABLE "vmi_agreements" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_agreements" RENAME COLUMN "vendor_id" TO "vendorId";
ALTER TABLE "vmi_agreements" ALTER COLUMN "vendorId" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "vendorId" TYPE TEXT USING "vendorId"::text::TEXT;
ALTER TABLE "vmi_agreements" RENAME COLUMN "vendor_lead_days" TO "vendorLeadDays";
ALTER TABLE "vmi_agreements" ALTER COLUMN "vendorLeadDays" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "vendorLeadDays" TYPE INTEGER USING "vendorLeadDays"::text::INTEGER;
ALTER TABLE "vmi_agreements" ALTER COLUMN "vendorLeadDays" SET DEFAULT 3;
ALTER TABLE "vmi_agreements" RENAME COLUMN "warehouse_id" TO "warehouseId";
ALTER TABLE "vmi_agreements" ALTER COLUMN "warehouseId" DROP DEFAULT;
ALTER TABLE "vmi_agreements" ALTER COLUMN "warehouseId" TYPE TEXT USING "warehouseId"::text::TEXT;

ALTER TABLE "vmi_orders" RENAME COLUMN "agreement_id" TO "agreementId";
ALTER TABLE "vmi_orders" ALTER COLUMN "agreementId" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "agreementId" TYPE TEXT USING "agreementId"::text::TEXT;
ALTER TABLE "vmi_orders" RENAME COLUMN "cancel_reason" TO "cancelReason";
ALTER TABLE "vmi_orders" ALTER COLUMN "cancelReason" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "cancelReason" TYPE TEXT USING "cancelReason"::text::TEXT;
ALTER TABLE "vmi_orders" RENAME COLUMN "cancelled_at" TO "cancelledAt";
ALTER TABLE "vmi_orders" ALTER COLUMN "cancelledAt" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "cancelledAt" TYPE TIMESTAMP(3) USING "cancelledAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_orders" RENAME COLUMN "confirmed_at" TO "confirmedAt";
ALTER TABLE "vmi_orders" ALTER COLUMN "confirmedAt" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "confirmedAt" TYPE TIMESTAMP(3) USING "confirmedAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_orders" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "vmi_orders" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_orders" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "vmi_orders" RENAME COLUMN "order_number" TO "orderNumber";
ALTER TABLE "vmi_orders" ALTER COLUMN "orderNumber" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "orderNumber" TYPE TEXT USING "orderNumber"::text::TEXT;
ALTER TABLE "vmi_orders" RENAME COLUMN "ordered_qty" TO "orderedQty";
ALTER TABLE "vmi_orders" ALTER COLUMN "orderedQty" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "orderedQty" TYPE DECIMAL(18,4) USING "orderedQty"::text::DECIMAL(18,4);
ALTER TABLE "vmi_orders" RENAME COLUMN "received_at" TO "receivedAt";
ALTER TABLE "vmi_orders" ALTER COLUMN "receivedAt" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "receivedAt" TYPE TIMESTAMP(3) USING "receivedAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_orders" RENAME COLUMN "received_qty" TO "receivedQty";
ALTER TABLE "vmi_orders" ALTER COLUMN "receivedQty" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "receivedQty" TYPE DECIMAL(18,4) USING "receivedQty"::text::DECIMAL(18,4);
ALTER TABLE "vmi_orders" RENAME COLUMN "shipped_at" TO "shippedAt";
ALTER TABLE "vmi_orders" ALTER COLUMN "shippedAt" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "shippedAt" TYPE TIMESTAMP(3) USING "shippedAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_orders" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "vmi_orders" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::text::TEXT;
ALTER TABLE "vmi_orders" RENAME COLUMN "triggered_at" TO "triggeredAt";
ALTER TABLE "vmi_orders" ALTER COLUMN "triggeredAt" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "triggeredAt" TYPE TIMESTAMP(3) USING "triggeredAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_orders" ALTER COLUMN "triggeredAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "vmi_orders" RENAME COLUMN "triggered_by" TO "triggeredBy";
ALTER TABLE "vmi_orders" ALTER COLUMN "triggeredBy" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "triggeredBy" TYPE "VmiReplenTrigger" USING "triggeredBy"::text::"VmiReplenTrigger";
ALTER TABLE "vmi_orders" RENAME COLUMN "updated_at" TO "updatedAt";
ALTER TABLE "vmi_orders" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_orders" RENAME COLUMN "vendor_id" TO "vendorId";
ALTER TABLE "vmi_orders" ALTER COLUMN "vendorId" DROP DEFAULT;
ALTER TABLE "vmi_orders" ALTER COLUMN "vendorId" TYPE TEXT USING "vendorId"::text::TEXT;

ALTER TABLE "vmi_stock_snapshots" RENAME COLUMN "agreement_id" TO "agreementId";
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "agreementId" DROP DEFAULT;
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "agreementId" TYPE TEXT USING "agreementId"::text::TEXT;
ALTER TABLE "vmi_stock_snapshots" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt"::text::TIMESTAMP(3);
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "vmi_stock_snapshots" RENAME COLUMN "on_hand_qty" TO "onHandQty";
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "onHandQty" DROP DEFAULT;
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "onHandQty" TYPE DECIMAL(18,4) USING "onHandQty"::text::DECIMAL(18,4);
ALTER TABLE "vmi_stock_snapshots" RENAME COLUMN "on_order_qty" TO "onOrderQty";
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "onOrderQty" DROP DEFAULT;
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "onOrderQty" TYPE DECIMAL(18,4) USING "onOrderQty"::text::DECIMAL(18,4);
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "onOrderQty" SET DEFAULT 0;
ALTER TABLE "vmi_stock_snapshots" RENAME COLUMN "recorded_by_id" TO "recordedById";
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "recordedById" DROP DEFAULT;
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "recordedById" TYPE TEXT USING "recordedById"::text::TEXT;
ALTER TABLE "vmi_stock_snapshots" RENAME COLUMN "snapshot_date" TO "snapshotDate";
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "snapshotDate" DROP DEFAULT;
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "snapshotDate" TYPE TIMESTAMP(3) USING "snapshotDate"::text::TIMESTAMP(3);
ALTER TABLE "vmi_stock_snapshots" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "vmi_stock_snapshots" ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::text::TEXT;

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

-- CreateIndex

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

