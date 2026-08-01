"use client";
import { useState, useEffect, useCallback } from "react";
import { ListPageTemplate, type ListColumn } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { Package as InventoryModuleIcon } from "lucide-react";
function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(<T,>(path: string) => client.get<T>(path), [client]);
}

type Tab = "dashboard" | "tasks" | "bin-transfers" | "grn" | "packing";

interface StatCard {
  label: string;
  value: number | string;
  warn?: boolean;
}

function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-lg border p-4 ${c.warn ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"}`}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {c.label}
          </p>
          <p
            className={`text-2xl font-bold ${c.warn ? "text-yellow-700 dark:text-yellow-300" : "text-gray-900 dark:text-white"}`}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    yellow:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    purple:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color] ?? colors.gray}`}
    >
      {label}
    </span>
  );
}

function taskStatusColor(status: string): string {
  const map: Record<string, string> = {
    QUEUED: "gray",
    ASSIGNED: "blue",
    IN_PROGRESS: "yellow",
    COMPLETE: "green",
    CANCELLED: "red",
  };
  return map[status] ?? "gray";
}

function transferStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "gray",
    APPROVED: "blue",
    REJECTED: "red",
    COMPLETE: "green",
  };
  return map[status] ?? "gray";
}

function grnStatusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "gray",
    VERIFIED: "blue",
    QUALITY_CHECK: "yellow",
    COMPLETE: "green",
    REJECTED: "red",
  };
  return map[status] ?? "gray";
}

function packingStatusColor(status: string): string {
  const map: Record<string, string> = {
    OPEN: "blue",
    COMPLETE: "green",
    CANCELLED: "red",
  };
  return map[status] ?? "gray";
}

function taskTypeColor(type: string): string {
  const map: Record<string, string> = {
    PICK: "blue",
    PUTAWAY: "purple",
    REPLENISH: "yellow",
    BIN_TRANSFER: "gray",
    RECEIVE: "green",
    PACK: "blue",
    CYCLE_COUNT: "purple",
  };
  return map[type] ?? "gray";
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────
function DashboardTab() {
  const apiFetch = useFrameworkFetch();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/inventory/warehouse-ops/dashboard"),
      apiFetch("/inventory/warehouse-ops/tasks/dashboard"),
      apiFetch("/inventory/warehouse-ops/grn/dashboard"),
    ])
      .then(([ops, tasks, grn]) => setData({ ops, tasks, grn }))
      .catch(() => {});
  }, []);

  if (!data)
    return (
      <div className="text-gray-500 py-8 text-center">Loading dashboard…</div>
    );

  const { ops, tasks, grn } = data;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Task Queue
        </h3>
        <StatCards
          cards={[
            { label: "Queued", value: tasks?.byStatus?.QUEUED ?? 0 },
            {
              label: "In Progress",
              value: tasks?.byStatus?.IN_PROGRESS ?? 0,
              warn: (tasks?.byStatus?.IN_PROGRESS ?? 0) > 10,
            },
            { label: "Completed Today", value: tasks?.completedToday ?? 0 },
            {
              label: "Overdue",
              value: tasks?.overdue ?? 0,
              warn: (tasks?.overdue ?? 0) > 0,
            },
          ]}
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          GRN
        </h3>
        <StatCards
          cards={[
            { label: "Draft", value: grn?.byStatus?.DRAFT ?? 0 },
            {
              label: "Pending Verification",
              value: grn?.byStatus?.VERIFIED ?? 0,
            },
            {
              label: "Quality Check",
              value: grn?.byStatus?.QUALITY_CHECK ?? 0,
              warn: (grn?.byStatus?.QUALITY_CHECK ?? 0) > 0,
            },
            { label: "Completed", value: grn?.byStatus?.COMPLETE ?? 0 },
          ]}
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Bin Transfers
        </h3>
        <StatCards
          cards={[
            {
              label: "Pending Approval",
              value: ops?.pendingBinTransfers ?? 0,
              warn: (ops?.pendingBinTransfers ?? 0) > 0,
            },
            { label: "Approved", value: ops?.approvedBinTransfers ?? 0 },
            {
              label: "Open Packing Sessions",
              value: ops?.openPackingSessions ?? 0,
            },
            { label: "Total Cartons Today", value: ops?.cartonsToday ?? 0 },
          ]}
        />
      </div>
    </div>
  );
}

// ── Tasks Tab ──────────────────────────────────────────────────────────────
function TasksTab() {
  const apiFetch = useFrameworkFetch();
  const [tasks, setTasks] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    const qs = status ? `?status=${status}` : "";
    apiFetch(`/inventory/warehouse-ops/tasks${qs}`)
      .then((d: any) => setTasks(d?.data ?? []))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "QUEUED", "ASSIGNED", "IN_PROGRESS", "COMPLETE", "CANCELLED"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${status === s ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            >
              {s || "All"}
            </button>
          ),
        )}
      </div>
      <ListPageTemplate
        columns={
          [
            {
              key: "taskNumber",
              header: "Task #",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            {
              key: "taskType",
              header: "Type",
              render: (v) => (
                <Badge label={String(v)} color={taskTypeColor(String(v))} />
              ),
            },
            { key: "priority", header: "Priority" },
            {
              key: "status",
              header: "Status",
              render: (v) => (
                <Badge label={String(v)} color={taskStatusColor(String(v))} />
              ),
            },
            {
              key: "sourceLocation",
              header: "From → To",
              render: (v, row) => `${v ?? "—"} → ${row.destLocation ?? "—"}`,
            },
            {
              key: "productId",
              header: "Product",
              render: (v) => String(v ?? "—"),
            },
            {
              key: "assignedTo",
              header: "Assigned",
              render: (v) => String(v ?? "Unassigned"),
            },
          ] as ListColumn[]
        }
        data={tasks as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No tasks found"
        emptyDescription="No warehouse tasks found."
      />
    </div>
  );
}

// ── Bin Transfers Tab ──────────────────────────────────────────────────────
function BinTransfersTab() {
  const apiFetch = useFrameworkFetch();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    const qs = status ? `?status=${status}` : "";
    apiFetch(`/inventory/warehouse-ops/bin-transfers${qs}`)
      .then((d: any) => setTransfers(d?.data ?? []))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "PENDING", "APPROVED", "REJECTED", "COMPLETE"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${status === s ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>
      <ListPageTemplate
        columns={
          [
            {
              key: "transferNumber",
              header: "Transfer #",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            { key: "productId", header: "Product" },
            {
              key: "fromBin",
              header: "From Bin",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            {
              key: "toBin",
              header: "To Bin",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            {
              key: "qty",
              header: "Qty",
              render: (v, row) => `${v} ${row.uom ?? ""}`,
            },
            {
              key: "status",
              header: "Status",
              render: (v) => (
                <Badge
                  label={String(v)}
                  color={transferStatusColor(String(v))}
                />
              ),
            },
            {
              key: "reason",
              header: "Reason",
              render: (v) => String(v ?? "—"),
            },
          ] as ListColumn[]
        }
        data={transfers as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No transfers found"
        emptyDescription="No bin transfers found."
      />
    </div>
  );
}

// ── GRN Tab ────────────────────────────────────────────────────────────────
function GrnTab() {
  const apiFetch = useFrameworkFetch();
  const [grns, setGrns] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    const qs = status ? `?status=${status}` : "";
    apiFetch(`/inventory/warehouse-ops/grn${qs}`)
      .then((d: any) => setGrns(d?.data ?? []))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "DRAFT", "VERIFIED", "QUALITY_CHECK", "COMPLETE", "REJECTED"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${status === s ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            >
              {s || "All"}
            </button>
          ),
        )}
      </div>
      <ListPageTemplate
        columns={
          [
            {
              key: "grnNumber",
              header: "GRN #",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            { key: "warehouseId", header: "Warehouse" },
            {
              key: "receivedDate",
              header: "Received Date",
              render: (v) => new Date(String(v)).toLocaleDateString(),
            },
            {
              key: "supplierId",
              header: "Supplier",
              render: (v) => String(v ?? "—"),
            },
            {
              key: "totalCartons",
              header: "Cartons",
              render: (v) => String(v ?? "—"),
            },
            {
              key: "status",
              header: "Status",
              render: (v) => (
                <Badge label={String(v)} color={grnStatusColor(String(v))} />
              ),
            },
            {
              key: "vehicleNumber",
              header: "Vehicle",
              render: (v) => String(v ?? "—"),
            },
          ] as ListColumn[]
        }
        data={grns as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No GRNs found"
        emptyDescription="No goods received notes found."
      />
    </div>
  );
}

// ── Packing Tab ────────────────────────────────────────────────────────────
function PackingTab() {
  const apiFetch = useFrameworkFetch();
  const [sessions, setSessions] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    const qs = status ? `?status=${status}` : "";
    apiFetch(`/inventory/warehouse-ops/packing${qs}`)
      .then((d: any) => setSessions(d?.data ?? []))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "OPEN", "COMPLETE", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${status === s ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>
      <ListPageTemplate
        columns={
          [
            {
              key: "sessionNumber",
              header: "Session #",
              render: (v) => (
                <span className="font-mono text-xs">{String(v)}</span>
              ),
            },
            {
              key: "workerId",
              header: "Worker",
              render: (v) => String(v ?? "—"),
            },
            { key: "totalCartons", header: "Cartons" },
            {
              key: "totalWeight",
              header: "Total Weight",
              render: (v) => (v != null ? `${v} kg` : "—"),
            },
            {
              key: "status",
              header: "Status",
              render: (v) => (
                <Badge
                  label={String(v)}
                  color={packingStatusColor(String(v))}
                />
              ),
            },
            {
              key: "completedAt",
              header: "Completed At",
              render: (v) => (v ? new Date(String(v)).toLocaleString() : "—"),
            },
          ] as ListColumn[]
        }
        data={sessions as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No packing sessions found"
        emptyDescription="No packing sessions found."
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "tasks", label: "Task Queue" },
  { key: "bin-transfers", label: "Bin Transfers" },
  { key: "grn", label: "GRN" },
  { key: "packing", label: "Packing" },
];

export default function WarehouseOpsPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <RouteGuard permission="inventory.warehouse-ops.read">
      <div className="ui-page-shell">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Warehouse Operations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Task queue, bin transfers, goods receipt, and packing
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.key
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "tasks" && <TasksTab />}
        {tab === "bin-transfers" && <BinTransfersTab />}
        {tab === "grn" && <GrnTab />}
        {tab === "packing" && <PackingTab />}
      </div>
    </RouteGuard>
  );
}
