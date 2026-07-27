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
import { Package, Plus, CheckCircle, AlertTriangle, Truck } from "lucide-react";

interface PartRequest {
  id: string;
  technicianId: string;
  itemId: string;
  itemName: string;
  partNumber?: string;
  quantityRequested: number;
  quantityApproved?: number;
  quantityFulfilled?: number;
  source: string;
  priority: string;
  status: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  createdAt: string;
  technician?: { id: string; name: string };
  ticket?: { id: string; title: string };
}

export default function PartsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"requests" | "stock">("requests");
  const [form, setForm] = useState({
    technicianId: "",
    ticketId: "",
    itemId: "",
    itemName: "",
    partNumber: "",
    quantityRequested: "1",
    source: "WAREHOUSE",
    priority: "MEDIUM",
    unitPrice: "0",
    notes: "",
  });

  const loadData = async () => {
    try {
      const r = await client.get<{ data?: PartRequest[] }>(
        "/ext/field-service/part-requests?limit=100",
      );
      setRequests(Array.isArray(r) ? r : r.data || []);
    } catch (err) {
      notifyError(
        "Failed to load parts",
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
    if (!form.technicianId || !form.itemId || !form.itemName) return;
    setCreating(true);
    try {
      await client.post("/ext/field-service/part-requests", {
        ...form,
        quantityRequested: parseInt(form.quantityRequested),
        unitPrice: parseFloat(form.unitPrice),
        totalPrice:
          parseInt(form.quantityRequested) * parseFloat(form.unitPrice),
        ticketId: form.ticketId || null,
      });
      setCreateOpen(false);
      setForm({
        technicianId: "",
        ticketId: "",
        itemId: "",
        itemName: "",
        partNumber: "",
        quantityRequested: "1",
        source: "WAREHOUSE",
        priority: "MEDIUM",
        unitPrice: "0",
        notes: "",
      });
      await loadData();
    } catch (err) {
      notifyError(
        "Failed to create part request",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await client.post(`/ext/field-service/part-requests/${id}/approve`, {});
      await loadData();
    } catch {
      notifyError("Failed to approve", "");
    }
  };

  const columns: Column<PartRequest>[] = [
    {
      key: "item",
      header: "Part",
      render: (r) => (
        <div>
          <span className="ui-heading-sm">{r.itemName}</span>
          <div className="ui-text-xs-tertiary">
            {r.partNumber || "—"} ·{" "}
            {r.technician?.name || r.technicianId.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      render: (r) => (
        <span>
          {r.quantityRequested}
          {r.quantityApproved ? ` / ${r.quantityApproved}` : ""}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (r) => <Badge variant="info">{r.source}</Badge>,
    },
    {
      key: "priority",
      header: "Priority",
      render: (r) => (
        <Badge
          variant={
            r.priority === "HIGH" || r.priority === "URGENT"
              ? "warning"
              : "info"
          }
        >
          {r.priority}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.status === "FULFILLED"
              ? "success"
              : r.status === "APPROVED"
                ? "info"
                : r.status === "REJECTED"
                  ? "danger"
                  : "warning"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "PENDING" ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleApprove(r.id)}
          >
            <CheckCircle size={14} /> Approve
          </Button>
        ) : null,
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;

  return (
    <RouteGuard permission="field-service.part-request.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Parts & Inventory"
          description="Part requests and van stock management"
          breadcrumbs={[
            { label: "Field Service", href: "/field-service" },
            { label: "Parts" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> Request Part
            </Button>
          }
        />
        <div className="ui-grid-auto">
          <KPICard
            title="Pending"
            value={pendingCount}
            icon={<AlertTriangle size={18} />}
            color="var(--color-warning)"
          />
          <KPICard
            title="Approved"
            value={approvedCount}
            icon={<CheckCircle size={18} />}
            color="var(--color-info)"
          />
          <KPICard
            title="Total Requests"
            value={requests.length}
            icon={<Package size={18} />}
            color="var(--color-primary)"
          />
        </div>
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "requests" ? "primary" : "secondary"}
            onClick={() => setTab("requests")}
          >
            Part Requests
          </Button>
          <a href="/field-service/van-stock">
            <Button variant={tab === "stock" ? "primary" : "secondary"}>
              Van Stock
            </Button>
          </a>
        </div>
        <Card padding="none">
          <DataTable
            columns={columns}
            data={requests}
            rowKey={(r) => r.id}
            emptyTitle="No part requests"
            emptyMessage="Create part requests for technicians."
            emptyIcon={<Package size={48} />}
          />
        </Card>
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Part Request"
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
              label="Technician ID"
              required
              value={form.technicianId}
              onChange={(e) =>
                setForm({ ...form, technicianId: e.target.value })
              }
            />
            <TextField
              label="Ticket ID"
              value={form.ticketId}
              onChange={(e) => setForm({ ...form, ticketId: e.target.value })}
            />
            <TextField
              label="Item ID"
              required
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            />
            <TextField
              label="Item Name"
              required
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
            />
            <div className="ui-grid-2 ui-gap-3">
              <TextField
                label="Part #"
                value={form.partNumber}
                onChange={(e) =>
                  setForm({ ...form, partNumber: e.target.value })
                }
              />
              <TextField
                label="Quantity"
                type="number"
                value={form.quantityRequested}
                onChange={(e) =>
                  setForm({ ...form, quantityRequested: e.target.value })
                }
              />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Source">
                <Select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                >
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="VAN">Van</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="CUSTOMER">Customer</option>
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
                </Select>
              </FormField>
            </div>
            <TextField
              label="Unit Price ($)"
              type="number"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
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
