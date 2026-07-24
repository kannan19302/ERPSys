"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Button, Spinner, Badge } from "@unerp/ui";
import { AlertCircle, Truck, Package, CheckCircle, Plus } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { Package as InventoryModuleIcon } from "lucide-react";
const STATUS_COLORS: Record<
  string,
  "default" | "info" | "warning" | "success" | "danger"
> = {
  EXPECTED: "default",
  IN_TRANSIT: "info",
  ARRIVED: "warning",
  RECEIVING: "warning",
  COMPLETE: "success",
  PENDING: "default",
  PACKED: "info",
  SHIPPED: "warning",
  DELIVERED: "success",
  RETURNED: "danger",
  EXCEPTION: "danger",
  OPEN: "danger",
  INVESTIGATING: "warning",
  RESOLVED: "success",
  ESCALATED: "danger",
};

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  warehouseId: string;
  trackingNumber?: string;
  createdAt: string;
}
interface Exception {
  id: string;
  shipmentId: string;
  direction: string;
  exceptionCode: string;
  description: string;
  severity: string;
  status: string;
  resolvedAt?: string;
}
interface Dashboard {
  inboundByStatus: { status: string; _count: { id: number } }[];
  outboundByStatus: { status: string; _count: { id: number } }[];
  openExceptions: number;
  recentTracking: {
    id: string;
    eventCode: string;
    description: string;
    occurredAt: string;
  }[];
}

