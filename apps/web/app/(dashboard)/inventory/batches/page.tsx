"use client";
import { useState } from "react";
import { Modal, PageHeader } from "@unerp/ui";
import { FormView, ListView, RouteGuard } from "@unerp/framework";
import { batchResource } from "@/modules/inventory";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
export default function BatchesPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="inventory.stock.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Manage product batches, lot numbers, expiry dates, and usage status."
      >
        <div className="ui-card">
          <PageHeader
            title="Batch Tracking"
            description="Manage product batches, lot numbers, expiry dates, and usage status."
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Inventory", href: "/inventory" },
              { label: "Batches" },
            ]}
          />
          <ListView
            resource={batchResource}
            onCreate={() => setShowCreate(true)}
          />
          <Modal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            title="Create Batch"
          >
            <FormView
              resource={batchResource}
              onSuccess={() => setShowCreate(false)}
              onCancel={() => setShowCreate(false)}
            />
          </Modal>
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
