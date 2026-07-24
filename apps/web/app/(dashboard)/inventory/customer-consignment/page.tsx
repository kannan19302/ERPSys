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
  StatCardRow,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import {
  Plus,
  Eye,
  Minus,
  X,
  Handshake,
  Package,
  DollarSign,
  ArrowDown,
} from "lucide-react";

interface Consignment {
  id: string;
  customerId: string;
  productId: string;
  warehouseId: string;
  quantityOnHand: number;
  unitPrice: number;
  totalValue: number;
  maxQuantity: number;
  reorderPoint: number;
  status: string;
  lastConsumed: string | null;
  createdAt: string;
  customer?: { name: string };
  product?: { name: string; sku: string };
  warehouse?: { name: string; code: string };
}

interface DashboardStats {
  activeConsignments: number;
  totalValue: number;
  totalConsumed: number;
}

export default function CustomerConsignmentPage() {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    productId: "",
    warehouseId: "",
    quantityOnHand: 0,
    unitPrice: 0,
    maxQuantity: 0,
    reorderPoint: 0,
  });

  const [consumeOpen, setConsumeOpen] = useState(false);
  const [consumeTarget, setConsumeTarget] = useState<Consignment | null>(null);
  const [consuming, setConsuming] = useState(false);
  const [consumeForm, setConsumeForm] = useState({
    quantity: 0,
    totalValue: 0,
    reference: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, listRes] = await Promise.all([
        apiGet("/inventory/customer-consignment/dashboard"),
        apiGet(`/inventory/customer-consignment?page=${page}&limit=${limit}`),
      ]);
      setDashboard(dashRes as DashboardStats);
      const data = listRes as { data: Consignment[]; totalPages?: number };
      setConsignments(data.data || []);
      if (data.totalPages) setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load customer consignment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.productId || !form.warehouseId) return;
    setCreating(true);
    try {
      await apiPost("/inventory/customer-consignment", form);
      setCreateOpen(false);
      setForm({
        customerId: "",
        productId: "",
        warehouseId: "",
        quantityOnHand: 0,
        unitPrice: 0,
        maxQuantity: 0,
        reorderPoint: 0,
      });
      loadData();
    } catch {
      setError("Failed to create consignment.");
    } finally {
      setCreating(false);
    }
  };

  const handleRecordConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumeTarget || consumeForm.quantity <= 0) return;
    setConsuming(true);
    try {
      await apiPost(
        `/inventory/customer-consignment/${consumeTarget.id}/consume`,
        consumeForm,
      );
      setConsumeOpen(false);
      setConsumeTarget(null);
      setConsumeForm({ quantity: 0, totalValue: 0, reference: "" });
      loadData();
    } catch {
      setError("Failed to record consumption.");
    } finally {
      setConsuming(false);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await apiPatch(`/inventory/customer-consignment/${id}`, {
        status: "CLOSED",
      });
      loadData();
    } catch {
      setError("Failed to close consignment.");
    }
  };

  const columns: Column<Consignment>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (row) => row.customer?.name || row.customerId,
    },
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
      key: "warehouse",
      header: "Warehouse",
      render: (row) => row.warehouse?.name || row.warehouseId,
    },
    { key: "quantityOnHand", header: "On Hand" },
    {
      key: "unitPrice",
      header: "Unit Price",
      render: (row) => `$${Number(row.unitPrice).toFixed(2)}`,
    },
    {
      key: "totalValue",
      header: "Total Value",
      render: (row) => `$${Number(row.totalValue).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "lastConsumed",
      header: "Last Consumed",
      render: (row) =>
        row.lastConsumed
          ? new Date(row.lastConsumed).toLocaleDateString()
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="ui-hstack-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setConsumeTarget(row);
              setConsumeForm({
                quantity: 0,
                totalValue: 0,
                reference: "",
              });
              setConsumeOpen(true);
            }}
          >
            <Minus size={14} />
          </Button>
          {row.status === "ACTIVE" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClose(row.id);
              }}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading && consignments.length === 0) {
    return (
      <RouteGuard permission="inventory.customer-consignment.read">
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="inventory.customer-consignment.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Customer Consignment"
          description="Stock on customer premises with consumption tracking."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Inventory", href: "/inventory" },
            { label: "Customer Consignment" },
          ]}
          actions={
            <Button
              variant="primary"
              onClick={() => setCreateOpen(true)}
              className="ui-hstack-2"
            >
              <Plus size={14} /> New Consignment
            </Button>
          }
        />

        {error && <div className={styles.errorBox}>{error}</div>}

        {dashboard && (
          <StatCardRow
            stats={[
              {
                label: "Active Consignments",
                value: dashboard.activeConsignments,
                icon: <Handshake size={16} />,
                color: "var(--chart-1)",
                loading: false,
              },
              {
                label: "Total Value",
                value: `$${Number(dashboard.totalValue).toLocaleString()}`,
                icon: <DollarSign size={16} />,
                color: "var(--chart-2)",
                loading: false,
              },
              {
                label: "Total Consumed",
                value: Number(dashboard.totalConsumed).toLocaleString(),
                icon: <ArrowDown size={16} />,
                color: "var(--chart-3)",
                loading: false,
              },
            ]}
          />
        )}

        <DataTable
          columns={columns}
          data={consignments}
          rowKey={(r) => r.id}
          emptyTitle="No consignments found"
          emptyMessage="Create a new customer consignment to get started."
          emptyIcon={<Handshake size={48} />}
        />
        {totalPages > 1 && (
          <div style={{ marginTop: 16 }}>
            <Pagination page={page} pageCount={totalPages} onChange={setPage} />
          </div>
        )}

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Customer Consignment"
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
            <FormField label="Customer ID" required>
              <Input
                value={form.customerId}
                onChange={(e) =>
                  setForm({ ...form, customerId: e.target.value })
                }
                placeholder="Customer ID"
              />
            </FormField>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Product ID" required>
                <Input
                  value={form.productId}
                  onChange={(e) =>
                    setForm({ ...form, productId: e.target.value })
                  }
                  placeholder="Product ID"
                />
              </FormField>
              <FormField label="Warehouse ID" required>
                <Input
                  value={form.warehouseId}
                  onChange={(e) =>
                    setForm({ ...form, warehouseId: e.target.value })
                  }
                  placeholder="Warehouse ID"
                />
              </FormField>
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Quantity On Hand">
                <Input
                  type="number"
                  value={form.quantityOnHand}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantityOnHand: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </FormField>
              <FormField label="Unit Price">
                <Input
                  type="number"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unitPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </FormField>
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Max Quantity">
                <Input
                  type="number"
                  value={form.maxQuantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </FormField>
              <FormField label="Reorder Point">
                <Input
                  type="number"
                  value={form.reorderPoint}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reorderPoint: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </FormField>
            </div>
          </form>
        </Modal>

        <Modal
          open={consumeOpen}
          onClose={() => {
            setConsumeOpen(false);
            setConsumeTarget(null);
          }}
          title="Record Consumption"
          size="sm"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setConsumeOpen(false);
                  setConsumeTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRecordConsumption}
                disabled={consuming}
              >
                {consuming ? <Spinner size="sm" /> : "Record"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleRecordConsumption} className="ui-stack-4">
            {consumeTarget && (
              <div className={styles.consumeInfo}>
                Consuming from{" "}
                {consumeTarget.customer?.name || consumeTarget.customerId}
                {" — "}
                {consumeTarget.product?.name || consumeTarget.productId}
              </div>
            )}
            <FormField label="Quantity" required>
              <Input
                type="number"
                value={consumeForm.quantity}
                onChange={(e) =>
                  setConsumeForm({
                    ...consumeForm,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
              />
            </FormField>
            <FormField label="Total Value">
              <Input
                type="number"
                step="0.01"
                value={consumeForm.totalValue}
                onChange={(e) =>
                  setConsumeForm({
                    ...consumeForm,
                    totalValue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </FormField>
            <FormField label="Reference">
              <Input
                value={consumeForm.reference}
                onChange={(e) =>
                  setConsumeForm({
                    ...consumeForm,
                    reference: e.target.value,
                  })
                }
                placeholder="Invoice or delivery note"
              />
            </FormField>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
