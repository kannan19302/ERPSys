-- Inventory Cycle 16: ASN, Inbound/Outbound Logistics, Carrier Management

CREATE TABLE "shipping_carriers" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tracking_url" TEXT,
  "contact_email" TEXT,
  "contact_phone" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shipping_carriers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "shipping_carriers_tenant_id_code_key" ON "shipping_carriers"("tenant_id", "code");
CREATE INDEX "shipping_carriers_tenant_id_idx" ON "shipping_carriers"("tenant_id");

CREATE TABLE "carrier_service_levels" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "carrier_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "transit_days" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "carrier_service_levels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "carrier_service_levels_tenant_id_carrier_id_code_key" ON "carrier_service_levels"("tenant_id", "carrier_id", "code");
CREATE INDEX "carrier_service_levels_tenant_id_idx" ON "carrier_service_levels"("tenant_id");

ALTER TABLE "carrier_service_levels" ADD CONSTRAINT "carrier_service_levels_carrier_id_fkey"
  FOREIGN KEY ("carrier_id") REFERENCES "shipping_carriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "advance_shipping_notices" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "asn_number" TEXT NOT NULL,
  "vendor_id" TEXT NOT NULL,
  "purchase_order_id" TEXT,
  "warehouse_id" TEXT NOT NULL,
  "ship_date" TIMESTAMP(3),
  "expected_arrival" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "carrier_name" TEXT,
  "tracking_number" TEXT,
  "notes" TEXT,
  "received_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "advance_shipping_notices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "advance_shipping_notices_tenant_id_asn_number_key" ON "advance_shipping_notices"("tenant_id", "asn_number");
CREATE INDEX "advance_shipping_notices_tenant_id_idx" ON "advance_shipping_notices"("tenant_id");
CREATE INDEX "advance_shipping_notices_tenant_id_vendor_id_idx" ON "advance_shipping_notices"("tenant_id", "vendor_id");

CREATE TABLE "asn_line_items" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "asn_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "expected_qty" DECIMAL(15,4) NOT NULL,
  "received_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
  "uom" TEXT NOT NULL DEFAULT 'EA',
  "lot_number" TEXT,
  "serial_nos" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "asn_line_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asn_line_items_tenant_id_idx" ON "asn_line_items"("tenant_id");
CREATE INDEX "asn_line_items_asn_id_idx" ON "asn_line_items"("asn_id");

ALTER TABLE "asn_line_items" ADD CONSTRAINT "asn_line_items_asn_id_fkey"
  FOREIGN KEY ("asn_id") REFERENCES "advance_shipping_notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "inbound_shipments" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "shipment_number" TEXT NOT NULL,
  "asn_id" TEXT,
  "carrier_id" TEXT,
  "warehouse_id" TEXT NOT NULL,
  "tracking_number" TEXT,
  "status" TEXT NOT NULL DEFAULT 'EXPECTED',
  "expected_arrival" TIMESTAMP(3),
  "arrived_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "total_pallets" INTEGER,
  "total_cartons" INTEGER,
  "total_weight" DECIMAL(15,3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inbound_shipments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inbound_shipments_tenant_id_shipment_number_key" ON "inbound_shipments"("tenant_id", "shipment_number");
CREATE INDEX "inbound_shipments_tenant_id_idx" ON "inbound_shipments"("tenant_id");

ALTER TABLE "inbound_shipments" ADD CONSTRAINT "inbound_shipments_carrier_id_fkey"
  FOREIGN KEY ("carrier_id") REFERENCES "shipping_carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "outbound_shipments" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "shipment_number" TEXT NOT NULL,
  "sales_order_id" TEXT,
  "carrier_id" TEXT,
  "service_level_id" TEXT,
  "warehouse_id" TEXT NOT NULL,
  "tracking_number" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "ship_date" TIMESTAMP(3),
  "estimated_delivery" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "total_pallets" INTEGER,
  "total_cartons" INTEGER,
  "total_weight" DECIMAL(15,3),
  "label_url" TEXT,
  "proof_of_delivery" TEXT,
  "recipient_name" TEXT,
  "recipient_addr" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "outbound_shipments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "outbound_shipments_tenant_id_shipment_number_key" ON "outbound_shipments"("tenant_id", "shipment_number");
CREATE INDEX "outbound_shipments_tenant_id_idx" ON "outbound_shipments"("tenant_id");
CREATE INDEX "outbound_shipments_tenant_id_sales_order_id_idx" ON "outbound_shipments"("tenant_id", "sales_order_id");

ALTER TABLE "outbound_shipments" ADD CONSTRAINT "outbound_shipments_carrier_id_fkey"
  FOREIGN KEY ("carrier_id") REFERENCES "shipping_carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "shipment_tracking_events" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "inbound_shipment_id" TEXT,
  "outbound_shipment_id" TEXT,
  "event_code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT,
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_tracking_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "shipment_tracking_events_tenant_id_idx" ON "shipment_tracking_events"("tenant_id");
CREATE INDEX "shipment_tracking_events_inbound_shipment_id_idx" ON "shipment_tracking_events"("inbound_shipment_id");
CREATE INDEX "shipment_tracking_events_outbound_shipment_id_idx" ON "shipment_tracking_events"("outbound_shipment_id");

ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_inbound_shipment_id_fkey"
  FOREIGN KEY ("inbound_shipment_id") REFERENCES "inbound_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_outbound_shipment_id_fkey"
  FOREIGN KEY ("outbound_shipment_id") REFERENCES "outbound_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
