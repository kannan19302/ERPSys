"use client";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn, StatCardRow } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
const BASE = "/api/inventory/velocity-abc-xyz";
function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(
    <T,>(path: string, opts?: RequestInit) =>
      client.request<T>(path.replace("/api", ""), {
        method: opts?.method,
        body: opts?.body ? String(opts.body) : undefined,
      }),
    [client],
  );
}

const ABC_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-yellow-100 text-yellow-800",
  C: "bg-red-100 text-red-800",
};
const XYZ_COLORS: Record<string, string> = {
  X: "bg-blue-100 text-blue-800",
  Y: "bg-purple-100 text-purple-800",
  Z: "bg-orange-100 text-orange-800",
};

function Badge({
  label,
  colorMap,
}: {
  label: string;
  colorMap: Record<string, string>;
}) {
  const cls = colorMap[label] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────
function DashboardTab() {
  const apiFetch = useFrameworkFetch();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await apiFetch(`${BASE}/dashboard`));
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;
  if (!data)
    return (
      <p className="text-sm text-red-500 p-4">Failed to load dashboard.</p>
    );

  return (
    <div className="space-y-6">
      <StatCardRow
        stats={[
          { label: "Total Runs", value: data.totalRuns },
          {
            label: "Active Run Products",
            value: data.activeRun?.totalProducts ?? "—",
          },
          { label: "Velocity Snapshots", value: data.totalSnapshots },
          { label: "Active Slotting Policies", value: data.activePolicies },
        ]}
      />
      {data.activeRun && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            Active Run: {data.activeRun.runNumber}
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {["A", "B", "C"].map((c) => (
              <div key={c} className="rounded-lg border p-3 text-center">
                <Badge label={c} colorMap={ABC_COLORS} />
                <p className="text-xl font-bold mt-1">
                  {data.activeRun[`class${c}Count`]}
                </p>
              </div>
            ))}
            {["X", "Y", "Z"].map((c) => (
              <div key={c} className="rounded-lg border p-3 text-center">
                <Badge label={c} colorMap={XYZ_COLORS} />
                <p className="text-xl font-bold mt-1">
                  {data.activeRun[`class${c}Count`]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {Object.keys(data.classBreakdown ?? {}).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            Combined Class Breakdown
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.classBreakdown).map(([cls, cnt]) => (
              <div
                key={cls}
                className="rounded border px-3 py-1 flex items-center gap-2"
              >
                <span className="font-mono font-bold text-sm">{cls}</span>
                <span className="text-gray-600 text-sm">
                  {cnt as number} products
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Runs Tab ───────────────────────────────────────────────────────────────
function RunsTab() {
  const apiFetch = useFrameworkFetch();
  const [runs, setRuns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    periodStart: "",
    periodEnd: "",
    warehouseId: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<{ data: any[]; total: number }>(`${BASE}/runs`);
      setRuns(d.data);
      setTotal(d.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    const body: any = {
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
    };
    if (form.warehouseId) body.warehouseId = form.warehouseId;
    if (form.notes) body.notes = form.notes;
    await apiFetch(`${BASE}/runs`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setShowCreate(false);
    setForm({ periodStart: "", periodEnd: "", warehouseId: "", notes: "" });
    load();
  };

  const activate = async (id: string) => {
    await apiFetch(`${BASE}/runs/${id}/activate`, { method: "PATCH" });
    load();
  };
  const deleteRun = async (id: string) => {
    if (!confirm("Delete this run?")) return;
    await apiFetch(`${BASE}/runs/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{total} run(s)</p>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Run
        </button>
      </div>
      {showCreate && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Create Classification Run</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1">Period Start *</label>
              <input
                type="date"
                className="w-full border rounded p-2 text-sm"
                value={form.periodStart}
                onChange={(e) =>
                  setForm((f) => ({ ...f, periodStart: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Period End *</label>
              <input
                type="date"
                className="w-full border rounded p-2 text-sm"
                value={form.periodEnd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, periodEnd: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1">
              Warehouse ID (blank = all)
            </label>
            <input
              className="w-full border rounded p-2 text-sm"
              value={form.warehouseId}
              onChange={(e) =>
                setForm((f) => ({ ...f, warehouseId: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Notes</label>
            <input
              className="w-full border rounded p-2 text-sm"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {(() => {
        const runsColumns: ListColumn[] = [
          {
            key: "runNumber",
            header: "Run #",
            render: (v) => (
              <span className="font-mono text-xs">{String(v)}</span>
            ),
          },
          {
            key: "periodStart",
            header: "Period",
            render: (v, row) => (
              <span className="text-xs">
                {String(v).slice(0, 10)} – {String(row.periodEnd).slice(0, 10)}
              </span>
            ),
          },
          {
            key: "warehouseId",
            header: "Warehouse",
            render: (v) => (
              <span className="text-xs">{String(v ?? "All")}</span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (v) => {
              const s = String(v);
              return (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${s === "ACTIVE" ? "bg-green-100 text-green-800" : s === "DRAFT" ? "bg-gray-100 text-gray-700" : "bg-yellow-100 text-yellow-800"}`}
                >
                  {s}
                </span>
              );
            },
          },
          { key: "totalProducts", header: "Products" },
          {
            key: "classACount",
            header: "A/B/C",
            render: (v, row) => (
              <span className="text-xs">
                {String(v)}/{String(row.classBCount)}/{String(row.classCCount)}
              </span>
            ),
          },
          {
            key: "classXCount",
            header: "X/Y/Z",
            render: (v, row) => (
              <span className="text-xs">
                {String(v)}/{String(row.classYCount)}/{String(row.classZCount)}
              </span>
            ),
          },
          {
            key: "id",
            header: "Actions",
            render: (v, row) => (
              <div className="flex gap-1">
                {row.status === "DRAFT" && Number(row.totalProducts) > 0 && (
                  <button
                    onClick={() => activate(String(v))}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Activate
                  </button>
                )}
                {row.status !== "ACTIVE" && (
                  <button
                    onClick={() => deleteRun(String(v))}
                    className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            ),
          },
        ];
        return (
          <ListPageTemplate
            columns={runsColumns}
            data={runs as unknown as Record<string, unknown>[]}
            loading={loading}
            searchable
          />
        );
      })()}
    </div>
  );
}

// ── Classification Items Tab ───────────────────────────────────────────────
function ItemsTab() {
  const apiFetch = useFrameworkFetch();
  const [runId, setRunId] = useState("");
  const [filter, setFilter] = useState({ abcClass: "", xyzClass: "" });
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filter.abcClass) params.set("abcClass", filter.abcClass);
      if (filter.xyzClass) params.set("xyzClass", filter.xyzClass);
      const d = await apiFetch<{ data: any[]; total: number }>(
        `${BASE}/runs/${runId}/items?${params}`,
      );
      setItems(d.data);
      setTotal(d.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [runId, filter]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs mb-1">Run ID</label>
          <input
            className="w-full border rounded p-2 text-sm"
            placeholder="Paste run ID…"
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">ABC Class</label>
          <select
            className="w-full border rounded p-2 text-sm"
            value={filter.abcClass}
            onChange={(e) =>
              setFilter((f) => ({ ...f, abcClass: e.target.value }))
            }
          >
            <option value="">All</option>
            {["A", "B", "C"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">XYZ Class</label>
          <select
            className="w-full border rounded p-2 text-sm"
            value={filter.xyzClass}
            onChange={(e) =>
              setFilter((f) => ({ ...f, xyzClass: e.target.value }))
            }
          >
            <option value="">All</option>
            {["X", "Y", "Z"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!runId ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          Enter a Run ID to view items.
        </p>
      ) : (
        (() => {
          const itemsColumns: ListColumn[] = [
            {
              key: "productId",
              header: "Product",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            {
              key: "warehouseId",
              header: "Warehouse",
              render: (v) => (
                <span className="text-xs">{String(v ?? "All")}</span>
              ),
            },
            {
              key: "totalRevenue",
              header: "Revenue",
              render: (v) => (
                <span className="text-xs">{Number(v).toLocaleString()}</span>
              ),
            },
            {
              key: "totalQuantitySold",
              header: "Qty Sold",
              render: (v) => (
                <span className="text-xs">{Number(v).toLocaleString()}</span>
              ),
            },
            {
              key: "revenueShare",
              header: "Rev Share",
              render: (v) => (
                <span className="text-xs">{(Number(v) * 100).toFixed(2)}%</span>
              ),
            },
            {
              key: "cumulativeShare",
              header: "Cum Share",
              render: (v) => (
                <span className="text-xs">{(Number(v) * 100).toFixed(2)}%</span>
              ),
            },
            {
              key: "abcClass",
              header: "ABC",
              render: (v) => <Badge label={String(v)} colorMap={ABC_COLORS} />,
            },
            {
              key: "xyzClass",
              header: "XYZ",
              render: (v) => <Badge label={String(v)} colorMap={XYZ_COLORS} />,
            },
            {
              key: "combinedClass",
              header: "Class",
              render: (v) => (
                <span className="font-mono font-bold text-sm">{String(v)}</span>
              ),
            },
            {
              key: "demandCv",
              header: "CV",
              render: (v) => (
                <span className="text-xs">
                  {v != null ? Number(v).toFixed(3) : "—"}
                </span>
              ),
            },
          ];
          return (
            <>
              <p className="text-sm text-gray-500 mb-2">{total} item(s)</p>
              <ListPageTemplate
                columns={itemsColumns}
                data={items as unknown as Record<string, unknown>[]}
                loading={loading}
                searchable
              />
            </>
          );
        })()
      )}
    </div>
  );
}

// ── Policies Tab ───────────────────────────────────────────────────────────
function PoliciesTab() {
  const apiFetch = useFrameworkFetch();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    combinedClass: "AX",
    reviewFrequency: "DAILY",
    reorderMethod: "CONTINUOUS",
    safetyStockMultiplier: "1",
    preferredZone: "",
  });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPolicies(await apiFetch(`${BASE}/policies`));
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const body: any = {
      ...form,
      safetyStockMultiplier: parseFloat(form.safetyStockMultiplier),
    };
    await apiFetch(`${BASE}/policies`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setShowForm(false);
    load();
  };
  const deleteP = async (id: string) => {
    if (!confirm("Delete policy?")) return;
    await apiFetch(`${BASE}/policies/${id}`, { method: "DELETE" });
    load();
  };

  const classes = ["AX", "AY", "AZ", "BX", "BY", "BZ", "CX", "CY", "CZ"];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {policies.length} policy/policies
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Upsert Policy
        </button>
      </div>
      {showForm && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Slotting Policy</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1">Combined Class</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={form.combinedClass}
                onChange={(e) =>
                  setForm((f) => ({ ...f, combinedClass: e.target.value }))
                }
              >
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Review Frequency</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={form.reviewFrequency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reviewFrequency: e.target.value }))
                }
              >
                {["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY"].map(
                  (v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Reorder Method</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={form.reorderMethod}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reorderMethod: e.target.value }))
                }
              >
                {["CONTINUOUS", "PERIODIC", "MANUAL"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">
                Safety Stock Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full border rounded p-2 text-sm"
                value={form.safetyStockMultiplier}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    safetyStockMultiplier: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Preferred Zone</label>
              <input
                className="w-full border rounded p-2 text-sm"
                value={form.preferredZone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preferredZone: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <ListPageTemplate
        columns={
          [
            {
              key: "combinedClass",
              header: "Class",
              render: (v) => (
                <span className="font-mono font-bold">{String(v)}</span>
              ),
            },
            { key: "reviewFrequency", header: "Review Frequency" },
            { key: "reorderMethod", header: "Reorder Method" },
            {
              key: "safetyStockMultiplier",
              header: "Safety Stock ×",
              render: (v) => `${Number(v).toFixed(2)}×`,
            },
            {
              key: "preferredZone",
              header: "Zone",
              render: (v) => String(v ?? "—"),
            },
            {
              key: "active",
              header: "Active",
              render: (v) => (v ? "✅" : "❌"),
            },
            {
              key: "id",
              header: "Actions",
              render: (v) => (
                <button
                  onClick={() => deleteP(String(v))}
                  className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              ),
            },
          ] as ListColumn[]
        }
        data={policies as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No policies yet"
        emptyDescription="Use the Upsert Policy form above to add slotting policies."
      />
    </div>
  );
}

// ── Snapshots Tab ──────────────────────────────────────────────────────────
function SnapshotsTab() {
  const apiFetch = useFrameworkFetch();
  const [productId, setProductId] = useState("");
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    snapshotMonth: "",
    quantitySold: "",
    revenue: "",
    transactionCount: "",
    avgSellingPrice: "",
  });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      setSnapshots(await apiFetch(`${BASE}/products/${productId}/snapshots`));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const record = async () => {
    const body: any = {
      productId: form.productId,
      snapshotMonth: form.snapshotMonth,
      quantitySold: parseFloat(form.quantitySold),
      revenue: parseFloat(form.revenue),
      transactionCount: parseInt(form.transactionCount),
    };
    if (form.avgSellingPrice)
      body.avgSellingPrice = parseFloat(form.avgSellingPrice);
    await apiFetch(`${BASE}/snapshots`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setShowForm(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs mb-1">Product ID</label>
          <input
            className="w-full border rounded p-2 text-sm"
            placeholder="Enter product ID to view snapshots…"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
        </div>
        <button
          onClick={load}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Load
        </button>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-2 text-sm border rounded"
        >
          + Record Snapshot
        </button>
      </div>
      {showForm && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Record Monthly Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1">Product ID *</label>
              <input
                className="w-full border rounded p-2 text-sm"
                value={form.productId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, productId: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Month (YYYY-MM-01) *</label>
              <input
                type="date"
                className="w-full border rounded p-2 text-sm"
                value={form.snapshotMonth}
                onChange={(e) =>
                  setForm((f) => ({ ...f, snapshotMonth: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Qty Sold *</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={form.quantitySold}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantitySold: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Revenue *</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={form.revenue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, revenue: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Transaction Count *</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={form.transactionCount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, transactionCount: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Avg Selling Price</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={form.avgSellingPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avgSellingPrice: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={record}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Record
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : snapshots.length === 0 && productId ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          No snapshots found.
        </p>
      ) : snapshots.length > 0 ? (
        <ListPageTemplate
          columns={
            [
              {
                key: "snapshotMonth",
                header: "Month",
                render: (v) => (
                  <span className="font-mono text-xs">
                    {String(v).slice(0, 7)}
                  </span>
                ),
              },
              {
                key: "quantitySold",
                header: "Qty Sold",
                render: (v) => Number(v).toLocaleString(),
              },
              {
                key: "revenue",
                header: "Revenue",
                render: (v) => Number(v).toLocaleString(),
              },
              { key: "transactionCount", header: "Transactions" },
              {
                key: "avgSellingPrice",
                header: "Avg Price",
                render: (v) => (v != null ? Number(v).toFixed(2) : "—"),
              },
              {
                key: "abcClass",
                header: "ABC",
                render: (v) =>
                  v ? <Badge label={String(v)} colorMap={ABC_COLORS} /> : "—",
              },
              {
                key: "xyzClass",
                header: "XYZ",
                render: (v) =>
                  v ? <Badge label={String(v)} colorMap={XYZ_COLORS} /> : "—",
              },
            ] as ListColumn[]
          }
          data={snapshots as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No snapshots"
          emptyDescription="No velocity snapshots found for this product."
        />
      ) : null}
    </div>
  );
}

// ── Root Page ──────────────────────────────────────────────────────────────
const TABS = ["Dashboard", "Runs", "Classifications", "Policies", "Snapshots"];

export default function VelocityAbcXyzPage() {
  const [tab, setTab] = useState("Dashboard");
  return (
    <RouteGuard permission="inventory.velocity-abc-xyz.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Manage inventory operations for this workspace."
      >
        <div className="ui-page-shell">
          <div>
            <h1 className="text-2xl font-bold">
              Inventory Velocity & ABC-XYZ Analysis
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Classify products by value (ABC) and demand variability (XYZ) to
              optimize stocking and replenishment policies.
            </p>
          </div>
          <div className="border-b flex gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div>
            {tab === "Dashboard" && <DashboardTab />}
            {tab === "Runs" && <RunsTab />}
            {tab === "Classifications" && <ItemsTab />}
            {tab === "Policies" && <PoliciesTab />}
            {tab === "Snapshots" && <SnapshotsTab />}
          </div>
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
