"use client";
import { useState, useEffect, useCallback } from "react";
import {
  DataTable,
  PageHeader,
  Button,
  Spinner,
  StatusBadge,
  Modal,
  FormField,
  Input,
  Card,
  useToast,
  type Column,
  type SortOrder,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { apiGet, apiPost, apiPatch } from "../../../../src/lib/api";
import {
  Layers,
  Plus,
  ArrowLeftRight,
  X,
  Warehouse,
  Edit,
  Trash2,
} from "lucide-react";
import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";

interface Subinventory {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  warehouse?: { id: string; name: string } | null;
  type: string;
  description: string | null;
  status: string;
  createdAt: string;
}

interface DashboardSummary {
  totalSubinventories: number;
  byType: Record<string, number>;
}

interface WarehouseOption {
  id: string;
  name: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SubinventoryPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [subinventories, setSubinventories] = useState<Subinventory[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formType, setFormType] = useState("STORAGE");
  const [formDescription, setFormDescription] = useState("");

  const [fromSubinventoryId, setFromSubinventoryId] = useState("");
  const [toSubinventoryId, setToSubinventoryId] = useState("");
  const [transferProductId, setTransferProductId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("1");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, dashRes, whRes] = await Promise.all([
        apiGet<PaginatedResponse<Subinventory>>(
          `/inventory/subinventory?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`
        ),
        apiGet<DashboardSummary>("/inventory/subinventory/dashboard"),
        apiGet<WarehouseOption[]>("/inventory/warehouses?select=id,name"),
      ]);
      setSubinventories(
        Array.isArray(subRes) ? subRes : subRes?.data || []
      );
      setTotalPages(subRes?.totalPages || 1);
      setDashboard(dashRes);
      setWarehouses(Array.isArray(whRes) ? whRes : whRes || []);
    } catch (err) {
      setError("Could not load subinventory data. Please try again.");
      toast.error(
        "Could not load subinventory data",
        err instanceof Error ? err.message : undefined
      );
      setSubinventories([]);
      setDashboard({ totalSubinventories: 0, byType: {} });
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/inventory/subinventory", {
        code: formCode,
        name: formName,
        warehouseId: formWarehouseId,
        type: formType,
        description: formDescription || undefined,
      });
      setModalSuccess(true);
      toast.success("Subinventory created", `"${formName}" has been added.`);
      setTimeout(() => {
        setShowCreateModal(false);
        resetForm();
        loadData();
      }, 1200);
    } catch (err) {
      toast.error(
        "Could not create subinventory",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/inventory/subinventory/transfer", {
        fromSubinventoryId,
        toSubinventoryId,
        productId: transferProductId,
        quantity: parseInt(transferQuantity, 10),
      });
      setModalSuccess(true);
      toast.success("Stock transfer initiated");
      setTimeout(() => {
        setShowTransferModal(false);
        resetTransferForm();
        loadData();
      }, 1200);
    } catch (err) {
      toast.error(
        "Could not transfer stock",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (sub: Subinventory) => {
    if (
      !window.confirm(
        `Deactivate subinventory "${sub.name}"? It can be re-enabled later.`
      )
    )
      return;
    try {
      await apiPatch(`/inventory/subinventory/${sub.id}`, {
        status: "INACTIVE",
      });
      toast.success("Subinventory deactivated");
      loadData();
    } catch (err) {
      toast.error(
        "Could not deactivate subinventory",
        err instanceof Error ? err.message : undefined
      );
    }
  };

  const handleEdit = async (sub: Subinventory) => {
    try {
      const res = await apiPatch(`/inventory/subinventory/${sub.id}`, {
        name: sub.name,
        description: sub.description,
      });
      toast.success("Subinventory updated");
      loadData();
    } catch (err) {
      toast.error(
        "Could not update subinventory",
        err instanceof Error ? err.message : undefined
      );
    }
  };

  const handleSortChange = (key: string, order: SortOrder) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const resetForm = () => {
    setFormCode("");
    setFormName("");
    setFormWarehouseId("");
    setFormType("STORAGE");
    setFormDescription("");
    setModalSuccess(false);
  };

  const resetTransferForm = () => {
    setFromSubinventoryId("");
    setToSubinventoryId("");
    setTransferProductId("");
    setTransferQuantity("1");
    setModalSuccess(false);
  };

  const byTypeEntries = dashboard
    ? Object.entries(dashboard.byType).sort((a, b) => b[1] - a[1])
    : [];

  const typeVariants: Record<string, "active" | "info" | "warning" | "default"> = {
    STORAGE: "active",
    RECEIVING: "info",
    SHIPPING: "info",
    QUARANTINE: "warning",
    SCRAP: "default",
  };

  const columns: Column<Subinventory>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (s) => (
        <span className="font-mono text-xs font-semibold">{s.code}</span>
      ),
    },
    { key: "name", header: "Name", sortable: true },
    {
      key: "warehouse",
      header: "Warehouse",
      sortable: false,
      render: (s) =>
        s.warehouse?.name || <span className="ui-text-muted">—</span>,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (s) => (
        <StatusBadge
          variant={typeVariants[s.type] || "default"}
          label={s.type}
        />
      ),
    },
    {
      key: "description",
      header: "Description",
      sortable: false,
      render: (s) =>
        s.description || <span className="ui-text-muted">—</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (s) => (
        <StatusBadge
          variant={s.status === "ACTIVE" ? "active" : "inactive"}
          label={s.status}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (s) => (
        <div className="ui-hstack-2">
          <button
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(s);
            }}
            className="ui-btn-icon ui-text-muted"
          >
            <Edit size={15} />
          </button>
          {s.status === "ACTIVE" && (
            <button
              title="Deactivate"
              onClick={(e) => {
                e.stopPropagation();
                handleDeactivate(s);
              }}
              className="ui-btn-icon"
              style={{ color: "var(--color-danger)" }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <RouteGuard permission="inventory.subinventory.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={Layers}
        moduleDescription="Manage subinventories, storage zones, and inter-zone stock transfers."
      >
        <div className="ui-stack-6 ui-animate-in">
          <PageHeader
            title="Subinventories"
            description="Manage subinventory zones within warehouses and transfer stock between them."
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Inventory", href: "/inventory" },
              { label: "Subinventories" },
            ]}
            actions={
              <div className="ui-hstack-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    resetTransferForm();
                    setShowTransferModal(true);
                  }}
                  className="ui-hstack-2"
                >
                  <ArrowLeftRight size={16} />
                  <span>Transfer Stock</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="ui-hstack-2"
                >
                  <Plus size={16} />
                  <span>New Subinventory</span>
                </Button>
              </div>
            }
          />

          {error && (
            <div className="subinv-error-banner">
              <Warehouse size={16} /> {error}
            </div>
          )}

          <div className="subinv-kpi-grid">
            <Card>
              <div className="subinv-kpi-card-inner">
                <div className="subinv-kpi-icon-wrapper">
                  <Layers size={20} />
                </div>
                <div>
                  <div className="subinv-kpi-label">Total Subinventories</div>
                  <div className="subinv-kpi-value">
                    {dashboard?.totalSubinventories ?? 0}
                  </div>
                </div>
              </div>
            </Card>
            {byTypeEntries.slice(0, 3).map(([type, count]) => (
              <Card key={type}>
                <div className="subinv-kpi-card-inner">
                  <div className="subinv-kpi-icon-wrapper">
                    <Warehouse size={20} />
                  </div>
                  <div>
                    <div className="subinv-kpi-label">{type}</div>
                    <div className="subinv-kpi-value">{count}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            {loading ? (
              <div className="ui-center-pad">
                <Spinner size="lg" />
              </div>
            ) : subinventories.length === 0 ? (
              <div className="ui-empty-state">
                <Layers size={48} className="ui-hr-faded" />
                <div className="font-semibold">No Subinventories Found</div>
                <div className="text-sm">
                  Create a subinventory to organize warehouse zones.
                </div>
              </div>
            ) : (
              <>
                <DataTable<Subinventory>
                  columns={columns}
                  data={subinventories}
                  rowKey={(s) => s.id}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />
                {totalPages > 1 && (
                  <div className="subinv-pagination">
                    <span className="text-sm ui-text-muted">
                      Page {page} of {totalPages}
                    </span>
                    <div className="ui-hstack-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        <Modal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="New Subinventory"
        >
          {modalSuccess ? (
            <div className="subinv-modal-success">
              <Layers size={48} className="subinv-modal-success-icon" />
              <div className="ui-heading-base">
                Subinventory Created Successfully
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="subinv-form">
              <FormField label="Warehouse" required>
                <select
                  required
                  value={formWarehouseId}
                  onChange={(e) => setFormWarehouseId(e.target.value)}
                  className="ui-input"
                  style={{
                    width: "100%",
                    height: "38px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0 var(--space-3)",
                  }}
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="ui-grid-2">
                <FormField label="Code" required>
                  <Input
                    required
                    placeholder="e.g. WH01-RECV"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                  />
                </FormField>
                <FormField label="Name" required>
                  <Input
                    required
                    placeholder="e.g. Receiving Zone"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Type" required>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="ui-input"
                  style={{
                    width: "100%",
                    height: "38px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0 var(--space-3)",
                  }}
                >
                  <option value="STORAGE">Storage</option>
                  <option value="RECEIVING">Receiving</option>
                  <option value="SHIPPING">Shipping</option>
                  <option value="QUARANTINE">Quarantine</option>
                  <option value="SCRAP">Scrap</option>
                </select>
              </FormField>
              <FormField label="Description (optional)">
                <Input
                  placeholder="Purpose of this subinventory zone"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </FormField>
              <div className="subinv-form-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Subinventory"}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        <Modal
          open={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            resetTransferForm();
          }}
          title="Transfer Stock"
        >
          {modalSuccess ? (
            <div className="subinv-modal-success">
              <ArrowLeftRight
                size={48}
                className="subinv-modal-success-icon"
              />
              <div className="ui-heading-base">
                Stock Transfer Initiated
              </div>
            </div>
          ) : (
            <form onSubmit={handleTransfer} className="subinv-form">
              <FormField label="From Subinventory" required>
                <select
                  required
                  value={fromSubinventoryId}
                  onChange={(e) => setFromSubinventoryId(e.target.value)}
                  className="ui-input"
                  style={{
                    width: "100%",
                    height: "38px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0 var(--space-3)",
                  }}
                >
                  <option value="">Select source</option>
                  {subinventories
                    .filter((s) => s.status === "ACTIVE")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              </FormField>
              <FormField label="To Subinventory" required>
                <select
                  required
                  value={toSubinventoryId}
                  onChange={(e) => setToSubinventoryId(e.target.value)}
                  className="ui-input"
                  style={{
                    width: "100%",
                    height: "38px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0 var(--space-3)",
                  }}
                >
                  <option value="">Select destination</option>
                  {subinventories
                    .filter((s) => s.status === "ACTIVE")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              </FormField>
              <div className="ui-grid-2">
                <FormField label="Product ID" required>
                  <Input
                    required
                    placeholder="Product SKU or ID"
                    value={transferProductId}
                    onChange={(e) => setTransferProductId(e.target.value)}
                  />
                </FormField>
                <FormField label="Quantity" required>
                  <Input
                    required
                    type="number"
                    min="1"
                    placeholder="1"
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(e.target.value)}
                  />
                </FormField>
              </div>
              <div className="subinv-form-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowTransferModal(false);
                    resetTransferForm();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? "Transferring..." : "Transfer Stock"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
