"use client";
import { useState } from "react";
import { Modal, PageHeader } from "@unerp/ui";
import { FormView, ListView, RouteGuard } from "@unerp/framework";
import { cycleCountScheduleResource } from "@/modules/inventory";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
export default function CycleCountSchedulesPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="inventory.stock.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Schedule recurring blind or guided counts by warehouse zone and bin scope."
      >
        <div className="ui-card">
          <PageHeader
            title="Cycle Count Schedules"
            description="Schedule recurring blind or guided counts by warehouse zone and bin scope."
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Inventory", href: "/inventory" },
              { label: "Cycle Count Schedules" },
            ]}
          />
          <ListView
            resource={cycleCountScheduleResource}
            onCreate={() => setShowCreate(true)}
          />
          <Modal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            title="Create Cycle Count Schedule"
          >
            <FormView
              resource={cycleCountScheduleResource}
              onSuccess={() => setShowCreate(false)}
              onCancel={() => setShowCreate(false)}
            />
          </Modal>
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
