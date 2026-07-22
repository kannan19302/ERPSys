"use client";
import styles from "./page.module.css";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
type Tab =
  | "dashboard"
  | "policies"
  | "ledger"
  | "adjustments"
  | "revaluations"
  | "summary";

interface Dashboard {
  totalPolicies: number;
  activePolicies: number;
  totalAdjustments: number;
  pendingAdjustments: number;
  totalRevaluations: number;
  postedRevaluations: number;
  totalRevaluationImpact: number;
  totalAdjustmentImpact: number;
}

interface Policy {
  id: string;
  productId?: string;
  warehouseId?: string;
  method: string;
  standardCost?: string;
  currency: string;
  isActive: boolean;
  effectiveFrom: string;
}

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  productId: string;
  oldUnitCost: string;
  newUnitCost: string;
  qty: string;
  impactAmount: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface Revaluation {
  id: string;
  revaluationNumber: string;
  description?: string;
  status: string;
  totalImpact: string;
  revaluationDate: string;
  lines: {
    id: string;
    productId: string;
    currentUnitCost: string;
    newUnitCost: string;
    impactAmount: string;
  }[];
}

const METHODS = [
  "FIFO",
  "LIFO",
  "WEIGHTED_AVG",
  "STANDARD_COST",
  "ACTUAL_COST",
];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  POSTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  DRAFT: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function StockValuationPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [revaluations, setRevaluations] = useState<Revaluation[]>([]);
  const [ledger, setLedger] = useState<unknown[]>([]);
  const [summary, setSummary] = useState<{
    products: unknown[];
    totalValue: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forms
  const [policyForm, setPolicyForm] = useState({
    productId: "",
    warehouseId: "",
    method: "WEIGHTED_AVG",
    standardCost: "",
    currency: "USD",
    notes: "",
  });
  const [adjForm, setAdjForm] = useState({
    productId: "",
    warehouseId: "",
    oldUnitCost: "",
    newUnitCost: "",
    qty: "",
    reason: "",
  });
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [showAdjForm, setShowAdjForm] = useState(false);
  const apiFetch = useCallback(
    <T,>(path: string, opts?: RequestInit) =>
      client.request<T>(path, {
        method: opts?.method,
        body: opts?.body ? String(opts.body) : undefined,
      }),
    [client],
  );

  const loadDashboard = useCallback(async () => {
    try {
      setDashboard(
        await apiFetch<Dashboard>("/inventory/stock-valuation/dashboard"),
      );
    } catch {
      /* ignore */
    }
  }, []);
  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      setPolicies(
        await apiFetch<Policy[]>("/inventory/stock-valuation/policies"),
      );
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadAdjustments = useCallback(async () => {
    setLoading(true);
    try {
      setAdjustments(
        await apiFetch<Adjustment[]>("/inventory/stock-valuation/adjustments"),
      );
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadRevaluations = useCallback(async () => {
    setLoading(true);
    try {
      setRevaluations(
        await apiFetch<Revaluation[]>(
          "/inventory/stock-valuation/revaluations",
        ),
      );
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      setLedger(
        await apiFetch<unknown[]>("/inventory/stock-valuation/ledger?limit=50"),
      );
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(
        await apiFetch<{ products: unknown[]; totalValue: number }>(
          "/inventory/stock-valuation/valuation-summary",
        ),
      );
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    if (tab === "policies") loadPolicies();
    else if (tab === "adjustments") loadAdjustments();
    else if (tab === "revaluations") loadRevaluations();
    else if (tab === "ledger") loadLedger();
    else if (tab === "summary") loadSummary();
  }, [
    tab,
    loadPolicies,
    loadAdjustments,
    loadRevaluations,
    loadLedger,
    loadSummary,
  ]);

  const savePolicy = async () => {
    try {
      await apiFetch("/inventory/stock-valuation/policies", {
        method: "POST",
        body: JSON.stringify({
          ...policyForm,
          productId: policyForm.productId || undefined,
          warehouseId: policyForm.warehouseId || undefined,
          standardCost: policyForm.standardCost
            ? parseFloat(policyForm.standardCost)
            : undefined,
        }),
      });
      setShowPolicyForm(false);
      loadPolicies();
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const saveAdj = async () => {
    try {
      await apiFetch("/inventory/stock-valuation/adjustments", {
        method: "POST",
        body: JSON.stringify({
          ...adjForm,
          warehouseId: adjForm.warehouseId || undefined,
          oldUnitCost: parseFloat(adjForm.oldUnitCost),
          newUnitCost: parseFloat(adjForm.newUnitCost),
          qty: parseFloat(adjForm.qty),
        }),
      });
      setShowAdjForm(false);
      loadAdjustments();
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const adjAction = async (id: string, action: string) => {
    try {
      await apiFetch(`/inventory/stock-valuation/adjustments/${id}/${action}`, {
        method: "PATCH",
      });
      loadAdjustments();
      loadDashboard();
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const postRevaluation = async (id: string) => {
    try {
      await apiFetch(`/inventory/stock-valuation/revaluations/${id}/post`, {
        method: "PATCH",
      });
      loadRevaluations();
      loadDashboard();
    } catch (e: unknown) {
      setError(String(e));
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "policies", label: "Policies" },
    { id: "adjustments", label: "Cost Adjustments" },
    { id: "revaluations", label: "Revaluations" },
    { id: "ledger", label: "Valuation Ledger" },
    { id: "summary", label: "Summary" },
  ];

  return (
    <RouteGuard permission="inventory.stock-valuation.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Manage inventory operations for this workspace."
      >
        <div className="ui-page-shell">
          <h1 className="text-2xl font-semibold mb-4">Stock Valuation</h1>
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
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Active Policies",
                    value: `${dashboard.activePolicies}/${dashboard.totalPolicies}`,
                  },
                  {
                    label: "Pending Adjustments",
                    value: dashboard.pendingAdjustments,
                  },
                  {
                    label: "Total Revaluations",
                    value: dashboard.totalRevaluations,
                  },
                  {
                    label: "Revaluation Impact",
                    value: `$${dashboard.totalRevaluationImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                  },
                ].map((c) => (
                  <div key={c.label} className="bg-white border rounded-lg p-4">
                    <div className="text-2xl font-bold">{c.value}</div>
                    <div className="text-sm text-gray-500 mt-1">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Adjustments</h3>
                  <div className="text-sm text-gray-600">
                    Total: {dashboard.totalAdjustments} | Pending:{" "}
                    {dashboard.pendingAdjustments}
                  </div>
                  <div className="text-sm text-gray-600">
                    Posted Impact: $
                    {dashboard.totalAdjustmentImpact.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Revaluations</h3>
                  <div className="text-sm text-gray-600">
                    Total: {dashboard.totalRevaluations} | Posted:{" "}
                    {dashboard.postedRevaluations}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Impact: $
                    {dashboard.totalRevaluationImpact.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 },
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Policies */}
          {tab === "policies" && (
            <div>
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-medium">Valuation Policies</h2>
                <button
                  onClick={() => setShowPolicyForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                >
                  + New Policy
                </button>
              </div>
              {showPolicyForm && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-medium mb-3 text-sm">Set Policy</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      placeholder="Product ID (optional)"
                      value={policyForm.productId}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          productId: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Warehouse ID (optional)"
                      value={policyForm.warehouseId}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          warehouseId: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <select
                      value={policyForm.method}
                      onChange={(e) =>
                        setPolicyForm((f) => ({ ...f, method: e.target.value }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    >
                      {METHODS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      placeholder="Standard Cost (if STANDARD_COST)"
                      value={policyForm.standardCost}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          standardCost: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                      type="number"
                    />
                    <input
                      placeholder="Currency"
                      value={policyForm.currency}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          currency: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Notes"
                      value={policyForm.notes}
                      onChange={(e) =>
                        setPolicyForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={savePolicy}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowPolicyForm(false)}
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
                      key: "productId",
                      header: "Product",
                      render: (v) => String(v ?? "All"),
                    },
                    {
                      key: "warehouseId",
                      header: "Warehouse",
                      render: (v) => String(v ?? "All"),
                    },
                    {
                      key: "method",
                      header: "Method",
                      render: (v) => (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {String(v)}
                        </span>
                      ),
                    },
                    {
                      key: "standardCost",
                      header: "Standard Cost",
                      render: (v) => (v ? Number(v).toFixed(4) : "-"),
                    },
                    { key: "currency", header: "Currency" },
                    {
                      key: "isActive",
                      header: "Active",
                      render: (v) =>
                        v ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-500">✗</span>
                        ),
                    },
                    {
                      key: "effectiveFrom",
                      header: "Effective From",
                      render: (v) => new Date(String(v)).toLocaleDateString(),
                    },
                  ] as ListColumn[]
                }
                data={policies as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyTitle="No policies defined"
                emptyDescription="No costing policies have been configured."
              />
            </div>
          )}

          {/* Cost Adjustments */}
          {tab === "adjustments" && (
            <div>
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-medium">Cost Adjustments</h2>
                <button
                  onClick={() => setShowAdjForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                >
                  + New Adjustment
                </button>
              </div>
              {showAdjForm && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-medium mb-3 text-sm">
                    New Cost Adjustment
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      placeholder="Product ID*"
                      value={adjForm.productId}
                      onChange={(e) =>
                        setAdjForm((f) => ({ ...f, productId: e.target.value }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Warehouse ID (optional)"
                      value={adjForm.warehouseId}
                      onChange={(e) =>
                        setAdjForm((f) => ({
                          ...f,
                          warehouseId: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Old Unit Cost*"
                      value={adjForm.oldUnitCost}
                      onChange={(e) =>
                        setAdjForm((f) => ({
                          ...f,
                          oldUnitCost: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="New Unit Cost*"
                      value={adjForm.newUnitCost}
                      onChange={(e) =>
                        setAdjForm((f) => ({
                          ...f,
                          newUnitCost: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Qty*"
                      value={adjForm.qty}
                      onChange={(e) =>
                        setAdjForm((f) => ({ ...f, qty: e.target.value }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Reason*"
                      value={adjForm.reason}
                      onChange={(e) =>
                        setAdjForm((f) => ({ ...f, reason: e.target.value }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={saveAdj}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setShowAdjForm(false)}
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
                      key: "adjustmentNumber",
                      header: "Adj #",
                      render: (v) => (
                        <span className="font-mono">{String(v)}</span>
                      ),
                    },
                    { key: "productId", header: "Product" },
                    {
                      key: "oldUnitCost",
                      header: "Old Cost",
                      render: (v) => Number(v).toFixed(4),
                    },
                    {
                      key: "newUnitCost",
                      header: "New Cost",
                      render: (v) => Number(v).toFixed(4),
                    },
                    {
                      key: "qty",
                      header: "Qty",
                      render: (v) => Number(v).toFixed(2),
                    },
                    {
                      key: "impactAmount",
                      header: "Impact",
                      render: (v) => (
                        <span
                          className={
                            Number(v) >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {Number(v) >= 0 ? "+" : ""}
                          {Number(v).toFixed(2)}
                        </span>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (v) => (
                        <span
                          className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[String(v)] ?? ""}`}
                        >
                          {String(v)}
                        </span>
                      ),
                    },
                    {
                      key: "id",
                      header: "Actions",
                      render: (v, row) => (
                        <div className={styles.s1}>
                          {row.status === "PENDING" && (
                            <button
                              onClick={() => adjAction(String(v), "approve")}
                              className="text-blue-600 underline text-xs"
                            >
                              Approve
                            </button>
                          )}
                          {row.status === "APPROVED" && (
                            <button
                              onClick={() => adjAction(String(v), "post")}
                              className="text-green-600 underline text-xs"
                            >
                              Post
                            </button>
                          )}
                          {row.status === "PENDING" && (
                            <button
                              onClick={() => adjAction(String(v), "reject")}
                              className="text-red-600 underline text-xs"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      ),
                    },
                  ] as ListColumn[]
                }
                data={adjustments as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyTitle="No adjustments"
                emptyDescription="No cost adjustments found."
              />
            </div>
          )}

          {/* Revaluations */}
          {tab === "revaluations" && (
            <div>
              <h2 className="text-lg font-medium mb-4">Stock Revaluations</h2>
              {loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {revaluations.map((r) => (
                    <div key={r.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-medium">
                            {r.revaluationNumber}
                          </span>
                          {r.description && (
                            <span className="ml-2 text-gray-600">
                              {r.description}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[r.status] ?? ""}`}
                          >
                            {r.status}
                          </span>
                          {r.status === "DRAFT" && (
                            <button
                              onClick={() => postRevaluation(r.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                            >
                              Post
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Date: {new Date(r.revaluationDate).toLocaleDateString()}{" "}
                        | Total Impact: {Number(r.totalImpact) >= 0 ? "+" : ""}
                        {Number(r.totalImpact).toFixed(2)}
                      </div>
                      {r.lines.length > 0 && (
                        <ListPageTemplate
                          columns={
                            [
                              { key: "productId", header: "Product" },
                              {
                                key: "currentUnitCost",
                                header: "Current Cost",
                                render: (v) => Number(v).toFixed(4),
                              },
                              {
                                key: "newUnitCost",
                                header: "New Cost",
                                render: (v) => Number(v).toFixed(4),
                              },
                              {
                                key: "impactAmount",
                                header: "Impact",
                                render: (v) => (
                                  <span
                                    className={
                                      Number(v) >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    {Number(v) >= 0 ? "+" : ""}
                                    {Number(v).toFixed(2)}
                                  </span>
                                ),
                              },
                            ] as ListColumn[]
                          }
                          data={r.lines as unknown as Record<string, unknown>[]}
                          loading={false}
                          emptyTitle="No lines"
                          emptyDescription=""
                        />
                      )}
                    </div>
                  ))}
                  {revaluations.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      No revaluations
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ledger */}
          {tab === "ledger" && (
            <div>
              <h2 className="text-lg font-medium mb-4">
                Valuation Ledger (last 50)
              </h2>
              <ListPageTemplate
                columns={
                  [
                    { key: "productId", header: "Product" },
                    { key: "method", header: "Method" },
                    { key: "transactionType", header: "Txn Type" },
                    {
                      key: "transactionRef",
                      header: "Ref",
                      render: (v) => (
                        <span className="font-mono text-xs">
                          {String(v ?? "")}
                        </span>
                      ),
                    },
                    {
                      key: "qty",
                      header: "Qty",
                      render: (v) => Number(v).toFixed(2),
                    },
                    {
                      key: "unitCost",
                      header: "Unit Cost",
                      render: (v) => Number(v).toFixed(4),
                    },
                    {
                      key: "totalCost",
                      header: "Total Cost",
                      render: (v) => Number(v).toFixed(2),
                    },
                    {
                      key: "runningQty",
                      header: "Running Qty",
                      render: (v) => Number(v).toFixed(2),
                    },
                    {
                      key: "runningValue",
                      header: "Running Value",
                      render: (v) => Number(v).toFixed(2),
                    },
                    {
                      key: "runningAvgCost",
                      header: "Avg Cost",
                      render: (v) => Number(v ?? 0).toFixed(4),
                    },
                  ] as ListColumn[]
                }
                data={ledger as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyTitle="No ledger entries"
                emptyDescription="No valuation ledger entries found."
              />
            </div>
          )}

          {/* Summary */}
          {tab === "summary" && summary && (
            <div>
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-medium">
                  Inventory Valuation Summary
                </h2>
                <div className="text-lg font-bold">
                  Total: $
                  {summary.totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <ListPageTemplate
                columns={
                  [
                    { key: "productId", header: "Product" },
                    {
                      key: "method",
                      header: "Method",
                      render: (v) => (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {String(v ?? "")}
                        </span>
                      ),
                    },
                    {
                      key: "qty",
                      header: "Qty",
                      render: (v) => Number(v).toFixed(2),
                    },
                    {
                      key: "value",
                      header: "Value",
                      render: (v) =>
                        `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    },
                    {
                      key: "avgCost",
                      header: "Avg Cost",
                      render: (v) => Number(v).toFixed(4),
                    },
                  ] as ListColumn[]
                }
                data={summary.products as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No valuations"
                emptyDescription="No inventory valuations found."
              />
            </div>
          )}
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
