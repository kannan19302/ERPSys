"use client";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn, StatCardRow } from "@unerp/ui";
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

const HAZARD_CLASSES = [
  "CLASS_1_EXPLOSIVES",
  "CLASS_2_GASES",
  "CLASS_3_FLAMMABLE_LIQUIDS",
  "CLASS_4_FLAMMABLE_SOLIDS",
  "CLASS_5_OXIDIZERS",
  "CLASS_6_TOXIC",
  "CLASS_7_RADIOACTIVE",
  "CLASS_8_CORROSIVES",
  "CLASS_9_MISC",
];
const REGULATIONS = ["ADR", "IATA", "IMDG", "DOT", "REACH"];
const MANIFEST_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "ACKNOWLEDGED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
];

function classLabel(c: string) {
  return c.replace("CLASS_", "").replace(/_/g, " ");
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    CURRENT: "bg-green-100 text-green-800",
    EXPIRED: "bg-red-100 text-red-800",
    PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
    SUPERSEDED: "bg-gray-100 text-gray-600",
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-blue-100 text-blue-800",
    ACKNOWLEDGED: "bg-indigo-100 text-indigo-800",
    IN_TRANSIT: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-700",
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
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
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Record<string, unknown>>("/inventory/hazmat/dashboard")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!data)
    return <p className="text-sm text-red-500">Failed to load dashboard.</p>;

  const cls = data.classifications as Record<string, number>;
  const sds = data.sds as Record<string, number>;
  const mf = data.manifests as Record<string, number>;
  const inc = data.incidents as Record<string, number>;

  const stats = [
    { label: "Classifications", value: cls.total ?? 0 },
    { label: "SDS – Current", value: sds.current ?? 0 },
    { label: "SDS – Expired", value: sds.expired ?? 0 },
    { label: "Manifests in Transit", value: mf.inTransit ?? 0 },
    { label: "Open Incidents", value: inc.open ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <StatCardRow stats={stats} />
    </div>
  );
}

