"use client";
import styles from "./page.module.css";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn, StatCardRow } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";

type Tab = "dashboard" | "stock-takes" | "variances" | "accuracy";

interface Dashboard {
  total: number;
  byStatus: Record<string, number>;
  variances: { pending: number; approved: number };
}

interface StockTake {
  id: string;
  stockTakeNumber: string;
  warehouseId: string;
  status: string;
  countType: string;
  countDate: string;
  createdAt: string;
  _count?: { sheets: number; variances: number };
}

interface StockTakeVariance {
  id: string;
  productId: string;
  warehouseId: string;
  systemQty: string;
  countedQty: string;
  varianceQty: string;
  variancePct: string;
  varianceValue?: string;
  status: string;
}

interface AccuracyRow {
  stockTakeNumber: string;
  warehouseId: string;
  postedAt?: string;
  totalLines: number;
  varianceLines: number;
  accuracyRate: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COUNTING: "bg-yellow-100 text-yellow-700",
  VARIANCE_REVIEW: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  POSTED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function StockTakesPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [stockTakes, setStockTakes] = useState<StockTake[]>([]);
  const [accuracy, setAccuracy] = useState<AccuracyRow[]>([]);
  const [selectedSt, setSelectedSt] = useState<string | null>(null);
  const [variances, setVariances] = useState<StockTakeVariance[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    warehouseId: "",
    countDate: "",
    countType: "FULL",
    notes: "",
  });

  const loadDashboard = useCallback(async () => {
    try {
      setDashboard(
        await client.get<Dashboard>("/inventory/stock-takes/dashboard"),
      );
    } catch {
      /* ignore */
    }
  }, [client]);

  const loadStockTakes = useCallback(async () => {
    setLoading(true);
    try {
      setStockTakes(await client.get<StockTake[]>("/inventory/stock-takes"));
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const loadAccuracy = useCallback(async () => {
    setLoading(true);
    try {
      setAccuracy(
        await client.get<AccuracyRow[]>(
          "/inventory/stock-takes/accuracy-report",
        ),
      );
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [client]);

  const loadVariances = useCallback(
    async (id: string) => {
      try {
        const result = await client.get<StockTakeVariance[]>(
          `/inventory/stock-takes/${id}/variances`,
        );
        setVariances(result);
        setSelectedSt(id);
      } catch (e: unknown) {
        setError(String(e));
      }
    },
    [client],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    if (tab === "stock-takes") loadStockTakes();
    else if (tab === "accuracy") loadAccuracy();
  }, [tab, loadStockTakes, loadAccuracy]);

  const createStockTake = async () => {
    try {
      await client.post("/inventory/stock-takes", form);
      setShowForm(false);
      loadStockTakes();
      loadDashboard();
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const action = async (id: string, act: string, body?: unknown) => {
    try {
      await client.patch(`/inventory/stock-takes/${id}/${act}`, body);
      loadStockTakes();
      loadDashboard();
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const varianceAction = async (
    varianceId: string,
    act: string,
    body?: unknown,
  ) => {
    try {
      await client.patch(
        `/inventory/stock-takes/variances/${varianceId}/${act}`,
        body,
      );
      if (selectedSt) loadVariances(selectedSt);
      loadDashboard();
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "stock-takes", label: "Stock Takes" },
    { id: "variances", label: "Variance Review" },
    { id: "accuracy", label: "Accuracy Report" },
  ];

  return (
    <InventoryTabLayout
      tabs={INVENTORY_TABS}
      moduleId="inventory"
      moduleLabel="Inventory & Stock"
      moduleIcon={InventoryModuleIcon}
      moduleDescription="Full physical inventory stock takes, variance review, and accuracy reporting."
    >
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">
          Physical Inventory / Stock Takes
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
            <button className="ml-2 underline" onClick={() => setError("")}>
              dismiss
            </button>
          </div>
        )}

        <div className="flex gap-2 border-b mb-6 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === "dashboard" && dashboard && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Stock Takes", value: dashboard.total },
                {
                  label: "In Progress",
                  value:
                    (dashboard.byStatus.inProgress ?? 0) +
                    (dashboard.byStatus.counting ?? 0),
                },
                {
                  label: "Pending Variances",
                  value: dashboard.variances.pending,
                },
                { label: "Posted", value: dashboard.byStatus.posted ?? 0 },
              ].map((c) => (
                <div key={c.label} className="bg-white border rounded-lg p-4">
                  <div className="text-2xl font-bold">{c.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3">By Status</h3>
              <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                {Object.entries(dashboard.byStatus).map(([key, val]) => (
                  <div
                    key={key}
                    className={`rounded-lg p-2 text-center ${
                      STATUS_COLORS[
                        key.charAt(0).toUpperCase() +
                          key
                            .slice(1)
                            .replace(/([A-Z])/g, "_$1")
                            .toUpperCase()
                      ] ?? "bg-gray-50"
                    }`}
                  >
                    <div className="text-lg font-semibold">{val}</div>
                    <div className="text-xs mt-0.5 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stock Takes List */}
        {tab === "stock-takes" && (
          <div>
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-medium">Stock Takes</h2>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
              >
                + New Stock Take
              </button>
            </div>

            {showForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium mb-3">Create Stock Take</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <input
                    placeholder="Warehouse ID*"
                    value={form.warehouseId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, warehouseId: e.target.value }))
                    }
                    className="border rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={form.countDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, countDate: e.target.value }))
                    }
                    className="border rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={form.countType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, countType: e.target.value }))
                    }
                    className="border rounded px-3 py-2 text-sm"
                  >
                    {["FULL", "ZONE", "CATEGORY"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className="border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={createStockTake}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border rounded text-sm"
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
                    key: "stockTakeNumber",
                    header: "Stock Take #",
                    render: (v) => (
                      <span className="font-mono">{String(v)}</span>
                    ),
                  },
                  {
                    key: "warehouseId",
                    header: "Warehouse",
                    render: (v) => String(v).slice(0, 8),
                  },
                  { key: "countType", header: "Type" },
                  {
                    key: "countDate",
                    header: "Count Date",
                    render: (v) => new Date(String(v)).toLocaleDateString(),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (v) => (
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[String(v)] ?? ""}`}
                      >
                        {String(v)}
                      </span>
                    ),
                  },
                  {
                    key: "_count",
                    header: "Sheets",
                    render: (v) => String((v as any)?.sheets ?? 0),
                  },
                  {
                    key: "id",
                    header: "Variances",
                    render: (v, row) => (
                      <button
                        onClick={() => {
                          setTab("variances");
                          loadVariances(String(v));
                        }}
                        className="text-blue-600 underline text-xs"
                      >
                        {(row._count as any)?.variances ?? 0}
                      </button>
                    ),
                  },
                  {
                    key: "id",
                    header: "Actions",
                    render: (v, row) => (
                      <div className={styles.s1}>
                        {row.status === "DRAFT" && (
                          <button
                            onClick={() => action(String(v), "start")}
                            className="text-blue-600 underline text-xs"
                          >
                            Start
                          </button>
                        )}
                        {["COUNTING", "IN_PROGRESS"].includes(
                          String(row.status),
                        ) && (
                          <button
                            onClick={() =>
                              action(String(v), "generate-variances")
                            }
                            className="text-orange-600 underline text-xs"
                          >
                            Gen Variances
                          </button>
                        )}
                        {row.status === "VARIANCE_REVIEW" && (
                          <button
                            onClick={() => action(String(v), "approve")}
                            className="text-green-600 underline text-xs"
                          >
                            Approve
                          </button>
                        )}
                        {row.status === "APPROVED" && (
                          <button
                            onClick={() => action(String(v), "post")}
                            className="text-emerald-600 underline text-xs"
                          >
                            Post
                          </button>
                        )}
                        {!["POSTED", "CANCELLED"].includes(
                          String(row.status),
                        ) && (
                          <button
                            onClick={() => action(String(v), "cancel")}
                            className="text-red-600 underline text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ),
                  },
                ] as ListColumn[]
              }
              data={stockTakes as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No stock takes"
              emptyDescription="Create a stock take to get started."
            />
          </div>
        )}

        {/* Variance Review */}
        {tab === "variances" && (
          <div>
            <h2 className="text-lg font-medium mb-4">
              Variance Review{selectedSt ? ` — ${selectedSt.slice(0, 8)}` : ""}
            </h2>
            {!selectedSt ? (
              <div className="text-center text-gray-400 py-8 border rounded-lg">
                Select a stock take from the Stock Takes tab to review its
                variances.
              </div>
            ) : (
              <ListPageTemplate
                columns={
                  [
                    {
                      key: "productId",
                      header: "Product",
                      render: (v) => (
                        <span className="font-mono text-xs">
                          {String(v).slice(0, 10)}
                        </span>
                      ),
                    },
                    { key: "systemQty", header: "System Qty" },
                    { key: "countedQty", header: "Counted Qty" },
                    {
                      key: "varianceQty",
                      header: "Variance",
                      render: (v) => (
                        <span
                          className={
                            Number(v) < 0
                              ? "text-red-600 font-medium"
                              : "text-green-600 font-medium"
                          }
                        >
                          {Number(v) > 0 ? "+" : ""}
                          {String(v)}
                        </span>
                      ),
                    },
                    {
                      key: "variancePct",
                      header: "Variance %",
                      render: (v) => `${Number(v).toFixed(1)}%`,
                    },
                    {
                      key: "varianceValue",
                      header: "Value",
                      render: (v) => (v ? `$${Number(v).toFixed(2)}` : "-"),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (v) => (
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[String(v)] ?? ""}`}
                        >
                          {String(v)}
                        </span>
                      ),
                    },
                    {
                      key: "id",
                      header: "Actions",
                      render: (v, row) =>
                        row.status === "PENDING" ? (
                          <div className={styles.s2}>
                            <button
                              onClick={() =>
                                varianceAction(String(v), "approve")
                              }
                              className="text-green-600 underline text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                varianceAction(String(v), "reject", {
                                  rejectionReason: "Rejected",
                                })
                              }
                              className="text-red-600 underline text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : null,
                    },
                  ] as ListColumn[]
                }
                data={variances as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyTitle="No variances found"
                emptyDescription="No variances for this stock take."
              />
            )}
          </div>
        )}

        {/* Accuracy Report */}
        {tab === "accuracy" && (
          <div>
            <h2 className="text-lg font-medium mb-4">
              Inventory Accuracy Report (Last 10 Posted)
            </h2>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "stockTakeNumber",
                    header: "Stock Take #",
                    render: (v) => (
                      <span className="font-mono">{String(v)}</span>
                    ),
                  },
                  {
                    key: "warehouseId",
                    header: "Warehouse",
                    render: (v) => String(v).slice(0, 8),
                  },
                  {
                    key: "postedAt",
                    header: "Posted At",
                    render: (v) =>
                      v ? new Date(String(v)).toLocaleDateString() : "-",
                  },
                  { key: "totalLines", header: "Total Lines" },
                  {
                    key: "varianceLines",
                    header: "Variance Lines",
                    render: (v) => (
                      <span className="text-red-600">{String(v)}</span>
                    ),
                  },
                  {
                    key: "accuracyRate",
                    header: "Accuracy Rate",
                    render: (v) => (
                      <div className={styles.s3}>
                        <div className={styles.s4}>
                          <div
                            style={{ width: `${v}%` }}
                            className={styles.s5}
                          />
                        </div>
                        <span
                          className={
                            Number(v) >= 95
                              ? "text-green-600 font-medium"
                              : "text-orange-600 font-medium"
                          }
                        >
                          {String(v)}%
                        </span>
                      </div>
                    ),
                  },
                ] as ListColumn[]
              }
              data={accuracy as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No posted stock takes yet"
              emptyDescription="Post a stock take to see accuracy reports."
            />
          </div>
        )}
      </div>
    </InventoryTabLayout>
  );
}
