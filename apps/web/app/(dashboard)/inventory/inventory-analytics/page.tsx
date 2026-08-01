"use client";
import { useState, useEffect } from "react";
import { Card, Badge, ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  Activity,
  TrendingDown,
  BarChart2,
  Package,
  AlertTriangle,
  Warehouse,
} from "lucide-react";

import { Package as InventoryModuleIcon } from "lucide-react";
interface AnalyticsDashboard {
  healthScore: number;
  slowMoverCount: number;
  netMovement30d: number;
  totalInbound30d: number;
  totalOutbound30d: number;
}

interface HealthScore {
  healthScore: number;
  totalProducts: number;
  activeProducts: number;
  movingProductRate: number;
  lowStockProducts: number;
  activeHolds: number;
}

interface SlowMovers {
  period: string;
  slowMoverCount: number;
  items: { productId: string; warehouseId: string; onHandQty: number }[];
}

interface DIO {
  averageDio: number;
  products: {
    productId: string;
    onHand: number;
    avgDailySales: number;
    daysInventoryOutstanding: number | null;
  }[];
}

interface FillRate {
  period: string;
  fillRate: number;
  totalPickWaves: number;
  completedWaves: number;
  partialWaves: number;
  totalOrderLines: number;
  fulfilledOrderLines: number;
}

interface VolumeTrends {
  period: string;
  totalInbound: number;
  totalOutbound: number;
  netMovement: number;
  daily: { date: string; inbound: number; outbound: number }[];
}

interface Shrinkage {
  period: string;
  totalAdjustments: number;
  negativeAdjustments: number;
  totalShrinkage: number;
  byProduct: { productId: string; shrinkage: number }[];
}

interface CapacityRow {
  warehouseId: string;
  warehouse: { id: string; name: string; code: string } | null;
  occupiedBins: number;
  totalQuantity: number;
}

interface MultiWarehouse {
  warehouseId: string;
  warehouse: { id: string; name: string; code: string } | null;
  onHandQty: number;
  occupiedBins: number;
  inbound30d: number;
  outbound30d: number;
  transactions30d: number;
}

type Tab =
  | "dashboard"
  | "health"
  | "slow"
  | "dio"
  | "fillrate"
  | "trends"
  | "shrinkage"
  | "capacity"
  | "multiwarehouse";

