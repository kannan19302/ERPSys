"use client";
import { useState } from "react";
import { Modal, PageHeader } from "@unerp/ui";
import { FormView, ListView, RouteGuard } from "@unerp/framework";
import { serialNumberResource } from "@/modules/inventory";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
export default function SerialNumbersPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="inventory.stock.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Track serialized inventory, status, warehouse assignment, and warranty dates."
      >
        <div className="ui-card">
          <PageHeader
            title="Serial Numbers"
            description="Track serialized inventory, status, warehouse assignment, and warranty dates."
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Inventory", href: "/inventory" },
              { label: "Serial Numbers" },
            ]}
          />
          <ListView
            resource={serialNumberResource}
            onCreate={() => setShowCreate(true)}
          />
          <Modal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            title="Create Serial Number"
          >
            <FormView
              resource={serialNumberResource}
              onSuccess={() => setShowCreate(false)}
              onCancel={() => setShowCreate(false)}
            />
          </Modal>
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
