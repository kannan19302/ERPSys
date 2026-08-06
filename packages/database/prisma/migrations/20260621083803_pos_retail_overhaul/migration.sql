/*
  Warnings:

  - You are about to drop the column `shelf` on the `bin_locations` table. All the data in the column will be lost.
  - You are about to alter the column `valuation_rate` on the `stock_entry_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,4)`.
  - You are about to alter the column `valuation_rate` on the `stock_ledger_entries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,4)`.
  - Made the column `zone` on table `bin_locations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "batches_tenant_id_product_id_batch_number_key";

-- DropIndex
DROP INDEX "bin_locations_tenant_id_warehouse_id_name_key";

-- DropIndex
DROP INDEX "serial_numbers_tenant_id_serial_number_key";

-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "batch_no" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lot_no" TEXT,
ADD COLUMN     "manufacture_date" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "supplier_batch_no" TEXT,
ADD COLUMN     "used_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
ALTER COLUMN "batch_number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "bin_locations" DROP COLUMN "shelf",
ADD COLUMN     "aisle" TEXT,
ADD COLUMN     "capacity" DECIMAL(15,3),
ADD COLUMN     "code" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rack" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "zone" SET NOT NULL,
ALTER COLUMN "zone" SET DEFAULT 'A';

-- AlterTable
ALTER TABLE "boms" ADD COLUMN     "previous_bom_id" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "version" TEXT NOT NULL DEFAULT '1.0';

-- AlterTable
ALTER TABLE "cycle_count_items" ADD COLUMN     "bin_location_id" TEXT,
ADD COLUMN     "counted_at" TIMESTAMP(3),
ADD COLUMN     "counted_by" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "variance_qty" DECIMAL(15,3),
ADD COLUMN     "variance_value" DECIMAL(15,2),
ALTER COLUMN "counted_qty" DROP NOT NULL,
ALTER COLUMN "variance" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "cycle_counts" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "variance" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "committed_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "in_transit_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "last_count_date" TIMESTAMP(3),
ADD COLUMN     "reserved_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "valuation_rate" DECIMAL(15,4);

-- AlterTable
ALTER TABLE "pos_registers" ADD COLUMN     "closing_difference" DECIMAL(15,2),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "total_returns" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_sales" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_transactions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pos_shifts" ADD COLUMN     "cash_in" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cash_out" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "total_returns" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_sales" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pos_terminals" ADD COLUMN     "allow_discount" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "default_customer_id" TEXT,
ADD COLUMN     "enable_tipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 100,
ADD COLUMN     "pos_profile" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "price_list_id" TEXT,
ADD COLUMN     "tax_profile_id" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "costing_method" TEXT NOT NULL DEFAULT 'AVERAGE',
ADD COLUMN     "dimensions" JSONB DEFAULT '{}',
ADD COLUMN     "has_batch_tracking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_serial_tracking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lead_time_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "max_order_qty" DECIMAL(15,3),
ADD COLUMN     "min_order_qty" DECIMAL(15,3),
ADD COLUMN     "weight" DECIMAL(10,3),
ADD COLUMN     "weight_unit" TEXT NOT NULL DEFAULT 'KG';

-- AlterTable
ALTER TABLE "quality_inspections" ADD COLUMN     "accepted_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "disposition" TEXT,
ADD COLUMN     "inspection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "inspector" TEXT,
ADD COLUMN     "reference_doc" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "warehouse_id" TEXT,
ALTER COLUMN "passed_qty" SET DEFAULT 0,
ALTER COLUMN "inspected_by" DROP NOT NULL;

-- AlterTable
ALTER TABLE "serial_numbers" ADD COLUMN     "custom_fields" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchase_date" TIMESTAMP(3),
ADD COLUMN     "serial_no" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "warranty_expiry" TIMESTAMP(3),
ALTER COLUMN "warehouse_id" DROP NOT NULL,
ALTER COLUMN "serial_number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "stock_entries" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "reference_doc" TEXT,
ADD COLUMN     "reference_type" TEXT,
ADD COLUMN     "submitted_at" TIMESTAMP(3),
ADD COLUMN     "submitted_by" TEXT,
ADD COLUMN     "total_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'MATERIAL_TRANSFER';

-- AlterTable
ALTER TABLE "stock_entry_items" ADD COLUMN     "batch_id" TEXT,
ADD COLUMN     "from_bin_id" TEXT,
ADD COLUMN     "from_warehouse_id" TEXT,
ADD COLUMN     "quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "serial_no" TEXT,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "to_bin_id" TEXT,
ADD COLUMN     "to_warehouse_id" TEXT,
ADD COLUMN     "uom_id" TEXT,
ADD COLUMN     "uom_qty" DECIMAL(15,3),
ALTER COLUMN "valuation_rate" SET DEFAULT 0,
ALTER COLUMN "valuation_rate" SET DATA TYPE DECIMAL(15,4),
ALTER COLUMN "amount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "stock_ledger_entries" ADD COLUMN     "balance_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "incoming_rate" DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN     "posting_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "qty_in" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "qty_out" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "stock_entry_id" TEXT,
ADD COLUMN     "stock_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "voucher_number" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "valuation_rate" SET DEFAULT 0,
ALTER COLUMN "valuation_rate" SET DATA TYPE DECIMAL(15,4);

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "capacity" DECIMAL(15,3),
ADD COLUMN     "manager_id" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'MAIN';

-- CreateTable
CREATE TABLE "pos_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SALE',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "customer_id" TEXT,
    "customer_name" TEXT,
    "terminal_id" TEXT NOT NULL,
    "register_id" TEXT,
    "shift_id" TEXT,
    "cashier_id" TEXT NOT NULL,
    "cashier_name" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_type" TEXT,
    "discount_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "rounding_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "change_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tip_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "loyalty_points_earned" INTEGER NOT NULL DEFAULT 0,
    "loyalty_points_used" INTEGER NOT NULL DEFAULT 0,
    "coupon_code" TEXT,
    "notes" TEXT,
    "receipt_data" JSONB,
    "original_order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_order_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL DEFAULT '',
    "barcode" TEXT,
    "qty" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount_type" TEXT,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(15,2) NOT NULL,
    "serial_number_id" TEXT,
    "batch_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reference" TEXT,
    "card_last_4" TEXT,
    "auth_code" TEXT,
    "gift_card_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_discounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "applies_to" TEXT NOT NULL DEFAULT 'ORDER',
    "category_id" TEXT,
    "product_id" TEXT,
    "min_purchase" DECIMAL(15,2),
    "max_discount" DECIMAL(15,2),
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_coupons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_id" TEXT NOT NULL,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_tax_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rates" JSONB NOT NULL DEFAULT '[]',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_inclusive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_quick_keys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "product_id" TEXT,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "position" INTEGER NOT NULL DEFAULT 0,
    "category_group" TEXT,

    CONSTRAINT "pos_quick_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_loyalty_programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "points_per_unit" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "redeem_rate" DECIMAL(10,4) NOT NULL DEFAULT 100,
    "min_redeem_points" INTEGER NOT NULL DEFAULT 100,
    "expiry_days" INTEGER,
    "tiers" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_loyalty_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lifetime_points" INTEGER NOT NULL DEFAULT 0,
    "lifetime_spent" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'BRONZE',
    "last_visit" TIMESTAMP(3),
    "card_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_loyalty_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_loyalty_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_gift_cards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initial_balance" DECIMAL(15,2) NOT NULL,
    "current_balance" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issued_to" TEXT,
    "issued_by" TEXT,
    "expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_gift_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_gift_card_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "gift_card_id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_gift_card_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_store_credits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT,
    "customer_id" TEXT,
    "customer_email" TEXT,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_store_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_returns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "return_number" TEXT NOT NULL,
    "original_order_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RETURN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "refund_method" TEXT,
    "refund_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "exchange_order_id" TEXT,
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_return_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "return_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT NOT NULL,
    "qty" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "refund_amount" DECIMAL(15,2) NOT NULL,
    "restock" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,

    CONSTRAINT "pos_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_held_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "cashier_id" TEXT NOT NULL,
    "label" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_held_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_price_lists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_price_list_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "price_list_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "min_qty" DECIMAL(15,3) NOT NULL DEFAULT 1,

    CONSTRAINT "pos_price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_promotions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "rewards" JSONB NOT NULL DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 10,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_open_tabs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "tab_number" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "cashier_id" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "pos_open_tabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_layaways" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "layaway_number" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "total_amount" DECIMAL(15,2) NOT NULL,
    "deposit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remaining_amount" DECIMAL(15,2) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_layaways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_layaway_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "layaway_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "pos_layaway_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serial_number_history" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "serial_number_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serial_number_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_item_bins" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "bin_location_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_item_bins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qa_inspection_checkpoints" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "result" TEXT,
    "observed_value" TEXT,
    "remarks" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "qa_inspection_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_operations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "workstation_code" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "operator_id" TEXT,

    CONSTRAINT "work_order_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workstation_shifts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workstation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "days_of_week" INTEGER[],

    CONSTRAINT "workstation_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontracting_materials" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subcontracting_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "required_qty" DECIMAL(15,3) NOT NULL,
    "issued_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "consumed_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,

    CONSTRAINT "subcontracting_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_tools" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workstation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "max_cycles" INTEGER NOT NULL,
    "current_cycles" INTEGER NOT NULL DEFAULT 0,
    "last_calibration_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OK',

    CONSTRAINT "equipment_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineering_change_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bom_id" TEXT NOT NULL,
    "change_description" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engineering_change_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_component_consumptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "lot_number" TEXT NOT NULL,
    "quantity_consumed" DECIMAL(15,3) NOT NULL,

    CONSTRAINT "work_order_component_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units_of_measure" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'UNIT',
    "is_base" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uom_conversions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_uom_id" TEXT NOT NULL,
    "to_uom_id" TEXT NOT NULL,
    "factor" DECIMAL(15,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uom_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "parent_sku_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "cost_price" DECIMAL(15,2) NOT NULL,
    "sell_price" DECIMAL(15,2) NOT NULL,
    "barcode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_valuations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "costing_method" TEXT NOT NULL,
    "valuation_date" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "valuation_rate" DECIMAL(15,4) NOT NULL,
    "stock_value" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "min_qty" DECIMAL(15,3) NOT NULL,
    "max_qty" DECIMAL(15,3),
    "reorder_qty" DECIMAL(15,3) NOT NULL,
    "lead_time_days" INTEGER NOT NULL DEFAULT 0,
    "preferred_vendor_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_create_po" BOOLEAN NOT NULL DEFAULT false,
    "last_triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reorder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "message" TEXT NOT NULL,
    "threshold" DECIMAL(15,3),
    "current_qty" DECIMAL(15,3),
    "expiry_date" TIMESTAMP(3),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_kits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sell_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_kit_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kit_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_kit_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_orders_tenant_id_idx" ON "pos_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_orders_tenant_id_terminal_id_idx" ON "pos_orders"("tenant_id", "terminal_id");

-- CreateIndex
CREATE INDEX "pos_orders_tenant_id_customer_id_idx" ON "pos_orders"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "pos_orders_tenant_id_created_at_idx" ON "pos_orders"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "pos_orders_tenant_id_org_id_order_number_key" ON "pos_orders"("tenant_id", "org_id", "order_number");

-- CreateIndex
CREATE INDEX "pos_order_items_tenant_id_idx" ON "pos_order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_order_items_order_id_idx" ON "pos_order_items"("order_id");

-- CreateIndex
CREATE INDEX "pos_payments_tenant_id_idx" ON "pos_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_payments_order_id_idx" ON "pos_payments"("order_id");

-- CreateIndex
CREATE INDEX "pos_discounts_tenant_id_idx" ON "pos_discounts"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_coupons_tenant_id_idx" ON "pos_coupons"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_coupons_tenant_id_code_key" ON "pos_coupons"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "pos_tax_profiles_tenant_id_idx" ON "pos_tax_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_quick_keys_tenant_id_terminal_id_idx" ON "pos_quick_keys"("tenant_id", "terminal_id");

-- CreateIndex
CREATE INDEX "pos_loyalty_programs_tenant_id_idx" ON "pos_loyalty_programs"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_loyalty_members_tenant_id_idx" ON "pos_loyalty_members"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_loyalty_members_tenant_id_program_id_idx" ON "pos_loyalty_members"("tenant_id", "program_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_loyalty_members_tenant_id_program_id_email_key" ON "pos_loyalty_members"("tenant_id", "program_id", "email");

-- CreateIndex
CREATE INDEX "pos_loyalty_transactions_tenant_id_idx" ON "pos_loyalty_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_loyalty_transactions_member_id_idx" ON "pos_loyalty_transactions"("member_id");

-- CreateIndex
CREATE INDEX "pos_gift_cards_tenant_id_idx" ON "pos_gift_cards"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_gift_cards_tenant_id_code_key" ON "pos_gift_cards"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "pos_gift_card_transactions_tenant_id_idx" ON "pos_gift_card_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_gift_card_transactions_gift_card_id_idx" ON "pos_gift_card_transactions"("gift_card_id");

-- CreateIndex
CREATE INDEX "pos_store_credits_tenant_id_idx" ON "pos_store_credits"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_store_credits_tenant_id_customer_id_key" ON "pos_store_credits"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "pos_returns_tenant_id_idx" ON "pos_returns"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_returns_original_order_id_idx" ON "pos_returns"("original_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_returns_tenant_id_org_id_return_number_key" ON "pos_returns"("tenant_id", "org_id", "return_number");

-- CreateIndex
CREATE INDEX "pos_return_items_tenant_id_idx" ON "pos_return_items"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_return_items_return_id_idx" ON "pos_return_items"("return_id");

-- CreateIndex
CREATE INDEX "pos_held_orders_tenant_id_idx" ON "pos_held_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_held_orders_tenant_id_terminal_id_idx" ON "pos_held_orders"("tenant_id", "terminal_id");

-- CreateIndex
CREATE INDEX "pos_price_lists_tenant_id_idx" ON "pos_price_lists"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_price_list_items_tenant_id_idx" ON "pos_price_list_items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_price_list_items_price_list_id_product_id_key" ON "pos_price_list_items"("price_list_id", "product_id");

-- CreateIndex
CREATE INDEX "pos_promotions_tenant_id_idx" ON "pos_promotions"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_open_tabs_tenant_id_idx" ON "pos_open_tabs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_open_tabs_tenant_id_org_id_tab_number_key" ON "pos_open_tabs"("tenant_id", "org_id", "tab_number");

-- CreateIndex
CREATE INDEX "pos_layaways_tenant_id_idx" ON "pos_layaways"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_layaways_tenant_id_org_id_layaway_number_key" ON "pos_layaways"("tenant_id", "org_id", "layaway_number");

-- CreateIndex
CREATE INDEX "pos_layaway_payments_tenant_id_idx" ON "pos_layaway_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_layaway_payments_layaway_id_idx" ON "pos_layaway_payments"("layaway_id");

-- CreateIndex
CREATE INDEX "serial_number_history_tenant_id_idx" ON "serial_number_history"("tenant_id");

-- CreateIndex
CREATE INDEX "serial_number_history_serial_number_id_idx" ON "serial_number_history"("serial_number_id");

-- CreateIndex
CREATE INDEX "inventory_item_bins_tenant_id_idx" ON "inventory_item_bins"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_item_bins_bin_location_id_idx" ON "inventory_item_bins"("bin_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_bins_tenant_id_product_id_warehouse_id_bin_l_key" ON "inventory_item_bins"("tenant_id", "product_id", "warehouse_id", "bin_location_id");

-- CreateIndex
CREATE INDEX "qa_inspection_checkpoints_tenant_id_idx" ON "qa_inspection_checkpoints"("tenant_id");

-- CreateIndex
CREATE INDEX "qa_inspection_checkpoints_inspection_id_idx" ON "qa_inspection_checkpoints"("inspection_id");

-- CreateIndex
CREATE INDEX "work_order_operations_tenant_id_idx" ON "work_order_operations"("tenant_id");

-- CreateIndex
CREATE INDEX "work_order_operations_work_order_id_idx" ON "work_order_operations"("work_order_id");

-- CreateIndex
CREATE INDEX "workstation_shifts_tenant_id_idx" ON "workstation_shifts"("tenant_id");

-- CreateIndex
CREATE INDEX "workstation_shifts_workstation_id_idx" ON "workstation_shifts"("workstation_id");

-- CreateIndex
CREATE INDEX "subcontracting_materials_tenant_id_idx" ON "subcontracting_materials"("tenant_id");

-- CreateIndex
CREATE INDEX "subcontracting_materials_subcontracting_order_id_idx" ON "subcontracting_materials"("subcontracting_order_id");

-- CreateIndex
CREATE INDEX "equipment_tools_tenant_id_idx" ON "equipment_tools"("tenant_id");

-- CreateIndex
CREATE INDEX "equipment_tools_workstation_id_idx" ON "equipment_tools"("workstation_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tools_tenant_id_code_key" ON "equipment_tools"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "engineering_change_orders_tenant_id_idx" ON "engineering_change_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "engineering_change_orders_bom_id_idx" ON "engineering_change_orders"("bom_id");

-- CreateIndex
CREATE INDEX "work_order_component_consumptions_tenant_id_idx" ON "work_order_component_consumptions"("tenant_id");

-- CreateIndex
CREATE INDEX "work_order_component_consumptions_work_order_id_idx" ON "work_order_component_consumptions"("work_order_id");

-- CreateIndex
CREATE INDEX "product_categories_tenant_id_idx" ON "product_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "product_categories_parent_id_idx" ON "product_categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_tenant_id_org_id_slug_key" ON "product_categories"("tenant_id", "org_id", "slug");

-- CreateIndex
CREATE INDEX "units_of_measure_tenant_id_idx" ON "units_of_measure"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_tenant_id_abbreviation_key" ON "units_of_measure"("tenant_id", "abbreviation");

-- CreateIndex
CREATE INDEX "uom_conversions_tenant_id_idx" ON "uom_conversions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "uom_conversions_tenant_id_from_uom_id_to_uom_id_key" ON "uom_conversions"("tenant_id", "from_uom_id", "to_uom_id");

-- CreateIndex
CREATE INDEX "product_variants_tenant_id_idx" ON "product_variants"("tenant_id");

-- CreateIndex
CREATE INDEX "product_variants_parent_sku_id_idx" ON "product_variants"("parent_sku_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_tenant_id_sku_key" ON "product_variants"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "inventory_valuations_tenant_id_idx" ON "inventory_valuations"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_valuations_tenant_id_product_id_idx" ON "inventory_valuations"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "inventory_valuations_tenant_id_valuation_date_idx" ON "inventory_valuations"("tenant_id", "valuation_date");

-- CreateIndex
CREATE INDEX "reorder_rules_tenant_id_idx" ON "reorder_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "reorder_rules_product_id_idx" ON "reorder_rules"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "reorder_rules_tenant_id_product_id_warehouse_id_key" ON "reorder_rules"("tenant_id", "product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "stock_alerts_tenant_id_idx" ON "stock_alerts"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_alerts_tenant_id_is_resolved_idx" ON "stock_alerts"("tenant_id", "is_resolved");

-- CreateIndex
CREATE INDEX "stock_alerts_tenant_id_alert_type_idx" ON "stock_alerts"("tenant_id", "alert_type");

-- CreateIndex
CREATE UNIQUE INDEX "product_kits_product_id_key" ON "product_kits"("product_id");

-- CreateIndex
CREATE INDEX "product_kits_tenant_id_idx" ON "product_kits"("tenant_id");

-- CreateIndex
CREATE INDEX "product_kit_items_tenant_id_idx" ON "product_kit_items"("tenant_id");

-- CreateIndex
CREATE INDEX "product_kit_items_kit_id_idx" ON "product_kit_items"("kit_id");

-- CreateIndex
CREATE INDEX "batches_product_id_idx" ON "batches"("product_id");

-- CreateIndex
CREATE INDEX "batches_expiry_date_idx" ON "batches"("expiry_date");

-- CreateIndex
CREATE INDEX "bin_locations_warehouse_id_idx" ON "bin_locations"("warehouse_id");

-- CreateIndex
CREATE INDEX "cycle_count_items_cycle_count_id_idx" ON "cycle_count_items"("cycle_count_id");

-- CreateIndex
CREATE INDEX "cycle_count_items_product_id_idx" ON "cycle_count_items"("product_id");

-- CreateIndex
CREATE INDEX "cycle_counts_warehouse_id_idx" ON "cycle_counts"("warehouse_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_category_id_idx" ON "products"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "quality_inspections_product_id_idx" ON "quality_inspections"("product_id");

-- CreateIndex
CREATE INDEX "quality_inspections_status_idx" ON "quality_inspections"("status");

-- CreateIndex
CREATE INDEX "serial_numbers_product_id_idx" ON "serial_numbers"("product_id");

-- CreateIndex
CREATE INDEX "serial_numbers_status_idx" ON "serial_numbers"("status");

-- CreateIndex
CREATE INDEX "stock_entries_tenant_id_type_idx" ON "stock_entries"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "stock_entries_tenant_id_status_idx" ON "stock_entries"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "stock_entry_items_product_id_idx" ON "stock_entry_items"("product_id");

-- CreateIndex
CREATE INDEX "stock_ledger_entries_tenant_id_product_id_idx" ON "stock_ledger_entries"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_ledger_entries_tenant_id_warehouse_id_idx" ON "stock_ledger_entries"("tenant_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "stock_ledger_entries_tenant_id_posting_date_idx" ON "stock_ledger_entries"("tenant_id", "posting_date");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "pos_tax_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "pos_price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_orders" ADD CONSTRAINT "pos_orders_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_orders" ADD CONSTRAINT "pos_orders_register_id_fkey" FOREIGN KEY ("register_id") REFERENCES "pos_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_orders" ADD CONSTRAINT "pos_orders_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "pos_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_items" ADD CONSTRAINT "pos_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "pos_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_payments" ADD CONSTRAINT "pos_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "pos_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_payments" ADD CONSTRAINT "pos_payments_gift_card_id_fkey" FOREIGN KEY ("gift_card_id") REFERENCES "pos_gift_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_coupons" ADD CONSTRAINT "pos_coupons_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "pos_discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_quick_keys" ADD CONSTRAINT "pos_quick_keys_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_loyalty_members" ADD CONSTRAINT "pos_loyalty_members_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "pos_loyalty_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_loyalty_transactions" ADD CONSTRAINT "pos_loyalty_transactions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "pos_loyalty_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_loyalty_transactions" ADD CONSTRAINT "pos_loyalty_transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "pos_loyalty_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_gift_card_transactions" ADD CONSTRAINT "pos_gift_card_transactions_gift_card_id_fkey" FOREIGN KEY ("gift_card_id") REFERENCES "pos_gift_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_store_credits" ADD CONSTRAINT "pos_store_credits_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "pos_loyalty_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_returns" ADD CONSTRAINT "pos_returns_original_order_id_fkey" FOREIGN KEY ("original_order_id") REFERENCES "pos_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_return_items" ADD CONSTRAINT "pos_return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "pos_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_price_list_items" ADD CONSTRAINT "pos_price_list_items_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "pos_price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_layaway_payments" ADD CONSTRAINT "pos_layaway_payments_layaway_id_fkey" FOREIGN KEY ("layaway_id") REFERENCES "pos_layaways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_number_history" ADD CONSTRAINT "serial_number_history_serial_number_id_fkey" FOREIGN KEY ("serial_number_id") REFERENCES "serial_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bin_locations" ADD CONSTRAINT "bin_locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_item_bins" ADD CONSTRAINT "inventory_item_bins_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_item_bins" ADD CONSTRAINT "inventory_item_bins_bin_location_id_fkey" FOREIGN KEY ("bin_location_id") REFERENCES "bin_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_stock_entry_id_fkey" FOREIGN KEY ("stock_entry_id") REFERENCES "stock_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_from_bin_id_fkey" FOREIGN KEY ("from_bin_id") REFERENCES "bin_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_to_bin_id_fkey" FOREIGN KEY ("to_bin_id") REFERENCES "bin_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "units_of_measure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_inspection_checkpoints" ADD CONSTRAINT "qa_inspection_checkpoints_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "quality_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_operations" ADD CONSTRAINT "work_order_operations_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workstation_shifts" ADD CONSTRAINT "workstation_shifts_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontracting_materials" ADD CONSTRAINT "subcontracting_materials_subcontracting_order_id_fkey" FOREIGN KEY ("subcontracting_order_id") REFERENCES "subcontracting_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontracting_materials" ADD CONSTRAINT "subcontracting_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_tools" ADD CONSTRAINT "equipment_tools_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineering_change_orders" ADD CONSTRAINT "engineering_change_orders_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_component_consumptions" ADD CONSTRAINT "work_order_component_consumptions_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_component_consumptions" ADD CONSTRAINT "work_order_component_consumptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_from_uom_id_fkey" FOREIGN KEY ("from_uom_id") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_to_uom_id_fkey" FOREIGN KEY ("to_uom_id") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_parent_sku_id_fkey" FOREIGN KEY ("parent_sku_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_valuations" ADD CONSTRAINT "inventory_valuations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kits" ADD CONSTRAINT "product_kits_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kit_items" ADD CONSTRAINT "product_kit_items_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "product_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kit_items" ADD CONSTRAINT "product_kit_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "serial_numbers_tenant_id_serial_no_key" ON "serial_numbers"("tenant_id", "serial_no");

-- CreateIndex
CREATE UNIQUE INDEX "batches_tenant_id_product_id_batch_no_key" ON "batches"("tenant_id", "product_id", "batch_no");

-- CreateIndex
CREATE UNIQUE INDEX "bin_locations_tenant_id_warehouse_id_code_key" ON "bin_locations"("tenant_id", "warehouse_id", "code");