export default function InventoryAnalyticsPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [overview, setOverview] = useState<AnalyticsDashboard | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [slow, setSlow] = useState<SlowMovers | null>(null);
  const [dio, setDio] = useState<DIO | null>(null);
  const [fillRate, setFillRate] = useState<FillRate | null>(null);
  const [trends, setTrends] = useState<VolumeTrends | null>(null);
  const [shrinkage, setShrinkage] = useState<Shrinkage | null>(null);
  const [capacity, setCapacity] = useState<CapacityRow[]>([]);
  const [multi, setMulti] = useState<MultiWarehouse[]>([]);

  useEffect(() => {
    client
      .get<AnalyticsDashboard>("/inventory/analytics/dashboard")
      .then(setOverview)
      .catch(() => undefined);
  }, [client]);

  useEffect(() => {
    if (tab === "health")
      client
        .get<HealthScore>("/inventory/analytics/health")
        .then(setHealth)
        .catch(() => undefined);
    if (tab === "slow")
      client
        .get<SlowMovers>("/inventory/analytics/slow-moving")
        .then(setSlow)
        .catch(() => undefined);
    if (tab === "dio")
      client
        .get<DIO>("/inventory/analytics/dio")
        .then(setDio)
        .catch(() => undefined);
    if (tab === "fillrate")
      client
        .get<FillRate>("/inventory/analytics/fill-rate")
        .then(setFillRate)
        .catch(() => undefined);
    if (tab === "trends")
      client
        .get<VolumeTrends>("/inventory/analytics/volume-trends")
        .then(setTrends)
        .catch(() => undefined);
    if (tab === "shrinkage")
      client
        .get<Shrinkage>("/inventory/analytics/shrinkage")
        .then(setShrinkage)
        .catch(() => undefined);
    if (tab === "capacity")
      client
        .get<CapacityRow[]>("/inventory/analytics/capacity")
        .then(setCapacity)
        .catch(() => undefined);
    if (tab === "multiwarehouse")
      client
        .get<MultiWarehouse[]>("/inventory/analytics/multi-warehouse")
        .then(setMulti)
        .catch(() => undefined);
  }, [tab, client]);

  const scoreColor = (n: number) =>
    n >= 75 ? "text-green-600" : n >= 50 ? "text-yellow-600" : "text-red-600";

  const TABS: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Overview" },
    { key: "health", label: "Health Score" },
    { key: "slow", label: "Slow Movers" },
    { key: "dio", label: "DIO" },
    { key: "fillrate", label: "Fill Rate" },
    { key: "trends", label: "Volume Trends" },
    { key: "shrinkage", label: "Shrinkage" },
    { key: "capacity", label: "Capacity" },
    { key: "multiwarehouse", label: "Multi-Warehouse" },
  ];

  return (
    <RouteGuard permission="inventory.inventory-analytics.read">
      <div className="ui-page-shell">
        <div>
          <h1 className="text-2xl font-bold">Inventory Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Health, trends, fill rate, and warehouse performance
          </p>
        </div>

        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: "Health Score",
                value: `${overview.healthScore}`,
                icon: Activity,
                color: scoreColor(overview.healthScore),
              },
              {
                label: "Slow Movers",
                value: overview.slowMoverCount,
                icon: TrendingDown,
                color: "text-orange-600",
              },
              {
                label: "Net Movement (30d)",
                value: Math.round(overview.netMovement30d),
                icon: BarChart2,
                color: "text-blue-600",
              },
              {
                label: "Inbound (30d)",
                value: Math.round(overview.totalInbound30d),
                icon: Package,
                color: "text-green-600",
              },
              {
                label: "Outbound (30d)",
                value: Math.round(overview.totalOutbound30d),
                icon: Package,
                color: "text-purple-600",
              },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                  <s.icon className={`w-8 h-8 ${s.color}`} />
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-1 border-b overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && overview && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">30-Day Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Inventory Health</span>
                <span
                  className={`font-bold ${scoreColor(overview.healthScore)}`}
                >
                  {overview.healthScore}/100
                </span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Slow-Moving SKUs</span>
                <span className="font-semibold">{overview.slowMoverCount}</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Total Inbound</span>
                <span className="font-semibold">
                  {Math.round(overview.totalInbound30d).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-muted-foreground">Total Outbound</span>
                <span className="font-semibold">
                  {Math.round(overview.totalOutbound30d).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Net Movement</span>
                <span
                  className={`font-semibold ${overview.netMovement30d >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {overview.netMovement30d >= 0 ? "+" : ""}
                  {Math.round(overview.netMovement30d).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        )}

        {tab === "health" && health && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className={`text-5xl font-bold ${scoreColor(health.healthScore)}`}
              >
                {health.healthScore}
              </div>
              <div>
                <p className="font-semibold">Inventory Health Score</p>
                <p className="text-sm text-muted-foreground">
                  Based on movement, holds, and stock levels
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                ["Total Products", health.totalProducts],
                ["Active (moving)", health.activeProducts],
                ["Moving Rate", `${health.movingProductRate}%`],
                ["Low Stock SKUs", health.lowStockProducts],
                ["Active Holds", health.activeHolds],
              ].map(([label, value]) => (
                <div key={String(label)} className="border rounded p-3">
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="font-bold text-lg">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "slow" && slow && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Slow-Moving Inventory ({slow.period})
              </h3>
              <Badge variant="warning">{slow.slowMoverCount} SKUs</Badge>
            </div>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "productId",
                    header: "Product ID",
                    render: (v) => (
                      <span className="font-mono text-xs">{String(v)}</span>
                    ),
                  },
                  {
                    key: "warehouseId",
                    header: "Warehouse",
                    render: (v) => (
                      <span className="font-mono text-xs">{String(v)}</span>
                    ),
                  },
                  {
                    key: "onHandQty",
                    header: "On-Hand Qty",
                    render: (v) => Number(v).toFixed(0),
                  },
                ] as ListColumn[]
              }
              data={
                slow.items.slice(0, 100) as unknown as Record<string, unknown>[]
              }
              loading={false}
              emptyTitle="No slow movers found"
              emptyDescription="No slow-moving inventory detected."
            />
          </Card>
        )}

        {tab === "dio" && dio && (
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl font-bold text-blue-600">
                {dio.averageDio}
              </div>
              <div>
                <p className="font-semibold">Avg Days Inventory Outstanding</p>
                <p className="text-sm text-muted-foreground">
                  Across all products with sales history
                </p>
              </div>
            </div>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "productId",
                    header: "Product",
                    render: (v) => (
                      <span className="font-mono text-xs">{String(v)}</span>
                    ),
                  },
                  {
                    key: "onHand",
                    header: "On-Hand",
                    render: (v) => Number(v).toFixed(0),
                  },
                  {
                    key: "avgDailySales",
                    header: "Avg Daily Sales",
                    render: (v) => Number(v).toFixed(2),
                  },
                  {
                    key: "daysInventoryOutstanding",
                    header: "DIO",
                    render: (v) => (v != null ? Number(v).toFixed(1) : "—"),
                  },
                ] as ListColumn[]
              }
              data={
                dio.products
                  .filter((p) => p.daysInventoryOutstanding !== null)
                  .sort(
                    (a, b) =>
                      (b.daysInventoryOutstanding ?? 0) -
                      (a.daysInventoryOutstanding ?? 0),
                  )
                  .slice(0, 50) as unknown as Record<string, unknown>[]
              }
              loading={false}
              emptyTitle="No DIO data"
              emptyDescription="No products with sales history found."
            />
          </Card>
        )}

        {tab === "fillrate" && fillRate && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className={`text-5xl font-bold ${scoreColor(fillRate.fillRate)}`}
              >
                {fillRate.fillRate}%
              </div>
              <div>
                <p className="font-semibold">Fill Rate ({fillRate.period})</p>
                <p className="text-sm text-muted-foreground">
                  Order fulfillment from pick waves
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                ["Total Waves", fillRate.totalPickWaves],
                ["Completed", fillRate.completedWaves],
                ["Partial", fillRate.partialWaves],
                ["Total Order Lines", fillRate.totalOrderLines],
                ["Fulfilled Lines", fillRate.fulfilledOrderLines],
              ].map(([label, value]) => (
                <div key={String(label)} className="border rounded p-3">
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="font-bold text-lg">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "trends" && trends && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Volume Trends ({trends.period})</h3>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  In: {Math.round(trends.totalInbound).toLocaleString()}
                </span>
                <span className="text-red-600 font-medium">
                  Out: {Math.round(trends.totalOutbound).toLocaleString()}
                </span>
              </div>
            </div>
            <ListPageTemplate
              columns={
                [
                  { key: "date", header: "Date" },
                  {
                    key: "inbound",
                    header: "Inbound",
                    render: (v) => (
                      <span className="text-green-600">
                        {Number(v).toFixed(0)}
                      </span>
                    ),
                  },
                  {
                    key: "outbound",
                    header: "Outbound",
                    render: (v) => (
                      <span className="text-red-600">
                        {Number(v).toFixed(0)}
                      </span>
                    ),
                  },
                  {
                    key: "inbound",
                    header: "Net",
                    render: (v, row) => {
                      const net = Number(v) - Number(row.outbound);
                      return (
                        <span
                          className={
                            net >= 0
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {net.toFixed(0)}
                        </span>
                      );
                    },
                  },
                ] as ListColumn[]
              }
              data={
                trends.daily.slice(-30).reverse() as unknown as Record<
                  string,
                  unknown
                >[]
              }
              loading={false}
              emptyTitle="No movement data"
              emptyDescription="No volume trends recorded."
            />
          </Card>
        )}

        {tab === "shrinkage" && shrinkage && (
          <Card className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-semibold">
                  Shrinkage Report ({shrinkage.period})
                </p>
                <p className="text-sm text-muted-foreground">
                  Total shrinkage:{" "}
                  <strong>{shrinkage.totalShrinkage.toFixed(2)}</strong> units
                  across {shrinkage.negativeAdjustments} negative adjustments
                </p>
              </div>
            </div>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "productId",
                    header: "Product ID",
                    render: (v) => (
                      <span className="font-mono text-xs">{String(v)}</span>
                    ),
                  },
                  {
                    key: "shrinkage",
                    header: "Shrinkage",
                    render: (v) => (
                      <span className="text-red-600 font-medium">
                        {Number(v).toFixed(2)}
                      </span>
                    ),
                  },
                ] as ListColumn[]
              }
              data={shrinkage.byProduct as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No shrinkage recorded"
              emptyDescription="No shrinkage adjustments recorded."
            />
          </Card>
        )}

        {tab === "capacity" && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              Warehouse Capacity Utilization
            </h3>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "warehouse",
                    header: "Warehouse",
                    render: (v, row) =>
                      String((v as any)?.name ?? row.warehouseId),
                  },
                  {
                    key: "warehouse",
                    header: "Code",
                    render: (v) => (
                      <span className="font-mono text-xs">
                        {String((v as any)?.code ?? "—")}
                      </span>
                    ),
                  },
                  { key: "occupiedBins", header: "Occupied Bins" },
                  {
                    key: "totalQuantity",
                    header: "Total Qty",
                    render: (v) => Number(v).toLocaleString(),
                  },
                ] as ListColumn[]
              }
              data={capacity as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No capacity data"
              emptyDescription="No warehouse capacity data available."
            />
          </Card>
        )}

        {tab === "multiwarehouse" && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              Multi-Warehouse Comparison (30d)
            </h3>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "warehouse",
                    header: "Warehouse",
                    render: (v, row) => (
                      <span className="font-medium">
                        {String((v as any)?.name ?? row.warehouseId)}
                      </span>
                    ),
                  },
                  {
                    key: "onHandQty",
                    header: "On-Hand",
                    render: (v) => Number(v).toLocaleString(),
                  },
                  { key: "occupiedBins", header: "Bins" },
                  {
                    key: "inbound30d",
                    header: "Inbound",
                    render: (v) => (
                      <span className="text-green-600">
                        {Math.round(Number(v)).toLocaleString()}
                      </span>
                    ),
                  },
                  {
                    key: "outbound30d",
                    header: "Outbound",
                    render: (v) => (
                      <span className="text-red-600">
                        {Math.round(Number(v)).toLocaleString()}
                      </span>
                    ),
                  },
                  { key: "transactions30d", header: "Transactions" },
                ] as ListColumn[]
              }
              data={multi as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No warehouse data"
              emptyDescription="No multi-warehouse data available."
            />
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
