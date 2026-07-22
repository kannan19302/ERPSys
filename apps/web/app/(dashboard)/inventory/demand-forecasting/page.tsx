"use client";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";

type Tab =
  | "dashboard"
  | "forecasts"
  | "reorder-points"
  | "replenishment"
  | "stockout"
  | "safety-stock";

export default function DemandForecastingPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dashboard, setDashboard] = useState<any>(null);
  const [forecasts, setForecasts] = useState<Record<string, unknown>[]>([]);
  const [reorderPoints, setReorderPoints] = useState<Record<string, unknown>[]>(
    [],
  );
  const [replenishments, setReplenishments] = useState<
    Record<string, unknown>[]
  >([]);
  const [stockouts, setStockouts] = useState<Record<string, unknown>[]>([]);
  const [safetyConfigs, setSafetyConfigs] = useState<Record<string, unknown>[]>(
    [],
  );
  const [reorderAlerts, setReorderAlerts] = useState<Record<string, unknown>[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "dashboard") {
        const [dash, alerts] = await Promise.all([
          client.get("/inventory/demand-forecasting/dashboard"),
          client.get<Record<string, unknown>[]>(
            "/inventory/demand-forecasting/reorder-alerts",
          ),
        ]);
        setDashboard(dash);
        setReorderAlerts(alerts);
      } else if (tab === "forecasts") {
        setForecasts(
          await client.get<Record<string, unknown>[]>(
            "/inventory/demand-forecasting/forecasts",
          ),
        );
      } else if (tab === "reorder-points") {
        setReorderPoints(
          await client.get<Record<string, unknown>[]>(
            "/inventory/demand-forecasting/reorder-points",
          ),
        );
      } else if (tab === "replenishment") {
        setReplenishments(
          await client.get<Record<string, unknown>[]>(
            "/inventory/demand-forecasting/replenishment-orders",
          ),
        );
      } else if (tab === "stockout") {
        setStockouts(
          await client.get<Record<string, unknown>[]>(
            "/inventory/demand-forecasting/stockout-predictions",
          ),
        );
      } else if (tab === "safety-stock") {
        setSafetyConfigs(
          await client.get<Record<string, unknown>[]>(
            "/inventory/demand-forecasting/safety-stock",
          ),
        );
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [client, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "forecasts", label: "Forecasts" },
    { id: "reorder-points", label: "Reorder Points" },
    { id: "replenishment", label: "Replenishment" },
    { id: "stockout", label: "Stockout Risk" },
    { id: "safety-stock", label: "Safety Stock" },
  ];

  return (
    <InventoryTabLayout
      tabs={INVENTORY_TABS}
      moduleId="inventory"
      moduleLabel="Inventory & Stock"
      moduleIcon={InventoryModuleIcon}
      moduleDescription="Statistical demand forecasting, reorder points, replenishment, and stockout risk."
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Demand Forecasting
          </h1>
          <button
            onClick={load}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 text-red-700 text-sm dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading…
          </div>
        )}

        {tab === "dashboard" && dashboard && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  label: "Active Forecasts",
                  value: dashboard.activeForecasts,
                  color: "blue",
                },
                {
                  label: "Active ROP Configs",
                  value: dashboard.activeReorderPoints,
                  color: "green",
                },
                {
                  label: "Pending Replenishments",
                  value: dashboard.pendingReplenishments,
                  color: "yellow",
                },
                {
                  label: "Critical Stockouts",
                  value: dashboard.criticalStockouts,
                  color: "red",
                },
                {
                  label: "Below ROP",
                  value: dashboard.belowRopCount,
                  color: "orange",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {m.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Urgent Replenishments",
                  value: dashboard.urgentReplenishments,
                },
                { label: "High Stockout Risk", value: dashboard.highStockouts },
                {
                  label: "Total Safety Configs",
                  value: dashboard.totalSafetyConfigs,
                },
                {
                  label: "Avg Forecast MAPE",
                  value:
                    dashboard.avgMape != null
                      ? `${(dashboard.avgMape * 100).toFixed(1)}%`
                      : "N/A",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {m.label}
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
            {reorderAlerts.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  ⚠ Reorder Alerts ({reorderAlerts.length})
                </h3>
                <div className="space-y-2">
                  {reorderAlerts.map((a, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm text-yellow-700 dark:text-yellow-400"
                    >
                      <span>{String(a.productId ?? "")}</span>
                      <span>
                        Stock: {String(a.currentQty ?? "")} / ROP:{" "}
                        {String(a.reorderPoint ?? "")}{" "}
                        {a.belowSafetyStock ? "🔴 BELOW SAFETY" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "forecasts" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await client.post(
                      "/inventory/demand-forecasting/forecasts/run-engine",
                      { horizon: 30, method: "MOVING_AVG", lookbackDays: 90 },
                    );
                    load();
                  } catch (e: any) {
                    setError(e.message);
                  }
                }}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Run Forecast Engine
              </button>
            </div>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "productId",
                    header: "Product",
                    render: (v) => (
                      <span className="font-mono text-xs">
                        {String(v).slice(0, 12)}…
                      </span>
                    ),
                  },
                  {
                    key: "forecastDate",
                    header: "Date",
                    render: (v) => new Date(String(v)).toLocaleDateString(),
                  },
                  { key: "horizon", header: "Horizon", render: (v) => `${v}d` },
                  { key: "method", header: "Method" },
                  {
                    key: "forecastedQty",
                    header: "Forecasted Qty",
                    render: (v) => Number(v).toFixed(2),
                  },
                  {
                    key: "actualQty",
                    header: "Actual Qty",
                    render: (v) => (v ? Number(v).toFixed(2) : "—"),
                  },
                  {
                    key: "mape",
                    header: "MAPE",
                    render: (v) =>
                      v ? `${(Number(v) * 100).toFixed(1)}%` : "—",
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (v) => (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : v === "SUPERSEDED"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {String(v)}
                      </span>
                    ),
                  },
                ] as ListColumn[]
              }
              data={forecasts as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No forecasts"
              emptyDescription="Run the engine to generate forecasts."
            />
          </div>
        )}

        {tab === "reorder-points" && (
          <ListPageTemplate
            columns={
              [
                {
                  key: "productId",
                  header: "Product",
                  render: (v) => (
                    <span className="font-mono text-xs">
                      {String(v).slice(0, 12)}…
                    </span>
                  ),
                },
                {
                  key: "warehouseId",
                  header: "Warehouse",
                  render: (v) => String(v ?? "—"),
                },
                {
                  key: "reorderPoint",
                  header: "Reorder Point",
                  render: (v) => Number(v).toFixed(2),
                },
                {
                  key: "reorderQty",
                  header: "Reorder Qty",
                  render: (v) => Number(v).toFixed(2),
                },
                {
                  key: "safetyStock",
                  header: "Safety Stock",
                  render: (v) => Number(v).toFixed(2),
                },
                {
                  key: "leadTimeDays",
                  header: "Lead Time",
                  render: (v) => `${v}d`,
                },
                {
                  key: "avgDailyDemand",
                  header: "Avg Daily Demand",
                  render: (v) => Number(v).toFixed(2),
                },
                {
                  key: "serviceLevel",
                  header: "Service Level",
                  render: (v) => `${(Number(v) * 100).toFixed(0)}%`,
                },
                {
                  key: "isActive",
                  header: "Active",
                  render: (v) => (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${v ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {v ? "Active" : "Inactive"}
                    </span>
                  ),
                },
              ] as ListColumn[]
            }
            data={reorderPoints as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyTitle="No reorder points configured"
            emptyDescription="No reorder points have been configured."
          />
        )}

        {tab === "replenishment" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const r = await client.post<{ generated: number }>(
                      "/inventory/demand-forecasting/replenishment-orders/auto-generate",
                    );
                    setError(`Generated ${r.generated} replenishment orders`);
                    load();
                  } catch (e: any) {
                    setError(e.message);
                  }
                }}
                className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Auto-Generate from ROP
              </button>
            </div>
            <ListPageTemplate
              columns={
                [
                  { key: "orderNumber", header: "Order #" },
                  {
                    key: "productId",
                    header: "Product",
                    render: (v) => (
                      <span className="font-mono text-xs">
                        {String(v).slice(0, 12)}…
                      </span>
                    ),
                  },
                  { key: "warehouseId", header: "Warehouse" },
                  {
                    key: "suggestedQty",
                    header: "Suggested Qty",
                    render: (v, row) =>
                      `${Number(v).toFixed(2)} ${row.uom ?? ""}`,
                  },
                  { key: "triggerType", header: "Trigger" },
                  {
                    key: "priority",
                    header: "Priority",
                    render: (v) => (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v === "URGENT"
                            ? "bg-red-100 text-red-700"
                            : v === "HIGH"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (v) => (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          v === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : v === "APPROVED"
                              ? "bg-blue-100 text-blue-700"
                              : v === "ORDERED"
                                ? "bg-purple-100 text-purple-700"
                                : v === "RECEIVED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "createdAt",
                    header: "Created",
                    render: (v) => new Date(String(v)).toLocaleDateString(),
                  },
                ] as ListColumn[]
              }
              data={replenishments as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No replenishment orders"
              emptyDescription="No replenishment orders have been generated."
            />
          </div>
        )}

        {tab === "stockout" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const r = await client.post<{ generated: number }>(
                      "/inventory/demand-forecasting/stockout-predictions/generate",
                      { riskThresholdDays: 30 },
                    );
                    setError(`Generated ${r.generated} predictions`);
                    load();
                  } catch (e: any) {
                    setError(e.message);
                  }
                }}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Generate Predictions
              </button>
            </div>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "productId",
                    header: "Product",
                    render: (v) => (
                      <span className="font-mono text-xs">
                        {String(v).slice(0, 12)}…
                      </span>
                    ),
                  },
                  { key: "warehouseId", header: "Warehouse" },
                  {
                    key: "currentStock",
                    header: "Current Stock",
                    render: (v) => Number(v).toFixed(2),
                  },
                  {
                    key: "avgDailyDemand",
                    header: "Avg Daily Demand",
                    render: (v) => Number(v).toFixed(2),
                  },
                  {
                    key: "daysOfStock",
                    header: "Days of Stock",
                    render: (v) => Number(v).toFixed(1),
                  },
                  {
                    key: "predictedStockoutDate",
                    header: "Predicted Stockout",
                    render: (v) =>
                      v ? new Date(String(v)).toLocaleDateString() : "—",
                  },
                  {
                    key: "riskLevel",
                    header: "Risk",
                    render: (v) => (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          v === "CRITICAL"
                            ? "bg-red-100 text-red-700"
                            : v === "HIGH"
                              ? "bg-orange-100 text-orange-700"
                              : v === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                        }`}
                      >
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "acknowledged",
                    header: "Acknowledged",
                    render: (v) => (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${v ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {v ? "Yes" : "No"}
                      </span>
                    ),
                  },
                ] as ListColumn[]
              }
              data={stockouts as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No stockout predictions"
              emptyDescription="Generate predictions to see stockout risks."
            />
          </div>
        )}

        {tab === "safety-stock" && (
          <ListPageTemplate
            columns={
              [
                {
                  key: "productId",
                  header: "Product",
                  render: (v) => (
                    <span className="font-mono text-xs">
                      {String(v).slice(0, 12)}…
                    </span>
                  ),
                },
                {
                  key: "warehouseId",
                  header: "Warehouse",
                  render: (v) => String(v ?? "—"),
                },
                { key: "method", header: "Method" },
                {
                  key: "fixedQty",
                  header: "Fixed Qty",
                  render: (v) => (v ? Number(v).toFixed(2) : "—"),
                },
                {
                  key: "coverageDays",
                  header: "Coverage Days",
                  render: (v) => String(v ?? "—"),
                },
                {
                  key: "serviceLevel",
                  header: "Service Level",
                  render: (v) => (v ? `${(Number(v) * 100).toFixed(0)}%` : "—"),
                },
                {
                  key: "calculatedSafety",
                  header: "Calculated Safety",
                  render: (v) => (v ? Number(v).toFixed(2) : "—"),
                },
                {
                  key: "lastRecalcAt",
                  header: "Last Recalc",
                  render: (v) =>
                    v ? new Date(String(v)).toLocaleDateString() : "—",
                },
              ] as ListColumn[]
            }
            data={safetyConfigs as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyTitle="No safety stock configurations"
            emptyDescription="No safety stock configurations have been defined."
          />
        )}
      </div>
    </InventoryTabLayout>
  );
}
