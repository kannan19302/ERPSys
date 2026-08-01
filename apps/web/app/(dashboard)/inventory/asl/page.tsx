"use client";
import styles from "./page.module.css";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { Package as InventoryModuleIcon } from "lucide-react";
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

const ASL_STATUSES = [
  "APPROVED",
  "CONDITIONAL",
  "DISQUALIFIED",
  "PENDING_APPROVAL",
];

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-800",
    CONDITIONAL: "bg-yellow-100 text-yellow-800",
    DISQUALIFIED: "bg-red-100 text-red-800",
    PENDING_APPROVAL: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard() {
  const apiFetch = useFrameworkFetch();
  const [data, setData] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Record<string, number>>("/inventory/asl/dashboard")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!data) return <p className="text-sm text-red-500">Failed to load.</p>;

  const cards = [
    { label: "Total Vendors", value: data.total },
    { label: "Approved", value: data.approved },
    { label: "Preferred", value: data.preferred },
    { label: "Conditional", value: data.conditional },
    { label: "Pending", value: data.pending },
    { label: "Disqualified", value: data.disqualified },
    { label: "Expiring (30d)", value: data.expiring, warn: true },
    { label: "Expired", value: data.expired, danger: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
          <p
            className={`text-2xl font-bold mt-1 ${(c as Record<string, unknown>).danger && (c.value ?? 0) > 0 ? "text-red-600" : (c as Record<string, unknown>).warn && (c.value ?? 0) > 0 ? "text-orange-500" : ""}`}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Approved Suppliers List ────────────────────────────────────────────────
function ApprovedSuppliers() {
  const apiFetch = useFrameworkFetch();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(() => {
    const qs = filterStatus ? `?status=${filterStatus}` : "";
    apiFetch<Record<string, unknown>[]>(`/inventory/asl${qs}`)
      .then(setItems)
      .catch(console.error);
  }, [filterStatus]);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await apiFetch("/inventory/asl", {
        method: "POST",
        body: JSON.stringify({
          productId: form.productId,
          vendorId: form.vendorId,
          vendorProductRef: form.vendorProductRef || undefined,
          vendorProductName: form.vendorProductName || undefined,
          unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
          currency: form.currency || "USD",
          moq: form.moq ? Number(form.moq) : undefined,
          leadTimeDays: form.leadTimeDays
            ? Number(form.leadTimeDays)
            : undefined,
          expiryDate: form.expiryDate || undefined,
        }),
      });
      setMsg("Added to ASL");
      setShowForm(false);
      setForm({});
      load();
    } catch (e: unknown) {
      setMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function transition(
    id: string,
    action: string,
    body: Record<string, unknown> = {},
  ) {
    try {
      await apiFetch(`/inventory/asl/${id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      load();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold flex-1">Approved Supplier List</h2>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">All Statuses</option>
          {ASL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setMsg("");
          }}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
        >
          + Add to ASL
        </button>
      </div>

      {msg && <p className="text-sm text-blue-600 dark:text-blue-400">{msg}</p>}

      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Add Vendor to ASL</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "productId", label: "Product ID" },
              { key: "vendorId", label: "Vendor ID" },
              { key: "vendorProductRef", label: "Vendor's Product Ref" },
              { key: "vendorProductName", label: "Vendor's Product Name" },
              { key: "unitPrice", label: "Unit Price" },
              { key: "currency", label: "Currency" },
              { key: "moq", label: "Min Order Qty" },
              { key: "leadTimeDays", label: "Lead Time (days)" },
              { key: "expiryDate", label: "Approval Expiry", type: "date" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {label}
                </label>
                <input
                  type={type ?? "text"}
                  value={form[key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 border text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
            {
              key: "vendorId",
              header: "Vendor",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            {
              key: "vendorProductRef",
              header: "Vendor's SKU",
              render: (v) => String(v ?? "—"),
            },
            {
              key: "unitPrice",
              header: "Unit Price",
              render: (v, row) =>
                v ? `${row.currency} ${Number(v).toFixed(4)}` : "—",
            },
            { key: "moq", header: "MOQ", render: (v) => (v ? String(v) : "—") },
            {
              key: "leadTimeDays",
              header: "Lead Time",
              render: (v) => (v ? `${v}d` : "—"),
            },
            {
              key: "isPreferred",
              header: "Preferred",
              render: (v) => (v ? "★" : ""),
            },
            {
              key: "status",
              header: "Status",
              render: (v) => statusBadge(String(v)),
            },
            {
              key: "expiryDate",
              header: "Expires",
              render: (v) =>
                v ? new Date(String(v)).toLocaleDateString() : "—",
            },
            {
              key: "id",
              header: "Actions",
              render: (v, row) => (
                <div className={styles.s1}>
                  {row.status === "PENDING_APPROVAL" && (
                    <button
                      onClick={() => transition(String(v), "approve", {})}
                      className="px-2 py-0.5 text-xs bg-green-600 text-white rounded"
                    >
                      Approve
                    </button>
                  )}
                  {row.status === "APPROVED" && !row.isPreferred && (
                    <button
                      onClick={() =>
                        transition(String(v), "set-preferred", { rank: 1 })
                      }
                      className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded"
                    >
                      Set Preferred
                    </button>
                  )}
                  {row.status !== "DISQUALIFIED" && (
                    <button
                      onClick={() => {
                        const r = prompt("Disqualify reason?");
                        if (r)
                          transition(String(v), "disqualify", { reason: r });
                      }}
                      className="px-2 py-0.5 text-xs bg-red-600 text-white rounded"
                    >
                      Disqualify
                    </button>
                  )}
                </div>
              ),
            },
          ] as ListColumn[]
        }
        data={items as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No entries found"
        emptyDescription="Add vendors to the ASL using the form above."
      />
    </div>
  );
}

// ── Compliance ─────────────────────────────────────────────────────────────
function Compliance() {
  const apiFetch = useFrameworkFetch();
  const [rules, setRules] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [checkId, setCheckId] = useState("");
  const [checkResult, setCheckResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const loadRules = useCallback(() => {
    apiFetch<Record<string, unknown>[]>("/inventory/asl/compliance/rules")
      .then(setRules)
      .catch(console.error);
  }, []);
  useEffect(() => {
    loadRules();
  }, [loadRules]);

  async function saveRule() {
    setSaving(true);
    setMsg("");
    try {
      await apiFetch("/inventory/asl/compliance/rules", {
        method: "POST",
        body: JSON.stringify({
          productCategory: form.productCategory || undefined,
          minApprovedVendors: form.minApprovedVendors
            ? Number(form.minApprovedVendors)
            : 1,
          requiresQualification: form.requiresQualification === "true",
          requiresPreferred: form.requiresPreferred === "true",
          notes: form.notes || undefined,
        }),
      });
      setMsg("Rule saved");
      setForm({});
      loadRules();
    } catch (e: unknown) {
      setMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function runCheck() {
    if (!checkId) return;
    try {
      const result = await apiFetch<Record<string, unknown>>(
        `/inventory/asl/compliance/check/${checkId}`,
      );
      setCheckResult(result);
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">ASL Compliance</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
        <h3 className="font-medium">Check Product Compliance</h3>
        <div className="flex gap-3">
          <input
            value={checkId}
            onChange={(e) => setCheckId(e.target.value)}
            placeholder="Product ID"
            className="border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 flex-1"
          />
          <button
            onClick={runCheck}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
          >
            Check
          </button>
        </div>
        {checkResult && (
          <div
            className={`rounded p-3 text-sm ${checkResult.compliant ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"}`}
          >
            <p className="font-medium">
              {checkResult.compliant ? "✓ Compliant" : "✗ Non-Compliant"}
            </p>
            <p>
              Approved: {String(checkResult.approvedCount)} | Preferred:{" "}
              {String(checkResult.preferredCount)} | Expired:{" "}
              {String(checkResult.expiredCount)}
            </p>
            {(checkResult.issues as string[]).length > 0 && (
              <ul className="mt-1 list-disc list-inside">
                {(checkResult.issues as string[]).map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
        <h3 className="font-medium">Compliance Rules</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              key: "productCategory",
              label: "Product Category (blank = default)",
            },
            { key: "minApprovedVendors", label: "Min Approved Vendors" },
            { key: "notes", label: "Notes" },
          ].map(({ key, label }) => (
            <div key={key} className={key === "notes" ? "col-span-2" : ""}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                {label}
              </label>
              <input
                value={form[key] ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          ))}
          {[
            { key: "requiresQualification", label: "Requires Qualification" },
            { key: "requiresPreferred", label: "Requires Preferred Vendor" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={key}
                checked={form[key] === "true"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: String(e.target.checked) }))
                }
                className="rounded"
              />
              <label htmlFor={key} className="text-sm">
                {label}
              </label>
            </div>
          ))}
        </div>
        {msg && (
          <p className="text-sm text-blue-600 dark:text-blue-400">{msg}</p>
        )}
        <button
          onClick={saveRule}
          disabled={saving}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Rule"}
        </button>

        <ListPageTemplate
          columns={
            [
              {
                key: "productCategory",
                header: "Category",
                render: (v) => String(v ?? "Default"),
              },
              { key: "minApprovedVendors", header: "Min Vendors" },
              {
                key: "requiresQualification",
                header: "Req. Qualification",
                render: (v) => (v ? "Yes" : "No"),
              },
              {
                key: "requiresPreferred",
                header: "Req. Preferred",
                render: (v) => (v ? "Yes" : "No"),
              },
              {
                key: "notes",
                header: "Notes",
                render: (v) => String(v ?? "—"),
              },
            ] as ListColumn[]
          }
          data={rules as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No rules defined"
          emptyDescription="Save a compliance rule using the form above."
        />
      </div>
    </div>
  );
}

// ── Sourcing Report ────────────────────────────────────────────────────────
function SourcingReport() {
  const apiFetch = useFrameworkFetch();
  const [productId, setProductId] = useState("");
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!productId) return;
    setLoading(true);
    try {
      const result = await apiFetch<Record<string, unknown>>(
        `/inventory/asl/sourcing-report/${productId}`,
      );
      setReport(result);
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Vendor Sourcing Report</h2>
      <div className="flex gap-3">
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Product ID"
          className="border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 flex-1 max-w-xs"
        />
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Generate Report"}
        </button>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Suppliers", value: String(report.supplierCount) },
              {
                label: "Has Preferred",
                value: report.hasPreferred ? "Yes" : "No",
              },
              {
                label: "Lowest Price",
                value:
                  report.lowestPrice !== Infinity
                    ? `$${Number(report.lowestPrice).toFixed(4)}`
                    : "N/A",
              },
              {
                label: "Shortest Lead",
                value:
                  report.shortestLeadTime !== Infinity
                    ? `${report.shortestLeadTime}d`
                    : "N/A",
              },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-3"
              >
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-lg font-bold mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          <ListPageTemplate
            columns={
              [
                {
                  key: "vendorId",
                  header: "Vendor",
                  render: (v) => (
                    <span className="font-mono text-xs">{String(v)}</span>
                  ),
                },
                { key: "rank", header: "Rank" },
                {
                  key: "isPreferred",
                  header: "Preferred",
                  render: (v) => (v ? "★" : ""),
                },
                {
                  key: "unitPrice",
                  header: "Unit Price",
                  render: (v, row) =>
                    v ? `${row.currency} ${Number(v).toFixed(4)}` : "—",
                },
                {
                  key: "moq",
                  header: "MOQ",
                  render: (v) => (v ? String(v) : "—"),
                },
                {
                  key: "leadTimeDays",
                  header: "Lead Time",
                  render: (v) => (v ? `${v}d` : "—"),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (v) => statusBadge(String(v)),
                },
              ] as ListColumn[]
            }
            data={report.suppliers as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No suppliers"
            emptyDescription="No suppliers in this sourcing report."
          />
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "suppliers", label: "Approved Suppliers" },
  { id: "compliance", label: "Compliance" },
  { id: "sourcing", label: "Sourcing Report" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function AslPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <RouteGuard permission="inventory.asl.read">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Approved Supplier List (ASL)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vendor item catalog, supplier qualification, price tiers, and
            compliance management
          </p>
        </div>

        <div className="border-b flex gap-0 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          {tab === "dashboard" && <Dashboard />}
          {tab === "suppliers" && <ApprovedSuppliers />}
          {tab === "compliance" && <Compliance />}
          {tab === "sourcing" && <SourcingReport />}
        </div>
      </div>
    </RouteGuard>
  );
}
