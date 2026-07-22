"use client";
import { useState, useEffect } from "react";
import {
  Card,
  ListPageTemplate,
  type ListColumn,
  StatCardRow,
} from "@unerp/ui";
import { Users, Clock, TrendingUp, Calendar } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { Package as InventoryModuleIcon } from "lucide-react";
interface LaborDashboard {
  period: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  byTaskType: {
    taskType: string;
    count: number;
    avgEfficiencyPct: number | null;
  }[];
  topWorkers: {
    workerId: string;
    workerName: string;
    completedTasks: number;
    avgEfficiencyPct: number | null;
  }[];
}

interface LaborStandard {
  id: string;
  taskType: string;
  description: string | null;
  standardMins: number;
  warehouseId: string | null;
  isActive: boolean;
}

interface ShiftTemplate {
  id: string;
  shiftName: string;
  warehouseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  headcount: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LaborManagementPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<"dashboard" | "standards" | "shifts">(
    "dashboard",
  );
  const [dashboard, setDashboard] = useState<LaborDashboard | null>(null);
  const [standards, setStandards] = useState<LaborStandard[]>([]);
  const [shifts, setShifts] = useState<ShiftTemplate[]>([]);
  const [showStandardForm, setShowStandardForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchStandards();
    fetchShifts();
  }, []);

  async function fetchDashboard() {
    setDashboard(
      await client.get<LaborDashboard>("/inventory/labor/dashboard"),
    );
  }

  async function fetchStandards() {
    setStandards(
      await client.get<LaborStandard[]>("/inventory/labor/standards"),
    );
  }

  async function fetchShifts() {
    setShifts(
      await client.get<ShiftTemplate[]>("/inventory/labor/shift-templates"),
    );
  }

  async function createStandard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await client.post("/inventory/labor/standards", {
      taskType: fd.get("taskType"),
      description: fd.get("description") || undefined,
      standardMins: parseFloat(fd.get("standardMins") as string),
    });
    setLoading(false);
    setShowStandardForm(false);
    fetchStandards();
  }

  async function createShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await client.post("/inventory/labor/shift-templates", {
      warehouseId: fd.get("warehouseId"),
      shiftName: fd.get("shiftName"),
      dayOfWeek: parseInt(fd.get("dayOfWeek") as string),
      startTime: fd.get("startTime"),
      endTime: fd.get("endTime"),
      headcount: parseInt(fd.get("headcount") as string) || 1,
    });
    setLoading(false);
    setShowShiftForm(false);
    fetchShifts();
  }

  async function deleteStandard(id: string) {
    await client.delete(`/inventory/labor/standards/${id}`);
    fetchStandards();
  }

  const taskTypeColumns: ListColumn[] = [
    { key: "taskType", header: "Type" },
    { key: "count", header: "Count" },
    {
      key: "avgEfficiencyPct",
      header: "Avg Efficiency",
      render: (row) => {
        const r = row as unknown as { avgEfficiencyPct: number | null };
        return r.avgEfficiencyPct != null
          ? `${Math.round(Number(r.avgEfficiencyPct))}%`
          : "—";
      },
    },
  ];

  const topWorkerColumns: ListColumn[] = [
    { key: "workerName", header: "Worker" },
    { key: "completedTasks", header: "Tasks" },
    {
      key: "avgEfficiencyPct",
      header: "Efficiency",
      render: (row) => {
        const w = row as unknown as { avgEfficiencyPct: number | null };
        return w.avgEfficiencyPct != null
          ? `${Math.round(Number(w.avgEfficiencyPct))}%`
          : "—";
      },
    },
  ];

  const standardsColumns: ListColumn[] = [
    { key: "taskType", header: "Task Type" },
    {
      key: "standardMins",
      header: "Std Minutes",
      render: (row) =>
        Number((row as unknown as LaborStandard).standardMins).toFixed(1),
    },
    {
      key: "description",
      header: "Description",
      render: (row) =>
        String((row as unknown as LaborStandard).description ?? "—"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const s = row as unknown as LaborStandard;
        return (
          <button
            onClick={() => deleteStandard(s.id)}
            className="text-destructive hover:underline text-xs"
          >
            Delete
          </button>
        );
      },
    },
  ];

  const shiftsColumns: ListColumn[] = [
    { key: "shiftName", header: "Shift" },
    {
      key: "dayOfWeek",
      header: "Day",
      render: (row) => DAY_NAMES[(row as unknown as ShiftTemplate).dayOfWeek],
    },
    {
      key: "hours",
      header: "Hours",
      render: (row) => {
        const s = row as unknown as ShiftTemplate;
        return `${s.startTime}–${s.endTime}`;
      },
    },
    { key: "headcount", header: "Headcount" },
  ];

  return (
    <RouteGuard permission="inventory.labor-management.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Manage inventory operations for this workspace."
      >
        <div className="ui-page-shell">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Labor Management</h1>
              <p className="text-sm text-muted-foreground">
                Warehouse workforce productivity and shift planning
              </p>
            </div>
          </div>

          {/* Stat Tiles */}
          {dashboard && (
            <StatCardRow
              stats={[
                { label: "Total Tasks (7d)", value: dashboard.totalTasks },
                { label: "Completed", value: dashboard.completedTasks },
                {
                  label: "Completion Rate",
                  value: `${dashboard.completionRate}%`,
                },
                {
                  label: "Task Types Active",
                  value: dashboard.byTaskType.length,
                },
              ]}
            />
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b">
            {(["dashboard", "standards", "shifts"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "dashboard"
                  ? "Productivity"
                  : t === "standards"
                    ? "Labor Standards"
                    : "Shift Templates"}
              </button>
            ))}
          </div>

          {/* Dashboard Tab */}
          {tab === "dashboard" && dashboard && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">By Task Type</h3>
                <ListPageTemplate
                  columns={taskTypeColumns}
                  data={
                    dashboard.byTaskType as unknown as Record<string, unknown>[]
                  }
                  loading={false}
                  searchable
                />
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Top Workers (7d)</h3>
                <ListPageTemplate
                  columns={topWorkerColumns}
                  data={
                    dashboard.topWorkers as unknown as Record<string, unknown>[]
                  }
                  loading={false}
                  searchable
                />
              </Card>
            </div>
          )}

          {/* Standards Tab */}
          {tab === "standards" && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Labor Standards</h3>
                <button
                  onClick={() => setShowStandardForm(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                >
                  + Add Standard
                </button>
              </div>
              <ListPageTemplate
                columns={standardsColumns}
                data={standards as unknown as Record<string, unknown>[]}
                loading={false}
                searchable
              />
            </Card>
          )}

          {/* Shifts Tab */}
          {tab === "shifts" && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Shift Templates</h3>
                <button
                  onClick={() => setShowShiftForm(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                >
                  + Add Shift
                </button>
              </div>
              <ListPageTemplate
                columns={shiftsColumns}
                data={shifts as unknown as Record<string, unknown>[]}
                loading={false}
                searchable
              />
            </Card>
          )}

          {/* Create Standard Modal */}
          {showStandardForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-md">
                <h3 className="font-semibold mb-4">Add Labor Standard</h3>
                <form onSubmit={createStandard} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Task Type</label>
                    <select
                      name="taskType"
                      required
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    >
                      {[
                        "PICK",
                        "PACK",
                        "RECEIVE",
                        "PUTAWAY",
                        "CYCLE_COUNT",
                        "TRANSFER",
                        "LABEL",
                        "SORT",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Standard Minutes
                    </label>
                    <input
                      name="standardMins"
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <input
                      name="description"
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowStandardForm(false)}
                      className="px-3 py-1.5 border rounded text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* Create Shift Modal */}
          {showShiftForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-md">
                <h3 className="font-semibold mb-4">Add Shift Template</h3>
                <form onSubmit={createShift} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Shift Name</label>
                    <input
                      name="shiftName"
                      required
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Warehouse ID</label>
                    <input
                      name="warehouseId"
                      required
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Day of Week</label>
                    <select
                      name="dayOfWeek"
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    >
                      {DAY_NAMES.map((d, i) => (
                        <option key={i} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Start Time</label>
                      <input
                        name="startTime"
                        type="time"
                        required
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Time</label>
                      <input
                        name="endTime"
                        type="time"
                        required
                        className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Headcount</label>
                    <input
                      name="headcount"
                      type="number"
                      min="1"
                      defaultValue="1"
                      className="mt-1 w-full border rounded px-2 py-1.5 text-sm bg-background"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowShiftForm(false)}
                      className="px-3 py-1.5 border rounded text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
