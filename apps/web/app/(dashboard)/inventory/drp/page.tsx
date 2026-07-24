"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  StatusBadge,
  Modal,
  FormField,
  Input,
  DataTable,
  Pagination,
  type Column,
  Card,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { apiGet, apiPost } from "@/lib/api";
import {
  Plus,
  Play,
  Eye,
  GitBranch,
  Package,
  Calendar,
  BarChart3,
} from "lucide-react";

interface DrpRun {
  id: string;
  runNumber: string;
  status: string;
  horizonDays: number;
  startDate: string;
  endDate: string;
  includeWarehouses: string[];
  createdAt: string;
}

interface DrpPlan {
  id: string;
  runId: string;
  productId: string;
  sourceWarehouseId: string;
  destWarehouseId: string;
  forecastDemand: number;
  projectedStock: number;
  suggestedTransfer: number;
  suggestedPO: number;
  priority: string;
  product?: { name: string; sku: string };
  sourceWarehouse?: { name: string };
  destWarehouse?: { name: string };
}

export default function DrpPlanningPage() {
  const [runs, setRuns] = useState<DrpRun[]>([]);
  const [plans, setPlans] = useState<DrpPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runsPage, setRunsPage] = useState(1);
  const [runsTotalPages, setRunsTotalPages] = useState(1);
  const [plansPage, setPlansPage] = useState(1);
  const [plansTotalPages, setPlansTotalPages] = useState(1);
  const limit = 20;

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    runNumber: "",
    horizonDays: 30,
    startDate: "",
    endDate: "",
    includeWarehouses: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [runsRes, plansRes] = await Promise.all([
        apiGet(`/inventory/drp/runs?page=${runsPage}&limit=${limit}`),
        apiGet(`/inventory/drp/plans?page=${plansPage}&limit=${limit}`),
      ]);
      const runsData = runsRes as { data: DrpRun[]; totalPages?: number };
      const plansData = plansRes as { data: DrpPlan[]; totalPages?: number };
      setRuns(runsData.data || []);
      if (runsData.totalPages) setRunsTotalPages(runsData.totalPages);
      setPlans(plansData.data || []);
      if (plansData.totalPages) setPlansTotalPages(plansData.totalPages);
    } catch {
      setError("Failed to load DRP data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [runsPage, plansPage]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.runNumber || !form.startDate || !form.endDate) return;
    setCreating(true);
    try {
      await apiPost("/inventory/drp/runs", {
        ...form,
        includeWarehouses: form.includeWarehouses
          ? form.includeWarehouses.split(",").map((s) => s.trim())
          : [],
      });
      setCreateOpen(false);
      setForm({
        runNumber: "",
        horizonDays: 30,
        startDate: "",
        endDate: "",
        includeWarehouses: "",
      });
      loadData();
    } catch {
      setError("Failed to create DRP run.");
    } finally {
      setCreating(false);
    }
  };

  const handleExecuteRun = async (id: string) => {
    try {
      await apiPost(`/inventory/drp/runs/${id}/execute`, {});
      loadData();
    } catch {
      setError("Failed to execute DRP run.");
    }
  };

  const runColumns: Column<DrpRun>[] = [
    { key: "runNumber", header: "Run Number" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "horizonDays",
      header: "Horizon",
      render: (row) => `${row.horizonDays} days`,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (row) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      key: "endDate",
      header: "End Date",
      render: (row) => new Date(row.endDate).toLocaleDateString(),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="ui-hstack-2">
          {row.status === "DRAFT" && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleExecuteRun(row.id);
              }}
            >
              <Play size={12} /> Execute
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const planColumns: Column<DrpPlan>[] = [
    {
      key: "product",
      header: "Product",
      render: (row) => (
        <div>
          <span className="ui-heading-sm">
            {row.product?.name || row.productId}
          </span>
          <div className="ui-text-xs-tertiary">{row.product?.sku}</div>
        </div>
      ),
    },
    {
      key: "sourceWarehouse",
      header: "Source Warehouse",
      render: (row) => row.sourceWarehouse?.name || row.sourceWarehouseId,
    },
    {
      key: "destWarehouse",
      header: "Dest Warehouse",
      render: (row) => row.destWarehouse?.name || row.destWarehouseId,
    },
    { key: "forecastDemand", header: "Forecast Demand" },
    { key: "projectedStock", header: "Projected Stock" },
    {
      key: "suggestedTransfer",
      header: "Suggested Transfer",
    },
    { key: "suggestedPO", header: "Suggested PO" },
    {
      key: "priority",
      header: "Priority",
      render: (row) => <StatusBadge status={row.priority} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <Eye size={14} />
        </Button>
      ),
    },
  ];

  if (loading && runs.length === 0 && plans.length === 0) {
    return (
      <RouteGuard permission="inventory.drp.read">
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="inventory.drp.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Distribution Planning"
          description="Distribution Requirements Planning — runs and generated plans."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Inventory", href: "/inventory" },
            { label: "DRP Planning" },
          ]}
          actions={
            <Button
              variant="primary"
              onClick={() => setCreateOpen(true)}
              className="ui-hstack-2"
            >
              <Plus size={14} /> New Run
            </Button>
          }
        />

        {error && <div className={styles.errorBox}>{error}</div>}

        <Card padding="none">
          <div className={styles.sectionHeader}>
            <Calendar size={16} /> Plan Runs
          </div>
          <DataTable
            columns={runColumns}
            data={runs}
            rowKey={(r) => r.id}
            emptyTitle="No runs"
            emptyMessage="Create a new DRP run to start planning."
            emptyIcon={<GitBranch size={48} />}
          />
          {runsTotalPages > 1 && (
            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <Pagination
                page={runsPage}
                pageCount={runsTotalPages}
                onChange={setRunsPage}
              />
            </div>
          )}
        </Card>

        <Card padding="none">
          <div className={styles.sectionHeader}>
            <BarChart3 size={16} /> Plans
          </div>
          <DataTable
            columns={planColumns}
            data={plans}
            rowKey={(r) => r.id}
            emptyTitle="No plans"
            emptyMessage="Execute a DRP run to generate plans."
            emptyIcon={<BarChart3 size={48} />}
          />
          {plansTotalPages > 1 && (
            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <Pagination
                page={plansPage}
                pageCount={plansTotalPages}
                onChange={setPlansPage}
              />
            </div>
          )}
        </Card>

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New DRP Run"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? <Spinner size="sm" /> : "Create"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreate} className="ui-stack-4">
            <FormField label="Run Number" required>
              <Input
                value={form.runNumber}
                onChange={(e) =>
                  setForm({ ...form, runNumber: e.target.value })
                }
                placeholder="DRP-2026-001"
              />
            </FormField>
            <FormField label="Horizon (Days)">
              <Input
                type="number"
                value={form.horizonDays}
                onChange={(e) =>
                  setForm({
                    ...form,
                    horizonDays: parseInt(e.target.value) || 0,
                  })
                }
              />
            </FormField>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Start Date" required>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </FormField>
              <FormField label="End Date" required>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </FormField>
            </div>
            <FormField label="Include Warehouses (comma-separated IDs)">
              <Input
                value={form.includeWarehouses}
                onChange={(e) =>
                  setForm({ ...form, includeWarehouses: e.target.value })
                }
                placeholder="wh-001, wh-002"
              />
            </FormField>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
