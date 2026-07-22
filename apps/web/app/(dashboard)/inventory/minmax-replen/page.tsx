"use client";
import styles from "./page.module.css";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn, StatCardRow } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
const BASE = "/api/inventory/minmax-replen";
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

const SUGG_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  ORDERED: "bg-yellow-100 text-yellow-800",
  RECEIVED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-800",
};

function Badge({
  label,
  colorMap,
}: {
  label: string;
  colorMap: Record<string, string>;
}) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold ${colorMap[label] ?? "bg-gray-100 text-gray-700"}`}
    >
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
  useEffect(() => {
    apiFetch<Record<string, any>>(`${BASE}/dashboard`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-sm text-gray-500 p-4">Loading…</p>;
  if (!data) return <p className="text-sm text-red-500 p-4">Failed to load.</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Levels"
          value={`${data.activeLevels} / ${data.totalLevels}`}
        />
        <StatCard label="Open Suggestions" value={data.openSugg} />
        <StatCard label="Approved (pending order)" value={data.approvedSugg} />
        <StatCard label="Ordered (in transit)" value={data.orderedSugg} />
        <StatCard label="Total Runs" value={data.totalRuns} />
      </div>
      {data.lastRun && (
        <div className="border rounded p-4">
          <p className="text-xs text-gray-500">Last Run</p>
          <p className="font-mono font-semibold">{data.lastRun.runNumber}</p>
          <p className="text-sm text-gray-600">
            Scanned {data.lastRun.levelsScanned} levels · Created{" "}
            {data.lastRun.suggestionsCreated} suggestions
          </p>
        </div>
      )}
    </div>
  );
}

// ── Levels Tab ─────────────────────────────────────────────────────────────
function LevelsTab() {
  const apiFetch = useFrameworkFetch();
  const [levels, setLevels] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    warehouseId: "",
    minQty: "",
    maxQty: "",
    reorderQty: "",
    method: "PURCHASE_ORDER",
    leadTimeDays: "0",
    preferredVendorId: "",
    notes: "",
  });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<{ data: any[]; total: number }>(
        `${BASE}/levels`,
      );
      setLevels(d.data);
      setTotal(d.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setErr("");
    try {
      const body: any = {
        productId: form.productId,
        warehouseId: form.warehouseId,
        minQty: parseFloat(form.minQty),
        maxQty: parseFloat(form.maxQty),
        method: form.method,
        leadTimeDays: parseInt(form.leadTimeDays),
      };
      if (form.reorderQty) body.reorderQty = parseFloat(form.reorderQty);
      if (form.preferredVendorId)
        body.preferredVendorId = form.preferredVendorId;
      if (form.notes) body.notes = form.notes;
      await apiFetch(`${BASE}/levels`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setShowForm(false);
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this level?")) return;
    await apiFetch(`${BASE}/levels/${id}/deactivate`, { method: "PATCH" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{total} level(s)</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Set Level
        </button>
      </div>
      {showForm && (
        <div className="border rounded p-4 space-y-3">
          <h3 className="font-semibold text-sm">Set Min-Max Level</h3>
          {err && <p className="text-sm text-red-600">{err}</p>}
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
              <label className="block text-xs mb-1">Warehouse ID *</label>
              <input
                className="w-full border rounded p-2 text-sm"
                value={form.warehouseId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, warehouseId: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Min Qty *</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={form.minQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minQty: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Max Qty *</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={form.maxQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxQty: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">
                Reorder Qty (override)
              </label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={form.reorderQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reorderQty: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Method</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={form.method}
                onChange={(e) =>
                  setForm((f) => ({ ...f, method: e.target.value }))
                }
              >
                {["PURCHASE_ORDER", "TRANSFER", "PRODUCTION"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Lead Time (days)</label>
              <input
                type="number"
                className="w-full border rounded p-2 text-sm"
                value={form.leadTimeDays}
                onChange={(e) =>
                  setForm((f) => ({ ...f, leadTimeDays: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Preferred Vendor ID</label>
              <input
                className="w-full border rounded p-2 text-sm"
                value={form.preferredVendorId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preferredVendorId: e.target.value }))
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
              key: "productId",
              header: "Product",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            { key: "warehouseId", header: "Warehouse" },
            {
              key: "minQty",
              header: "Min",
              render: (v) => Number(v).toFixed(2),
            },
            {
              key: "maxQty",
              header: "Max",
              render: (v) => Number(v).toFixed(2),
            },
            {
              key: "reorderQty",
              header: "Reorder Qty",
              render: (v) => (v != null ? Number(v).toFixed(2) : "—"),
            },
            { key: "method", header: "Method" },
            { key: "leadTimeDays", header: "Lead Days" },
            {
              key: "active",
              header: "Active",
              render: (v) => (v ? "✅" : "❌"),
            },
            {
              key: "id",
              header: "Actions",
              render: (v, row) =>
                row.active ? (
                  <button
                    onClick={() => deactivate(String(v))}
                    className={styles.s1}
                  >
                    Deactivate
                  </button>
                ) : null,
            },
          ] as ListColumn[]
        }
        data={levels as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No levels configured"
        emptyDescription="Use the Set Level form above to configure min-max levels."
      />
    </div>
  );
}

// ── Run Tab ────────────────────────────────────────────────────────────────
function RunTab() {
  const apiFetch = useFrameworkFetch();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockInput, setStockInput] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");
  const [lastResult, setLastResult] = useState<any>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<{ data: any[] }>(`${BASE}/run-logs`);
      setLogs(d.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const triggerRun = async () => {
    setErr("");
    setRunning(true);
    try {
      // Parse stock snapshot from textarea: "productId:warehouseId=qty" per line
      const stockSnapshot: Record<string, number> = {};
      stockInput.split("\n").forEach((line) => {
        const [key, val] = line.trim().split("=");
        if (key && val) stockSnapshot[key.trim()] = parseFloat(val.trim());
      });
      const body: any = { stockSnapshot };
      if (warehouseId) body.warehouseId = warehouseId;
      const result = await apiFetch(`${BASE}/run`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setLastResult(result);
      loadLogs();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded p-4 space-y-3">
        <h3 className="font-semibold text-sm">Trigger Replenishment Run</h3>
        <p className="text-xs text-gray-500">
          Enter current stock snapshot. Format one entry per line:{" "}
          <code>productId:warehouseId=quantity</code>
        </p>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div>
          <label className="block text-xs mb-1">
            Warehouse Filter (blank = all)
          </label>
          <input
            className="w-full border rounded p-2 text-sm"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Stock Snapshot *</label>
          <textarea
            rows={5}
            className="w-full border rounded p-2 text-sm font-mono"
            placeholder="p1:w1=15&#10;p2:w1=80&#10;p3:w2=5"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
          />
        </div>
        <button
          onClick={triggerRun}
          disabled={running}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? "Running…" : "▶ Run Replenishment Check"}
        </button>
        {lastResult && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
            <p className="font-semibold text-green-800">
              Run complete: {lastResult.runNumber}
            </p>
            <p className="text-green-700">
              Scanned {lastResult.levelsScanned} levels · Created{" "}
              {lastResult.suggestionsCreated} suggestion(s)
            </p>
          </div>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">Run History</h3>
        <ListPageTemplate
          columns={
            [
              {
                key: "runNumber",
                header: "Run #",
                render: (v) => (
                  <span className="font-mono text-xs">{String(v)}</span>
                ),
              },
              {
                key: "warehouseId",
                header: "Warehouse",
                render: (v) => String(v ?? "All"),
              },
              { key: "levelsScanned", header: "Levels Scanned" },
              { key: "suggestionsCreated", header: "Suggestions" },
              {
                key: "completedAt",
                header: "Completed At",
                render: (v) => (v ? new Date(String(v)).toLocaleString() : "—"),
              },
            ] as ListColumn[]
          }
          data={logs as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyTitle="No runs yet"
          emptyDescription="Trigger a replenishment run using the form above."
        />
      </div>
    </div>
  );
}

// ── Suggestions Tab ────────────────────────────────────────────────────────
function SuggestionsTab() {
  const apiFetch = useFrameworkFetch();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("OPEN");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filterStatus) params.set("status", filterStatus);
      const d = await apiFetch<{ data: any[]; total: number }>(
        `${BASE}/suggestions?${params}`,
      );
      setSuggestions(d.data);
      setTotal(d.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);
  useEffect(() => {
    load();
  }, [load]);

  const action = async (id: string, endpoint: string, body?: any) => {
    await apiFetch(`${BASE}/suggestions/${id}/${endpoint}`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">{total} suggestion(s)</p>
        <select
          className="border rounded p-1 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All</option>
          {["OPEN", "APPROVED", "ORDERED", "RECEIVED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <ListPageTemplate
        columns={
          [
            {
              key: "suggestionNumber",
              header: "Suggestion #",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            {
              key: "productId",
              header: "Product",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            { key: "warehouseId", header: "Warehouse" },
            {
              key: "currentStock",
              header: "Current Stock",
              render: (v) => Number(v).toFixed(2),
            },
            {
              key: "suggestedQty",
              header: "Suggested Qty",
              render: (v) => <strong>{Number(v).toFixed(2)}</strong>,
            },
            { key: "method", header: "Method" },
            {
              key: "neededByDate",
              header: "Needed By",
              render: (v) =>
                v ? new Date(String(v)).toLocaleDateString() : "—",
            },
            {
              key: "status",
              header: "Status",
              render: (v) => <Badge label={String(v)} colorMap={SUGG_COLORS} />,
            },
            {
              key: "id",
              header: "Actions",
              render: (v, row) => {
                const id = String(v);
                const status = String(row.status);
                return (
                  <div className={styles.s2}>
                    {status === "OPEN" && (
                      <button
                        onClick={() => action(id, "approve")}
                        className={styles.s3}
                      >
                        Approve
                      </button>
                    )}
                    {status === "APPROVED" && (
                      <button
                        onClick={() => action(id, "order")}
                        className={styles.s4}
                      >
                        Mark Ordered
                      </button>
                    )}
                    {status === "ORDERED" && (
                      <button
                        onClick={() => action(id, "receive")}
                        className={styles.s5}
                      >
                        Mark Received
                      </button>
                    )}
                    {!["RECEIVED", "CANCELLED"].includes(status) && (
                      <button
                        onClick={() =>
                          action(id, "cancel", { reason: "Manual cancel" })
                        }
                        className={styles.s6}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                );
              },
            },
          ] as ListColumn[]
        }
        data={suggestions as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No suggestions"
        emptyDescription="Run a replenishment check to generate suggestions."
      />
    </div>
  );
}

// ── Root Page ──────────────────────────────────────────────────────────────
const TABS = [
  "Dashboard",
  "Min-Max Levels",
  "Run Replenishment",
  "Suggestions",
];

export default function MinMaxReplenPage() {
  const [tab, setTab] = useState("Dashboard");
  return (
    <RouteGuard permission="inventory.minmax-replen.read">
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
              Min-Max Replenishment Planning
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure min/max stock thresholds per product-warehouse pair,
              trigger automated replenishment scans, and manage order
              suggestions through their lifecycle.
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
            {tab === "Min-Max Levels" && <LevelsTab />}
            {tab === "Run Replenishment" && <RunTab />}
            {tab === "Suggestions" && <SuggestionsTab />}
          </div>
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
