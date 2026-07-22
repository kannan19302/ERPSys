"use client";
import styles from "./page.module.css";
import { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  StatusBadge,
  DataTable,
  StatCardRow,
  Modal,
  type Column,
} from "@unerp/ui";
import {
  Plus,
  Eye,
  XCircle,
  Package as InventoryModuleIcon,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { RouteGuard } from "@unerp/framework";
import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";
import { apiGet, apiPost, apiPatch } from "../../../../src/lib/api";

interface DropShipOrder {
  id: string;
  orderNumber: string;
  providerId: string;
  vendorId: string;
  status: string;
  shipMethod: string;
  trackingNumber?: string | null;
  createdAt: string;
  vendor?: { name: string };
  provider?: { name: string };
  items?: Array<{ productId: string; quantity: number }>;
}

interface DashboardData {
  totalOrders: number;
  pending: number;
  shipped: number;
  delivered: number;
}

export default function DropShipPage() {
  const [orders, setOrders] = useState<DropShipOrder[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipMethod, setShipMethod] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: string }[]>(
    [{ productId: "", quantity: "1" }],
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderData, dashData] = await Promise.all([
        apiGet<{ data?: DropShipOrder[] }>("/inventory/drop-ship/orders"),
        apiGet<DashboardData>("/inventory/drop-ship/dashboard"),
      ]);
      setOrders(orderData.data ?? []);
      setDashboard(dashData);
    } catch {
      setError("Could not load drop-ship data.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/inventory/drop-ship/orders", {
        providerId,
        vendorId,
        shipToAddress,
        shipMethod,
        items: items
          .filter((i) => i.productId)
          .map((i) => ({ productId: i.productId, quantity: parseInt(i.quantity) || 1 })),
      });
      setIsCreateOpen(false);
      setProviderId("");
      setVendorId("");
      setShipToAddress("");
      setShipMethod("");
      setItems([{ productId: "", quantity: "1" }]);
      loadData();
    } catch {
      setError("Failed to create drop-ship order.");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiPatch(`/inventory/drop-ship/orders/${id}/cancel`, {});
      loadData();
    } catch {
      setError("Failed to cancel order.");
    }
  };

  const columns: Column<DropShipOrder>[] = [
    {
      key: "orderNumber",
      header: "Order Number",
      render: (row) => <span className={styles.s1}>{row.orderNumber}</span>,
    },
    {
      key: "provider",
      header: "Provider",
      render: (row) => row.provider?.name ?? row.providerId,
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (row) => row.vendor?.name ?? row.vendorId,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: "shipMethod", header: "Ship Method" },
    {
      key: "trackingNumber",
      header: "Tracking",
      render: (row) => row.trackingNumber ?? "—",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "id",
      header: "Actions",
      render: (row) => (
        <div className={styles.s2}>
          <button
            className={`ui-btn ${styles.s3}`}
            onClick={() => alert(`View order ${row.orderNumber}`)}
          >
            <Eye size={12} /> View
          </button>
          {["PENDING", "AWAITING_ACK"].includes(row.status) && (
            <button
              className={`ui-btn ${styles.s3}`}
              onClick={() => handleCancel(row.id)}
            >
              <XCircle size={12} /> Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <RouteGuard permission="inventory.drop-ship.read">
      <InventoryTabLayout
        tabs={INVENTORY_TABS}
        moduleId="inventory"
        moduleLabel="Inventory & Stock"
        moduleIcon={InventoryModuleIcon}
        moduleDescription="Manage drop-ship orders from providers directly to customers."
      >
        <div className="ui-stack-6 ui-animate-in">
          <PageHeader
            title="Drop-Ship Orders"
            description="Manage drop-ship orders from providers directly to customers."
            actions={
              <Button
                variant="primary"
                onClick={() => setIsCreateOpen(true)}
                className="ui-hstack-2"
              >
                <Plus size={14} /> New Order
              </Button>
            }
          />

          {error && (
            <div className={styles.s4}>
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}

          {dashboard && (
            <StatCardRow
              stats={[
                {
                  label: "Total Orders",
                  value: dashboard.totalOrders,
                  icon: <Truck size={16} />,
                },
                {
                  label: "Pending",
                  value: dashboard.pending,
                  icon: <Clock size={16} />,
                  color: "var(--chart-4)",
                },
                {
                  label: "Shipped",
                  value: dashboard.shipped,
                  icon: <Truck size={16} />,
                  color: "var(--chart-3)",
                },
                {
                  label: "Delivered",
                  value: dashboard.delivered,
                  icon: <CheckCircle size={16} />,
                  color: "var(--chart-2)",
                },
              ]}
            />
          )}

          <DataTable
            columns={columns}
            data={orders}
            loading={loading}
            emptyTitle="No drop-ship orders"
            emptyMessage="Create your first drop-ship order to get started."
          />

          <Modal
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            title="New Drop-Ship Order"
            size="lg"
            footer={
              <div className={styles.s8}>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" form="drop-ship-form">
                  Create Order
                </Button>
              </div>
            }
          >
            <form id="drop-ship-form" onSubmit={handleCreate} className="ui-stack-4">
              <div className="ui-form-group">
                <label className="ui-label">Provider *</label>
                <input
                  type="text"
                  className="ui-input"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  required
                  placeholder="Provider ID"
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Vendor *</label>
                <input
                  type="text"
                  className="ui-input"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  required
                  placeholder="Vendor ID"
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Ship To Address *</label>
                <textarea
                  className={`ui-input ${styles.s9}`}
                  value={shipToAddress}
                  onChange={(e) => setShipToAddress(e.target.value)}
                  required
                  rows={2}
                  placeholder="Full shipping address"
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Ship Method *</label>
                <input
                  type="text"
                  className="ui-input"
                  value={shipMethod}
                  onChange={(e) => setShipMethod(e.target.value)}
                  required
                  placeholder="e.g. UPS Ground, FedEx Express"
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Items</label>
                {items.map((item, i) => (
                  <div key={i} className={styles.s12}>
                    <div className={styles.s10}>
                      <input
                        type="text"
                        className="ui-input"
                        value={item.productId}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((it, j) =>
                              j === i ? { ...it, productId: e.target.value } : it,
                            ),
                          )
                        }
                        placeholder="Product ID"
                        style={{ flex: 1 }}
                      />
                      <input
                        type="number"
                        className="ui-input"
                        value={item.quantity}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((it, j) =>
                              j === i ? { ...it, quantity: e.target.value } : it,
                            ),
                          )
                        }
                        min={1}
                        style={{ width: 100 }}
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          className={styles.s11}
                          onClick={() =>
                            setItems((prev) => prev.filter((_, j) => j !== i))
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="ui-btn"
                  style={{ fontSize: 12, marginTop: 4 }}
                  onClick={() =>
                    setItems((prev) => [...prev, { productId: "", quantity: "1" }])
                  }
                >
                  + Add Item
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </InventoryTabLayout>
    </RouteGuard>
  );
}
