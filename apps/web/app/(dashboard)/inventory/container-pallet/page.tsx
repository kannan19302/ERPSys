"use client";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn, StatCardRow } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
interface DashboardData {
  palletTypes: number;
  containerTypes: number;
  loadPlans: {
    draft: number;
    inProgress: number;
    loaded: number;
    shipped: number;
  };
  packingPlans: { draft: number; active: number; completed: number };
}

interface PalletType {
  id: string;
  code: string;
  name: string;
  category: string;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  maxWeightKg?: number;
}

interface ContainerType {
  id: string;
  code: string;
  name: string;
  category: string;
  isoCode?: string;
  maxPayloadKg?: number;
  cubicMeters?: number;
}

interface LoadPlan {
  id: string;
  planNumber: string;
  status: string;
  containerTypeId: string;
  originWarehouse: string;
  totalWeightKg: number;
  pallets: { id: string }[];
  items: { id: string }[];
}

interface PackingPlan {
  id: string;
  planNumber: string;
  status: string;
  warehouseId: string;
  totalCartons: number;
  totalWeightKg: number;
  cartons: { id: string; cartonNumber: string; sealed: boolean }[];
}

const BASE = "/inventory/container-pallet";

function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(
    <T,>(path: string, opts?: RequestInit) =>
      client.request<T>(path, {
        method: opts?.method,
        body: opts?.body ? String(opts.body) : undefined,
      }),
    [client],
  );
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPTIMIZING: "bg-blue-100 text-blue-700",
  READY: "bg-cyan-100 text-cyan-700",
  IN_LOADING: "bg-yellow-100 text-yellow-700",
  LOADED: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PACKING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export default function ContainerPalletPage() {
  const apiFetch = useFrameworkFetch();
  const [tab, setTab] = useState<
    "dashboard" | "pallets" | "containers" | "load-plans" | "packing-plans"
  >("dashboard");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
  const [loadPlans, setLoadPlans] = useState<LoadPlan[]>([]);
  const [packingPlans, setPackingPlans] = useState<PackingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "dashboard") {
        setDashboard(await apiFetch<DashboardData>(`${BASE}/dashboard`));
      } else if (tab === "pallets") {
        setPalletTypes(await apiFetch<PalletType[]>(`${BASE}/pallet-types`));
      } else if (tab === "containers") {
        setContainerTypes(
          await apiFetch<ContainerType[]>(`${BASE}/container-types`),
        );
      } else if (tab === "load-plans") {
        setLoadPlans(await apiFetch<LoadPlan[]>(`${BASE}/load-plans`));
      } else if (tab === "packing-plans") {
        setPackingPlans(await apiFetch<PackingPlan[]>(`${BASE}/packing-plans`));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const transition = async (
    type: "load-plans" | "packing-plans",
    id: string,
    action: string,
  ) => {
    await apiFetch(`${BASE}/${type}/${id}/transition`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    load();
  };

  const TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "pallets", label: "Pallet Types" },
    { key: "containers", label: "Container Types" },
    { key: "load-plans", label: "Load Plans" },
    { key: "packing-plans", label: "Packing Plans" },
  ] as const;

  return (
    <RouteGuard permission="inventory.container-pallet.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Manage inventory operations for this workspace."
      >
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Container & Pallet Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage load planning, container utilization, and packing
              operations
            </p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex gap-4">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Dashboard */}
          {tab === "dashboard" && dashboard && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Pallet Types", value: dashboard.palletTypes },
                  { label: "Container Types", value: dashboard.containerTypes },
                  {
                    label: "Active Load Plans",
                    value: dashboard.loadPlans.inProgress,
                  },
                  {
                    label: "Active Packing Plans",
                    value: dashboard.packingPlans.active,
                  },
                ].map((c) => (
                  <div key={c.label} className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {c.value}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Load Plans by Status
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(dashboard.loadPlans).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {k.replace(/([A-Z])/g, " $1")}
                        </span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Packing Plans by Status
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(dashboard.packingPlans).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {k.replace(/([A-Z])/g, " $1")}
                        </span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pallet Types */}
          {tab === "pallets" && (
            <ListPageTemplate
              columns={
                [
                  {
                    key: "code",
                    header: "Code",
                    render: (v) => <strong>{String(v)}</strong>,
                  },
                  { key: "name", header: "Name" },
                  {
                    key: "category",
                    header: "Category",
                    render: (v) => (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS["DRAFT"]}`}
                      >
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "lengthMm",
                    header: "Dimensions (mm)",
                    render: (v, row) =>
                      v && row.widthMm
                        ? `${v} × ${row.widthMm} × ${row.heightMm ?? "—"}`
                        : "—",
                  },
                  {
                    key: "maxWeightKg",
                    header: "Max Weight (kg)",
                    render: (v) => String(v ?? "—"),
                  },
                ] as ListColumn[]
              }
              data={palletTypes as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No pallet types defined"
              emptyDescription="No pallet types have been configured."
            />
          )}

          {/* Container Types */}
          {tab === "containers" && (
            <ListPageTemplate
              columns={
                [
                  {
                    key: "code",
                    header: "Code",
                    render: (v) => <strong>{String(v)}</strong>,
                  },
                  { key: "name", header: "Name" },
                  {
                    key: "category",
                    header: "Category",
                    render: (v) => (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "isoCode",
                    header: "ISO Code",
                    render: (v) => String(v ?? "—"),
                  },
                  {
                    key: "maxPayloadKg",
                    header: "Max Payload (kg)",
                    render: (v) => String(v ?? "—"),
                  },
                  {
                    key: "cubicMeters",
                    header: "Volume (m³)",
                    render: (v) => String(v ?? "—"),
                  },
                ] as ListColumn[]
              }
              data={containerTypes as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No container types defined"
              emptyDescription="No container types have been configured."
            />
          )}

          {/* Load Plans */}
          {tab === "load-plans" && (
            <div className="space-y-3">
              {loadPlans.map((lp) => (
                <div key={lp.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{lp.planNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[lp.status] ?? ""}`}
                        >
                          {lp.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Origin: {lp.originWarehouse} · {lp.pallets.length}{" "}
                        pallets · {lp.items.length} items ·{" "}
                        {Number(lp.totalWeightKg).toFixed(0)} kg
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {lp.status === "DRAFT" && (
                        <button
                          onClick={() =>
                            transition("load-plans", lp.id, "optimize")
                          }
                          className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Optimize
                        </button>
                      )}
                      {lp.status === "OPTIMIZING" && (
                        <button
                          onClick={() =>
                            transition("load-plans", lp.id, "ready")
                          }
                          className="px-3 py-1.5 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600"
                        >
                          Mark Ready
                        </button>
                      )}
                      {lp.status === "READY" && (
                        <button
                          onClick={() =>
                            transition("load-plans", lp.id, "startLoad")
                          }
                          className="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Start Loading
                        </button>
                      )}
                      {lp.status === "IN_LOADING" && (
                        <button
                          onClick={() =>
                            transition("load-plans", lp.id, "completeLoad")
                          }
                          className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                          Complete Load
                        </button>
                      )}
                      {lp.status === "LOADED" && (
                        <button
                          onClick={() =>
                            transition("load-plans", lp.id, "ship")
                          }
                          className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Ship
                        </button>
                      )}
                      {["DRAFT", "OPTIMIZING", "READY", "IN_LOADING"].includes(
                        lp.status,
                      ) && (
                        <button
                          onClick={() =>
                            transition("load-plans", lp.id, "cancel")
                          }
                          className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loadPlans.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">
                  No load plans found
                </div>
              )}
            </div>
          )}

          {/* Packing Plans */}
          {tab === "packing-plans" && (
            <div className="space-y-3">
              {packingPlans.map((pp) => (
                <div key={pp.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pp.planNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[pp.status] ?? ""}`}
                        >
                          {pp.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Warehouse: {pp.warehouseId} · {pp.totalCartons} cartons
                        · {Number(pp.totalWeightKg).toFixed(0)} kg
                      </div>
                      {pp.cartons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pp.cartons.slice(0, 8).map((c) => (
                            <span
                              key={c.id}
                              className={`text-xs px-1.5 py-0.5 rounded ${c.sealed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                            >
                              {c.cartonNumber}
                              {c.sealed ? " ✓" : ""}
                            </span>
                          ))}
                          {pp.cartons.length > 8 && (
                            <span className="text-xs text-gray-400">
                              +{pp.cartons.length - 8} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {pp.status === "DRAFT" && (
                        <button
                          onClick={() =>
                            transition("packing-plans", pp.id, "confirm")
                          }
                          className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Confirm
                        </button>
                      )}
                      {pp.status === "CONFIRMED" && (
                        <button
                          onClick={() =>
                            transition("packing-plans", pp.id, "startPack")
                          }
                          className="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Start Packing
                        </button>
                      )}
                      {pp.status === "PACKING" && (
                        <button
                          onClick={() =>
                            transition("packing-plans", pp.id, "complete")
                          }
                          className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Complete
                        </button>
                      )}
                      {["DRAFT", "CONFIRMED", "PACKING"].includes(
                        pp.status,
                      ) && (
                        <button
                          onClick={() =>
                            transition("packing-plans", pp.id, "cancel")
                          }
                          className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {packingPlans.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">
                  No packing plans found
                </div>
              )}
            </div>
          )}
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