// ── Classifications ────────────────────────────────────────────────────────
function Classifications() {
  const apiFetch = useFrameworkFetch();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    apiFetch<Record<string, unknown>[]>("/inventory/hazmat/classifications")
      .then(setItems)
      .catch(console.error);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await apiFetch("/inventory/hazmat/classifications", {
        method: "POST",
        body: JSON.stringify({
          productId: form.productId,
          unNumber: form.unNumber,
          properShippingName: form.properShippingName,
          hazardClass: form.hazardClass,
          packingGroup: form.packingGroup || undefined,
          regulation: form.regulation,
          flashPoint: form.flashPoint ? Number(form.flashPoint) : undefined,
          notes: form.notes || undefined,
        }),
      });
      setMsg("Classification created");
      setShowForm(false);
      setForm({});
      load();
    } catch (e: unknown) {
      setMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const columns: ListColumn[] = [
    { key: "productId", header: "Product ID" },
    { key: "unNumber", header: "UN #" },
    { key: "properShippingName", header: "Proper Shipping Name" },
    {
      key: "hazardClass",
      header: "Hazard Class",
      render: (row) =>
        classLabel(
          String((row as unknown as { hazardClass: string }).hazardClass),
        ),
    },
    {
      key: "packingGroup",
      header: "Packing Grp",
      render: (row) =>
        String(
          (row as unknown as { packingGroup?: string }).packingGroup ?? "—",
        ),
    },
    { key: "regulation", header: "Regulation" },
    {
      key: "sds",
      header: "SDS",
      render: (row) =>
        String(
          ((row as unknown as { sdsRecords?: unknown[] }).sdsRecords ?? [])
            .length,
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hazmat Classifications</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setMsg("");
          }}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          + New Classification
        </button>
      </div>

      {msg && <p className="text-sm text-blue-600 dark:text-blue-400">{msg}</p>}

      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-medium">New Classification</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "productId", label: "Product ID" },
              { key: "unNumber", label: "UN Number" },
              { key: "properShippingName", label: "Proper Shipping Name" },
              { key: "flashPoint", label: "Flash Point (°C)" },
            ].map(({ key, label }) => (
              <div key={key}>
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
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Hazard Class
              </label>
              <select
                value={form.hazardClass ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hazardClass: e.target.value }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select…</option>
                {HAZARD_CLASSES.map((h) => (
                  <option key={h} value={h}>
                    {classLabel(h)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Regulation
              </label>
              <select
                value={form.regulation ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, regulation: e.target.value }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select…</option>
                {REGULATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Packing Group
              </label>
              <select
                value={form.packingGroup ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, packingGroup: e.target.value }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">None</option>
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Notes
              </label>
              <input
                value={form.notes ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create"}
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
        columns={columns}
        data={items as unknown as Record<string, unknown>[]}
        loading={false}
        searchable
      />
    </div>
  );
}

// ── Manifests ──────────────────────────────────────────────────────────────
function Manifests() {
  const apiFetch = useFrameworkFetch();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(() => {
    const qs = filterStatus ? `?status=${filterStatus}` : "";
    apiFetch<Record<string, unknown>[]>(`/inventory/hazmat/manifests${qs}`)
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
      await apiFetch("/inventory/hazmat/manifests", {
        method: "POST",
        body: JSON.stringify({
          regulation: form.regulation,
          originAddress: form.originAddress,
          destAddress: form.destAddress,
          carrierName: form.carrierName || undefined,
          shipmentRef: form.shipmentRef || undefined,
          emergencyContact: form.emergencyContact || undefined,
        }),
      });
      setMsg("Manifest created");
      setShowForm(false);
      setForm({});
      load();
    } catch (e: unknown) {
      setMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function transition(id: string, action: string) {
    try {
      await apiFetch(`/inventory/hazmat/manifests/${id}/${action}`, {
        method: "PATCH",
        body: "{}",
      });
      load();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  }

  const columns: ListColumn[] = [
    { key: "manifestNumber", header: "Manifest #" },
    { key: "regulation", header: "Regulation" },
    { key: "originAddress", header: "Origin" },
    { key: "destAddress", header: "Destination" },
    {
      key: "carrierName",
      header: "Carrier",
      render: (row) =>
        String((row as unknown as { carrierName?: string }).carrierName ?? "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        statusBadge(String((row as unknown as { status: string }).status)),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const m = row as unknown as { id: string; status: string };
        return (
          <div className="flex gap-1 flex-wrap">
            {m.status === "DRAFT" && (
              <button
                onClick={() => transition(m.id, "submit")}
                className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            )}
            {m.status === "SUBMITTED" && (
              <button
                onClick={() => transition(m.id, "acknowledge")}
                className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Acknowledge
              </button>
            )}
            {m.status === "ACKNOWLEDGED" && (
              <button
                onClick={() => transition(m.id, "in-transit")}
                className="px-2 py-0.5 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                In Transit
              </button>
            )}
            {m.status === "IN_TRANSIT" && (
              <button
                onClick={() => transition(m.id, "deliver")}
                className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Deliver
              </button>
            )}
            {!["DELIVERED", "CANCELLED"].includes(m.status) && (
              <button
                onClick={() => transition(m.id, "cancel")}
                className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold flex-1">Hazmat Manifests</h2>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">All Statuses</option>
          {MANIFEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setMsg("");
          }}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          + New Manifest
        </button>
      </div>

      {msg && <p className="text-sm text-blue-600 dark:text-blue-400">{msg}</p>}

      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-medium">New Manifest</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "originAddress", label: "Origin Address" },
              { key: "destAddress", label: "Destination Address" },
              { key: "carrierName", label: "Carrier Name" },
              { key: "shipmentRef", label: "Shipment Ref" },
              { key: "emergencyContact", label: "Emergency Contact" },
            ].map(({ key, label }) => (
              <div key={key}>
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
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Regulation
              </label>
              <select
                value={form.regulation ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, regulation: e.target.value }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select…</option>
                {REGULATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create"}
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
        columns={columns}
        data={items as unknown as Record<string, unknown>[]}
        loading={false}
        searchable
      />
    </div>
  );
}

// ── Incidents ──────────────────────────────────────────────────────────────
function Incidents() {
  const apiFetch = useFrameworkFetch();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    apiFetch<Record<string, unknown>[]>("/inventory/hazmat/incidents")
      .then(setItems)
      .catch(console.error);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await apiFetch("/inventory/hazmat/incidents", {
        method: "POST",
        body: JSON.stringify({
          productId: form.productId,
          incidentDate: form.incidentDate,
          severity: form.severity,
          description: form.description,
          immediateAction: form.immediateAction || undefined,
        }),
      });
      setMsg("Incident recorded");
      setShowForm(false);
      setForm({});
      load();
    } catch (e: unknown) {
      setMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function closeInc(id: string) {
    try {
      await apiFetch(`/inventory/hazmat/incidents/${id}/close`, {
        method: "PATCH",
        body: "{}",
      });
      load();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  }

  const columns: ListColumn[] = [
    { key: "incidentNumber", header: "Incident #" },
    { key: "productId", header: "Product" },
    {
      key: "incidentDate",
      header: "Date",
      render: (row) =>
        new Date(
          String((row as unknown as { incidentDate: string }).incidentDate),
        ).toLocaleDateString(),
    },
    {
      key: "severity",
      header: "Severity",
      render: (row) => {
        const inc = row as unknown as { severity: string };
        const colorMap: Record<string, string> = {
          CRITICAL: "bg-red-100 text-red-800",
          HIGH: "bg-orange-100 text-orange-800",
          MEDIUM: "bg-yellow-100 text-yellow-800",
        };
        return (
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${colorMap[inc.severity] ?? "bg-blue-100 text-blue-800"}`}
          >
            {inc.severity}
          </span>
        );
      },
    },
    { key: "description", header: "Description" },
    { key: "reportedBy", header: "Reported By" },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const inc = row as unknown as { closedAt?: string };
        return inc.closedAt ? statusBadge("APPROVED") : statusBadge("PENDING");
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const inc = row as unknown as { id: string; closedAt?: string };
        return !inc.closedAt ? (
          <button
            onClick={() => closeInc(inc.id)}
            className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Close
          </button>
        ) : null;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hazmat Incidents</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setMsg("");
          }}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          + Report Incident
        </button>
      </div>

      {msg && <p className="text-sm text-blue-600 dark:text-blue-400">{msg}</p>}

      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Report Incident</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "productId", label: "Product ID" },
              { key: "incidentDate", label: "Incident Date", type: "date" },
              { key: "severity", label: "Severity (LOW/MEDIUM/HIGH/CRITICAL)" },
              { key: "description", label: "Description" },
              { key: "immediateAction", label: "Immediate Action Taken" },
            ].map(({ key, label, type }) => (
              <div
                key={key}
                className={
                  key === "description" || key === "immediateAction"
                    ? "col-span-2"
                    : ""
                }
              >
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
              className="px-4 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Report"}
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
        columns={columns}
        data={items as unknown as Record<string, unknown>[]}
        loading={false}
        searchable
      />
    </div>
  );
}

// ── Compliance Report ──────────────────────────────────────────────────────
function ComplianceReport() {
  const apiFetch = useFrameworkFetch();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Record<string, unknown>[]>("/inventory/hazmat/compliance-report")
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  const compliant = rows.filter((r) => r.compliant).length;
  const nonCompliant = rows.length - compliant;

  const columns: ListColumn[] = [
    { key: "productId", header: "Product" },
    { key: "unNumber", header: "UN #" },
    {
      key: "hazardClass",
      header: "Hazard Class",
      render: (row) =>
        classLabel(
          String((row as unknown as { hazardClass: string }).hazardClass),
        ),
    },
    { key: "regulation", header: "Regulation" },
    { key: "sdsCount", header: "SDS" },
    {
      key: "currentSds",
      header: "Current",
      render: (row) => (
        <span className="text-green-700">
          {String((row as unknown as { currentSds: number }).currentSds)}
        </span>
      ),
    },
    {
      key: "expiredSds",
      header: "Expired",
      render: (row) => (
        <span className="text-red-600">
          {String((row as unknown as { expiredSds: number }).expiredSds)}
        </span>
      ),
    },
    {
      key: "unacknowledgedSds",
      header: "Unacknowledged",
      render: (row) => (
        <span className="text-orange-600">
          {String(
            (row as unknown as { unacknowledgedSds: number }).unacknowledgedSds,
          )}
        </span>
      ),
    },
    {
      key: "compliant",
      header: "Compliant",
      render: (row) =>
        (row as unknown as { compliant: boolean }).compliant ? (
          <span className="text-green-600 font-semibold">✓</span>
        ) : (
          <span className="text-red-600 font-semibold">✗</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Compliance Report</h2>
      <StatCardRow
        stats={[
          { label: "Compliant", value: compliant },
          { label: "Non-Compliant", value: nonCompliant },
        ]}
      />
      <ListPageTemplate
        columns={columns}
        data={rows as unknown as Record<string, unknown>[]}
        loading={false}
        searchable
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "classifications", label: "Classifications" },
  { id: "manifests", label: "Manifests" },
  { id: "incidents", label: "Incidents" },
  { id: "compliance", label: "Compliance Report" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function HazmatPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <RouteGuard permission="inventory.hazmat.read">
      <div className="ui-page-shell">
        <div>
          <h1 className="text-2xl font-bold">Hazardous Materials Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dangerous goods classification, SDS management, hazmat manifests,
            and compliance reporting
          </p>
        </div>

        <div className="border-b flex gap-0 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === id
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          {tab === "dashboard" && <Dashboard />}
          {tab === "classifications" && <Classifications />}
          {tab === "manifests" && <Manifests />}
          {tab === "incidents" && <Incidents />}
          {tab === "compliance" && <ComplianceReport />}
        </div>
      </div>
    </RouteGuard>
  );
}
