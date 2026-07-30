// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  Badge,
  DataTable,
  type Column,
  Modal,
  TextField,
  KPICard,
  useToast,
  Select,
  FormField,
} from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface MaintenanceRequest {
  id: string;
  propertyId: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  vendorId?: string;
  estimatedCost?: number;
  actualCost: number;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  isBillable: boolean;
  createdAt: string;
  property?: { id: string; name: string };
  vendor?: { id: string; name: string };
}

interface MaintenanceStats {
  open: number;
  inProgress: number;
  completed: number;
  byPriority: { priority: string; _count: number }[];
  byCategory: { category: string; _count: number }[];
}

export default function MaintenanceRequestsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [items, setItems] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    propertyId: "",
    title: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
    vendorId: "",
    estimatedCost: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      const [r, s] = await Promise.all([
        client.get<{ data?: MaintenanceRequest[] }>(
          "/ext/real-estate/maintenance-requests?limit=100",
        ),
        client.get<MaintenanceStats>(
          "/ext/real-estate/maintenance-requests/stats",
        ),
      ]);
      setItems(Array.isArray(r) ? r : r.data || []);
      setStats(s || null);
    } catch (err) {
      notifyError(
        "Failed to load data",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client, notifyError]);

  const handleCreate = async () => {
    if (!form.propertyId || !form.title) return;
    setCreating(true);
    try {
      await client.post("/ext/real-estate/maintenance-requests", {
        ...form,
        estimatedCost: form.estimatedCost
          ? parseFloat(form.estimatedCost)
          : null,
      });
      setCreateOpen(false);
      setForm({
        propertyId: "",
        title: "",
        description: "",
        category: "GENERAL",
        priority: "MEDIUM",
        vendorId: "",
        estimatedCost: "",
        notes: "",
      });
      await loadData();
    } catch (err) {
      notifyError(
        "Failed to create request",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await client.put(`/ext/real-estate/maintenance-requests/${id}`, {
        status,
      });
      await loadData();
    } catch {
      notifyError("Failed to update", "");
    }
  };

  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "title",
      header: "Request",
      render: (r) => (
        <div>
          <span className="ui-heading-sm">{r.title}</span>
          <div className="ui-text-xs-tertiary">
            {r.property?.name || r.propertyId.slice(0, 8)} · {r.category}
          </div>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (r) => (
        <Badge
          variant={
            r.priority === "EMERGENCY"
              ? "danger"
              : r.priority === "HIGH"
                ? "warning"
                : r.priority === "URGENT"
                  ? "warning"
                  : "info"
          }
        >
          {r.priority}
        </Badge>
      ),
    },
    {
      key: "cost",
      header: "Cost",
      render: (r) => <span>${Number(r.actualCost || 0).toLocaleString()}</span>,
    },
    {
      key: "scheduled",
      header: "Scheduled",
      render: (r) => (
        <span className="text-xs">
          {r.scheduledDate
            ? new Date(r.scheduledDate).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (r) => (
        <Badge variant="info">{r.vendor?.name || "Unassigned"}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.status === "COMPLETED"
              ? "success"
              : r.status === "IN_PROGRESS"
                ? "warning"
                : r.status === "OPEN"
                  ? "info"
                  : "default"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <select
          className="ui-input-sm"
          value={r.status}
          onChange={(e) => handleStatusChange(r.id, e.target.value)}
        >
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      ),
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="real-estate.maintenance-request.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Maintenance Requests"
          description="Property maintenance request tracking"
          breadcrumbs={[
            { label: "Real Estate", href: "/real-estate" },
            { label: "Maintenance Requests" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> New Request
            </Button>
          }
        />
        <div className="ui-grid-auto">
          <KPICard
            title="Open"
            value={stats?.open || 0}
            icon={<AlertTriangle size={18} />}
            color="var(--color-warning)"
          />
          <KPICard
            title="In Progress"
            value={stats?.inProgress || 0}
            icon={<Clock size={18} />}
            color="var(--color-info)"
          />
          <KPICard
            title="Completed"
            value={stats?.completed || 0}
            icon={<CheckCircle size={18} />}
            color="var(--color-success)"
          />
          <KPICard
            title="Total"
            value={items.length}
            icon={<Wrench size={18} />}
            color="var(--color-primary)"
          />
        </div>
        <Card padding="none">
          <DataTable
            columns={columns}
            data={items}
            rowKey={(r) => r.id}
            emptyTitle="No maintenance requests"
            emptyMessage="Create maintenance requests for properties."
            emptyIcon={<Wrench size={48} />}
          />
        </Card>
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Maintenance Request"
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
                {creating ? "Saving..." : "Create"}
              </Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField
              label="Property ID"
              required
              value={form.propertyId}
              onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
            />
            <TextField
              label="Title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Category">
                <Select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="GENERAL">General</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="HVAC">HVAC</option>
                  <option value="APPLIANCE">Appliance</option>
                  <option value="STRUCTURAL">Structural</option>
                  <option value="PEST">Pest Control</option>
                </Select>
              </FormField>
              <FormField label="Priority">
                <Select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EMERGENCY">Emergency</option>
                </Select>
              </FormField>
            </div>
            <TextField
              label="Vendor ID"
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
            />
            <TextField
              label="Estimated Cost ($)"
              type="number"
              value={form.estimatedCost}
              onChange={(e) =>
                setForm({ ...form, estimatedCost: e.target.value })
              }
            />
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