export default function ShipmentTrackingPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<
    | "dashboard"
    | "inbound"
    | "outbound"
    | "exceptions"
    | "new-inbound"
    | "new-outbound"
  >("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [inbound, setInbound] = useState<Shipment[]>([]);
  const [outbound, setOutbound] = useState<Shipment[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inboundForm, setInboundForm] = useState({
    warehouseId: "",
    trackingNumber: "",
    carrierName: "",
  });
  const [outboundForm, setOutboundForm] = useState({
    warehouseId: "",
    trackingNumber: "",
    recipientName: "",
    recipientAddr: "",
  });
  const [actionId, setActionId] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [direction, setDirection] = useState<"INBOUND" | "OUTBOUND">("INBOUND");
  const apiFetch = useCallback(
    <T,>(path: string, opts?: RequestInit) =>
      client.request<T>(path, {
        method: opts?.method,
        body: opts?.body ? String(opts.body) : undefined,
      }),
    [client],
  );

  const load = async (t: typeof tab) => {
    setLoading(true);
    setError(null);
    try {
      if (t === "dashboard")
        setDashboard(
          await apiFetch<Dashboard>("/inventory/shipment-tracking/dashboard"),
        );
      if (t === "inbound")
        setInbound(
          await apiFetch<Shipment[]>("/inventory/shipment-tracking/inbound"),
        );
      if (t === "outbound")
        setOutbound(
          await apiFetch<Shipment[]>("/inventory/shipment-tracking/outbound"),
        );
      if (t === "exceptions")
        setExceptions(
          await apiFetch<Exception[]>(
            "/inventory/shipment-tracking/exceptions",
          ),
        );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const createInbound = async () => {
    try {
      await apiFetch("/inventory/shipment-tracking/inbound", {
        method: "POST",
        body: JSON.stringify(inboundForm),
      });
      setTab("inbound");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const createOutbound = async () => {
    try {
      await apiFetch("/inventory/shipment-tracking/outbound", {
        method: "POST",
        body: JSON.stringify(outboundForm),
      });
      setTab("outbound");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const updateStatus = async () => {
    const path =
      direction === "INBOUND"
        ? `/inventory/shipment-tracking/inbound/${actionId}/status`
        : `/inventory/shipment-tracking/outbound/${actionId}/status`;
    try {
      await apiFetch(path, {
        method: "PATCH",
        body: JSON.stringify({ status: actionStatus }),
      });
      setActionId("");
      setActionStatus("");
      load(direction === "INBOUND" ? "inbound" : "outbound");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const resolveException = async (id: string) => {
    try {
      await apiFetch(`/inventory/shipment-tracking/exceptions/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED", note: "Resolved" }),
      });
      load("exceptions");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "inbound", label: "Inbound" },
    { key: "outbound", label: "Outbound" },
    { key: "exceptions", label: "Exceptions" },
    { key: "new-inbound", label: "+ Inbound" },
    { key: "new-outbound", label: "+ Outbound" },
  ] as const;

  return (
    <RouteGuard permission="inventory.shipment-tracking.read">
      <div className="ui-page-shell">
        <PageHeader title="Shipment Tracking" />
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "primary" : "secondary"}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {loading && <Spinner />}

        {tab === "dashboard" && dashboard && (
          <div className="space-y-4">
            {dashboard.openExceptions > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded border border-red-200 text-red-700">
                <AlertCircle size={16} />
                {dashboard.openExceptions} open exception(s) require attention
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <Package size={14} />
                  Inbound Shipments
                </div>
                {dashboard.inboundByStatus.map((s) => (
                  <div
                    key={s.status}
                    className="flex justify-between text-sm py-1"
                  >
                    <Badge variant={STATUS_COLORS[s.status] ?? "default"}>
                      {s.status}
                    </Badge>
                    <span className="font-bold">{s._count.id}</span>
                  </div>
                ))}
              </Card>
              <Card className="p-4">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <Truck size={14} />
                  Outbound Shipments
                </div>
                {dashboard.outboundByStatus.map((s) => (
                  <div
                    key={s.status}
                    className="flex justify-between text-sm py-1"
                  >
                    <Badge variant={STATUS_COLORS[s.status] ?? "default"}>
                      {s.status}
                    </Badge>
                    <span className="font-bold">{s._count.id}</span>
                  </div>
                ))}
              </Card>
            </div>
            <Card className="p-4">
              <div className="font-semibold mb-2">Recent Tracking Events</div>
              {dashboard.recentTracking.map((e) => (
                <div key={e.id} className="text-sm py-1 border-b flex gap-3">
                  <span className="font-mono text-gray-400">
                    {new Date(e.occurredAt).toLocaleString()}
                  </span>
                  <Badge variant="info">{e.eventCode}</Badge>
                  <span>{e.description}</span>
                </div>
              ))}
            </Card>
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Quick Status Update</div>
              <div className="flex gap-2 flex-wrap">
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as "INBOUND" | "OUTBOUND")
                  }
                >
                  <option value="INBOUND">Inbound</option>
                  <option value="OUTBOUND">Outbound</option>
                </select>
                <input
                  className="border rounded px-2 py-1 text-sm w-48"
                  placeholder="Shipment ID"
                  value={actionId}
                  onChange={(e) => setActionId(e.target.value)}
                />
                <input
                  className="border rounded px-2 py-1 text-sm w-36"
                  placeholder="New Status"
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                />
                <Button variant="primary" onClick={updateStatus}>
                  <CheckCircle size={14} className="mr-1" />
                  Update
                </Button>
              </div>
            </Card>
          </div>
        )}

        {tab === "inbound" && (
          <Card className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th>Shipment #</th>
                  <th>Status</th>
                  <th>Warehouse</th>
                  <th>Tracking #</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {inbound.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-1 font-mono">{s.shipmentNumber}</td>
                    <td>
                      <Badge variant={STATUS_COLORS[s.status] ?? "default"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td>{s.warehouseId}</td>
                    <td>{s.trackingNumber ?? "—"}</td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {inbound.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">
                      No inbound shipments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "outbound" && (
          <Card className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th>Shipment #</th>
                  <th>Status</th>
                  <th>Warehouse</th>
                  <th>Tracking #</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {outbound.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-1 font-mono">{s.shipmentNumber}</td>
                    <td>
                      <Badge variant={STATUS_COLORS[s.status] ?? "default"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td>{s.warehouseId}</td>
                    <td>{s.trackingNumber ?? "—"}</td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {outbound.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">
                      No outbound shipments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "exceptions" && (
          <Card className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th>Shipment</th>
                  <th>Direction</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="py-1 font-mono text-xs">{e.shipmentId}</td>
                    <td>{e.direction}</td>
                    <td>{e.exceptionCode}</td>
                    <td>{e.description}</td>
                    <td>{e.severity}</td>
                    <td>
                      <Badge variant={STATUS_COLORS[e.status] ?? "default"}>
                        {e.status}
                      </Badge>
                    </td>
                    <td>
                      {e.status !== "RESOLVED" && (
                        <Button
                          variant="secondary"
                          onClick={() => resolveException(e.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {exceptions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-400">
                      No exceptions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "new-inbound" && (
          <Card className="p-4 space-y-3 max-w-md">
            <div className="font-semibold flex items-center gap-2">
              <Plus size={16} />
              New Inbound Shipment
            </div>
            {(
              [
                ["Warehouse ID *", "warehouseId"],
                ["Carrier Name", "carrierName"],
                ["Tracking Number", "trackingNumber"],
              ] as const
            ).map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">
                  {label}
                </label>
                <input
                  className="border rounded px-2 py-1 w-full text-sm"
                  value={inboundForm[key as keyof typeof inboundForm]}
                  onChange={(e) =>
                    setInboundForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <Button variant="primary" onClick={createInbound}>
              <Package size={14} className="mr-1" />
              Create Inbound Shipment
            </Button>
          </Card>
        )}

        {tab === "new-outbound" && (
          <Card className="p-4 space-y-3 max-w-md">
            <div className="font-semibold flex items-center gap-2">
              <Plus size={16} />
              New Outbound Shipment
            </div>
            {(
              [
                ["Warehouse ID *", "warehouseId"],
                ["Tracking Number", "trackingNumber"],
                ["Recipient Name", "recipientName"],
                ["Recipient Address", "recipientAddr"],
              ] as const
            ).map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">
                  {label}
                </label>
                <input
                  className="border rounded px-2 py-1 w-full text-sm"
                  value={outboundForm[key as keyof typeof outboundForm]}
                  onChange={(e) =>
                    setOutboundForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <Button variant="primary" onClick={createOutbound}>
              <Truck size={14} className="mr-1" />
              Create Outbound Shipment
            </Button>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
