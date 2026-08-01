"use client";
import { PageHeader } from "@unerp/ui";
import { ListView, RouteGuard } from "@unerp/framework";
import { stockLevelResource } from "@/modules/inventory";

import { Package as InventoryModuleIcon } from "lucide-react";
export default function StockLevelsPage() {
  return (
    <RouteGuard permission="inventory.stock.read">
      <div className="ui-card">
        <PageHeader
          title="Warehouse Stock Levels"
          description="Monitor quantities on hand across company storage depots and warehouses."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Inventory", href: "/inventory" },
            { label: "Stock Levels" },
          ]}
        />
        <ListView resource={stockLevelResource} />
      </div>
    </RouteGuard>
  );
}
