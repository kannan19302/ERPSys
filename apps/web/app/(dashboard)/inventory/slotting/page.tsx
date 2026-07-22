"use client";
import styles from "./page.module.css";
import React, { useCallback, useState, useEffect } from "react";
import {
  PageHeader,
  Badge,
  ListPageTemplate,
  FormField,
  Select,
  type ListColumn,
} from "@unerp/ui";
import { AlertCircle, LayoutGrid } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
interface Recommendation {
  productId: string;
  productName: string;
  currentBinCode: string;
  currentZone: string;
  pickFrequency: number;
  recommendation: "MOVE_TO_PREFERRED_ZONE" | "MOVE_TO_RESERVE_ZONE";
  suggestedBinCode: string | null;
}

const columns: ListColumn[] = [
  { key: "productName", header: "Product" },
  {
    key: "currentBinCode",
    header: "Current Bin",
    render: (v, row) => {
      const r = row as unknown as Recommendation;
      return (
        <span className="font-mono">
          {r.currentBinCode} ({r.currentZone})
        </span>
      );
    },
  },
  { key: "pickFrequency", header: "Pick Frequency (30d)" },
  {
    key: "recommendation",
    header: "Recommendation",
    render: (v) => (
      <Badge variant={v === "MOVE_TO_PREFERRED_ZONE" ? "warning" : "default"}>
        {v === "MOVE_TO_PREFERRED_ZONE" ? "Move to Zone A" : "Move to Reserve"}
      </Badge>
    ),
  },
  {
    key: "suggestedBinCode",
    header: "Suggested Bin",
    render: (v) => <span className="font-mono">{v ? String(v) : "—"}</span>,
  },
];

export default function SlottingPage() {
  const client = useApiClient();
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWarehouses = useCallback(async () => {
    try {
      const response = await client.get<unknown>("/inventory/warehouses");
      const data =
        response && typeof response === "object" && "data" in response
          ? (response as { data?: unknown }).data
          : response;
      const whs = (Array.isArray(data) ? data : []) as Array<{
        id: string;
        name: string;
      }>;
      setWarehouses(whs);
      const firstWarehouse = whs[0];
      if (firstWarehouse) setWarehouseId(firstWarehouse.id);
    } catch {
      setWarehouses([{ id: "wh-1", name: "Schenectady Central Depot" }]);
      setWarehouseId("wh-1");
    }
  }, [client]);

  const loadRecommendations = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await client.get<{ recommendations?: Recommendation[] }>(
        `/inventory/slotting/recommendations?warehouseId=${warehouseId}`,
      );
      setRecommendations(data.recommendations || []);
    } catch {
      setError("Serving local mock fallback registry.");
      setRecommendations([
        {
          productId: "p1",
          productName: "Refined Vibranium Alloy Ingot",
          currentBinCode: "B-04-02",
          currentZone: "B",
          pickFrequency: 340,
          recommendation: "MOVE_TO_PREFERRED_ZONE",
          suggestedBinCode: "A-01-01",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [client, warehouseId]);

  useEffect(() => {
    void loadWarehouses();
  }, [loadWarehouses]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  return (
    <RouteGuard permission="inventory.slotting.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Fast-moving products flagged for a preferred zone, slow movers flagged out of it — based on real pick frequency over the trailing 30 days."
      >
        <div className="ui-stack-6 ui-animate-in">
          <PageHeader
            title="Dynamic Slotting Optimization"
            description="Fast-moving products flagged for a preferred zone, slow movers flagged out of it — based on real pick frequency over the trailing 30 days."
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Inventory", href: "/inventory" },
              { label: "Slotting Optimization" },
            ]}
          />

          {error && (
            <div className={styles.s1}>
              <AlertCircle size={16} />
              <span>Note: {error}</span>
            </div>
          )}

          <div className={styles.s2}>
            <FormField label="Warehouse" htmlFor="slotting-warehouse">
              <Select
                id="slotting-warehouse"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className={styles.s3}>
            <LayoutGrid size={16} /> Re-Slotting Recommendations
          </div>

          <ListPageTemplate
            columns={columns}
            data={recommendations as unknown as Record<string, unknown>[]}
            loading={loading}
            searchable
          />
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
