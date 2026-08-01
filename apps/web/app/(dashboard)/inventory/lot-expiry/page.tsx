"use client";
import styles from "./page.module.css";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { Package as InventoryModuleIcon } from "lucide-react";
const BASE = "/api/inventory/lot-expiry";
function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(
    <T,>(path: string, opts?: RequestInit) =>
      client.request<T>(`${BASE}${path}`.replace("/api", ""), {
        method: opts?.method,
        body: opts?.body ? String(opts.body) : undefined,
      }),
    [client],
  );
}

const TABS = ["Dashboard", "Lots", "FEFO Pick", "Alerts", "Disposals"] as const;
type Tab = (typeof TABS)[number];

export default function LotExpiryPage() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  return (
    <RouteGuard permission="inventory.lot-expiry.read">
      <div className="ui-page-shell">
        <h1 className="text-2xl font-bold">Lot/Batch Expiry Management</h1>
        <div className="flex gap-2 border-b">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "Dashboard" && <DashboardTab />}
        {tab === "Lots" && <LotsTab />}
        {tab === "FEFO Pick" && <FEFOTab />}
        {tab === "Alerts" && <AlertsTab />}
        {tab === "Disposals" && <DisposalsTab />}
      </div>
    </RouteGuard>
  );
}

function DashboardTab() {
  const apiFetch = useFrameworkFetch();
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    apiFetch("/dashboard").then(setStats).catch(console.error);
  }, []);
  if (!stats) return <p className="text-sm text-gray-500">Loading…</p>;
  const cards = [
    ["Total Lots", stats.total],
    ["Active", stats.active],
    ["Quarantine", stats.quarantine],
    ["Expired", stats.expired],
    ["Disposed", stats.disposed],
    ["Expiring ≤7d", stats.expiring7],
    ["Expiring ≤30d", stats.expiring30],
    ["Open Alerts", stats.openAlerts],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(([label, value]) => (
        <div
          key={label as string}
          className={`bg-white border rounded-lg p-4 shadow-sm ${(label as string).startsWith("Expir") || label === "Open Alerts" ? "border-orange-200" : ""}`}
        >
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function LotsTab() {
  const apiFetch = useFrameworkFetch();
  const [lots, setLots] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({
    lotNumber: "",
    productId: "",
    warehouseId: "",
    expiryDate: "",
    qty: "",
    notes: "",
  });
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    apiFetch<{ items: any[]; total: number }>("/lots")
      .then((r) => {
        setLots(r.items);
        setTotal(r.total);
      })
      .catch(console.error);
  }, []);
  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/lots", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          qty: +form.qty,
          expiryDate: new Date(form.expiryDate),
        }),
      });
      setMsg("Lot registered");
      setForm({
        lotNumber: "",
        productId: "",
        warehouseId: "",
        expiryDate: "",
        qty: "",
        notes: "",
      });
      load();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  const quarantine = async (id: string) => {
    const reason = prompt("Quarantine reason?");
    if (!reason) return;
    try {
      await apiFetch(`/lots/${id}/quarantine`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      load();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  const release = async (id: string) => {
    try {
      await apiFetch(`/lots/${id}/release`, { method: "PATCH" });
      load();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  const statusBadge: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    QUARANTINE: "bg-yellow-50 text-yellow-700",
    EXPIRED: "bg-red-50 text-red-700",
    DISPOSED: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="bg-white border rounded-lg p-4 space-y-3"
      >
        <h2 className="font-semibold text-sm">Register Lot</h2>
        <div className="grid grid-cols-3 gap-3">
          {(["lotNumber", "productId", "warehouseId", "qty"] as const).map(
            (key) => (
              <div key={key}>
                <label className="text-xs text-gray-600 capitalize">
                  {key} *
                </label>
                <input
                  type={key === "qty" ? "number" : "text"}
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  required
                />
              </div>
            ),
          )}
          <div>
            <label className="text-xs text-gray-600">Expiry Date *</label>
            <input
              type="date"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.expiryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiryDate: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Notes</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded"
        >
          Register
        </button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </form>
      <div>
        <p className="text-sm text-gray-500 mb-2">Lots ({total})</p>
        <ListPageTemplate
          columns={
            [
              {
                key: "lotNumber",
                header: "Lot #",
                render: (v) => <span className="font-mono">{String(v)}</span>,
              },
              { key: "productId", header: "Product" },
              { key: "warehouseId", header: "Warehouse" },
              { key: "remainingQty", header: "Qty Rem." },
              {
                key: "expiryDate",
                header: "Expiry",
                render: (v) => new Date(String(v)).toLocaleDateString(),
              },
              {
                key: "status",
                header: "Status",
                render: (v) => (
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${statusBadge[String(v)] ?? ""}`}
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
                    {row.status === "ACTIVE" && (
                      <button
                        onClick={() => quarantine(String(v))}
                        className="text-xs text-yellow-600 hover:underline"
                      >
                        Quarantine
                      </button>
                    )}
                    {row.status === "QUARANTINE" && (
                      <button
                        onClick={() => release(String(v))}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Release
                      </button>
                    )}
                  </div>
                ),
              },
            ] as ListColumn[]
          }
          data={lots as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No lots"
          emptyDescription="Register a lot using the form above."
        />
      </div>
    </div>
  );
}

function FEFOTab() {
  const apiFetch = useFrameworkFetch();
  const [form, setForm] = useState({ productId: "", warehouseId: "", qty: "" });
  const [result, setResult] = useState<any>(null);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(
        `/fefo?productId=${form.productId}&warehouseId=${form.warehouseId}&qty=${form.qty}`,
      );
      setResult(res);
      setMsg("");
    } catch (err: any) {
      setMsg(err.message);
      setResult(null);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={submit}
        className="bg-white border rounded-lg p-4 space-y-3 max-w-md"
      >
        <h2 className="font-semibold text-sm">
          FEFO (First-Expired-First-Out) Pick Plan
        </h2>
        {(["productId", "warehouseId"] as const).map((key) => (
          <div key={key}>
            <label className="text-xs text-gray-600 capitalize">{key} *</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form[key]}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
              required
            />
          </div>
        ))}
        <div>
          <label className="text-xs text-gray-600">Qty Needed *</label>
          <input
            type="number"
            className="w-full border rounded px-2 py-1 text-sm"
            value={form.qty}
            onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white text-sm rounded"
        >
          Generate Pick Plan
        </button>
        {msg && <p className="text-sm text-red-600">{msg}</p>}
      </form>
      {result && (
        <div>
          <p className="text-sm font-medium mb-2">
            Pick Plan — Total: {result.totalQty}
          </p>
          <ListPageTemplate
            columns={
              [
                {
                  key: "lotNumber",
                  header: "Lot #",
                  render: (v) => <span className="font-mono">{String(v)}</span>,
                },
                {
                  key: "expiryDate",
                  header: "Expiry Date",
                  render: (v) => new Date(String(v)).toLocaleDateString(),
                },
                {
                  key: "qty",
                  header: "Pick Qty",
                  render: (v) => <strong>{String(v)}</strong>,
                },
              ] as ListColumn[]
            }
            data={(result.picks ?? []) as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No picks"
            emptyDescription="No lot picks generated."
          />
        </div>
      )}
    </div>
  );
}

function AlertsTab() {
  const apiFetch = useFrameworkFetch();
  const [alerts, setAlerts] = useState<any[]>([]);

  const load = useCallback(() => {
    apiFetch<any[]>("/alerts").then(setAlerts).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const scan = async () => {
    try {
      await apiFetch("/alerts/scan", { method: "POST", body: "{}" });
      load();
    } catch (err: any) {
      console.error(err);
    }
  };

  const dismiss = async (id: string) => {
    try {
      await apiFetch(`/alerts/${id}/dismiss`, { method: "PATCH" });
      load();
    } catch (err: any) {
      console.error(err);
    }
  };

  const levelColor: Record<string, string> = {
    CRITICAL: "bg-red-50 text-red-700",
    WARNING: "bg-yellow-50 text-yellow-700",
    INFO: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="space-y-4">
      <button
        onClick={scan}
        className="px-4 py-2 bg-orange-600 text-white text-sm rounded"
      >
        Scan for Expiry Alerts
      </button>
      <ListPageTemplate
        columns={
          [
            {
              key: "alertLevel",
              header: "Level",
              render: (v) => (
                <span
                  className={`px-2 py-0.5 rounded text-xs ${levelColor[String(v)] ?? ""}`}
                >
                  {String(v)}
                </span>
              ),
            },
            { key: "daysToExpiry", header: "Days to Expiry" },
            {
              key: "alertedAt",
              header: "Alerted At",
              render: (v) => new Date(String(v)).toLocaleString(),
            },
            {
              key: "id",
              header: "Action",
              render: (v) => (
                <button
                  onClick={() => dismiss(String(v))}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Dismiss
                </button>
              ),
            },
          ] as ListColumn[]
        }
        data={alerts as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No open alerts"
        emptyDescription="Run a scan to check for expiry alerts."
      />
    </div>
  );
}

function DisposalsTab() {
  const apiFetch = useFrameworkFetch();
  const [disposals, setDisposals] = useState<any[]>([]);
  const [form, setForm] = useState({
    lotId: "",
    disposalMethod: "DESTROY",
    qtyDisposed: "",
    reason: "",
    notes: "",
  });
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    apiFetch<any[]>("/disposals").then(setDisposals).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/disposals", {
        method: "POST",
        body: JSON.stringify({ ...form, qtyDisposed: +form.qtyDisposed }),
      });
      setMsg("Disposal recorded");
      setForm({
        lotId: "",
        disposalMethod: "DESTROY",
        qtyDisposed: "",
        reason: "",
        notes: "",
      });
      load();
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="bg-white border rounded-lg p-4 space-y-3 max-w-md"
      >
        <h2 className="font-semibold text-sm">Record Disposal</h2>
        <div>
          <label className="text-xs text-gray-600">Lot ID *</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={form.lotId}
            onChange={(e) => setForm((f) => ({ ...f, lotId: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Disposal Method</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={form.disposalMethod}
            onChange={(e) =>
              setForm((f) => ({ ...f, disposalMethod: e.target.value }))
            }
          >
            {["DESTROY", "RETURN_TO_VENDOR", "DONATE", "REWORK", "OTHER"].map(
              (m) => (
                <option key={m}>{m}</option>
              ),
            )}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Qty to Dispose *</label>
          <input
            type="number"
            className="w-full border rounded px-2 py-1 text-sm"
            value={form.qtyDisposed}
            onChange={(e) =>
              setForm((f) => ({ ...f, qtyDisposed: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Reason *</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 text-white text-sm rounded"
        >
          Record Disposal
        </button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </form>
      <ListPageTemplate
        columns={
          [
            {
              key: "disposalNumber",
              header: "Disposal #",
              render: (v) => <span className="font-mono">{String(v)}</span>,
            },
            { key: "disposalMethod", header: "Method" },
            { key: "qtyDisposed", header: "Qty" },
            { key: "reason", header: "Reason" },
            {
              key: "disposedAt",
              header: "Date",
              render: (v) => new Date(String(v)).toLocaleDateString(),
            },
          ] as ListColumn[]
        }
        data={disposals as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No disposals"
        emptyDescription="Record a disposal using the form above."
      />
    </div>
  );
}
