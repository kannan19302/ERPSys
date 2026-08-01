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
  Pagination,
  type Column,
} from "@unerp/ui";
import {
  Package as InventoryModuleIcon,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Play,
  AlertCircle,
} from "lucide-react";
import { RouteGuard } from "@unerp/framework";

import { apiGet, apiPost } from "../../../../src/lib/api";

interface AtpRecord {
  id: string;
  productId: string;
  warehouseId: string;
  onHand: number;
  onOrder: number;
  allocated: number;
  available: number;
  lastComputed?: string | null;
  product?: { name: string; sku: string };
  warehouse?: { name: string };
}

interface DashboardData {
  totalRecords: number;
  activeReservations: number;
  lowAvailability: number;
}

const PAGE_SIZE = 20;

export default function AtpCtpPage() {
  const [records, setRecords] = useState<AtpRecord[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [computing, setComputing] = useState(false);

  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveRecordId, setReserveRecordId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [referenceType, setReferenceType] = useState("SALES_ORDER");
  const [reserveQty, setReserveQty] = useState(1);
  const [committedUntil, setCommittedUntil] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordData, dashData] = await Promise.all([
        apiGet<{ data: AtpRecord[]; total: number }>(
          `/inventory/atp-ctp?page=${page}&limit=${PAGE_SIZE}`,
        ),
        apiGet<DashboardData>("/inventory/atp-ctp/dashboard"),
      ]);
      setRecords(recordData.data ?? []);
      setTotalRecords(recordData.total ?? 0);
      setDashboard(dashData);
    } catch {
      setError("Could not load ATP/CTP data.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleCompute = async () => {
    setComputing(true);
    try {
      await apiPost("/inventory/atp-ctp/compute", {});
      loadData();
    } catch {
      setError("Failed to compute ATP/CTP.");
    } finally {
      setComputing(false);
    }
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost(`/inventory/atp-ctp/${reserveRecordId}/reserve`, {
        referenceId,
        referenceType,
        quantity: reserveQty,
        committedUntil: committedUntil || undefined,
      });
      setIsReserveOpen(false);
      setReferenceId("");
      setReferenceType("SALES_ORDER");
      setReserveQty(1);
      setCommittedUntil("");
      loadData();
    } catch {
      setError("Failed to create reservation.");
    }
  };

  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

  const columns: Column<AtpRecord>[] = [
    {
      key: "product",
      header: "Product",
      render: (row) => row.product?.name ?? row.productId,
    },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (row) => row.warehouse?.name ?? row.warehouseId,
    },
    { key: "onHand", header: "On Hand" },
    { key: "onOrder", header: "On Order" },
    { key: "allocated", header: "Allocated" },
    {
      key: "available",
      header: "Available",
      render: (row) => (
        <span
          style={{
            color:
              row.available > 0
                ? "var(--color-success-text)"
                : "var(--color-danger-text)",
          }}
        >
          {row.available}
        </span>
      ),
    },
    {
      key: "lastComputed",
      header: "Last Computed",
      render: (row) =>
        row.lastComputed ? new Date(row.lastComputed).toLocaleString() : "—",
    },
    {
      key: "id",
      header: "Actions",
      render: (row) => (
        <div className={styles.s2}>
          <button
            className={`ui-btn ${styles.s3}`}
            onClick={() => {
              setReserveRecordId(row.id);
              setIsReserveOpen(true);
            }}
          >
            Reserve
          </button>
        </div>
      ),
    },
  ];

  return (
    <RouteGuard permission="inventory.atp-ctp.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="ATP/CTP Availability"
          description="Available-to-Promise and Capable-to-Promise availability calculations."
          actions={
            <Button
              variant="primary"
              onClick={handleCompute}
              disabled={computing}
              className="ui-hstack-2"
            >
              <Play size={14} /> {computing ? "Computing..." : "Compute ATP"}
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
                label: "Total ATP Records",
                value: dashboard.totalRecords,
                icon: <BarChart3 size={16} />,
              },
              {
                label: "Active Reservations",
                value: dashboard.activeReservations,
                icon: <CheckCircle size={16} />,
                color: "var(--chart-2)",
              },
              {
                label: "Low Availability Items",
                value: dashboard.lowAvailability,
                icon: <AlertTriangle size={16} />,
                color: "var(--chart-4)",
              },
            ]}
          />
        )}

        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          emptyTitle="No ATP/CTP records"
          emptyMessage="Run a computation to generate availability data."
        />

        {totalPages > 1 && (
          <div style={{ marginTop: 16 }}>
            <Pagination page={page} pageCount={totalPages} onChange={setPage} />
          </div>
        )}

        <Modal
          open={isReserveOpen}
          onClose={() => setIsReserveOpen(false)}
          title="Create Reservation"
          footer={
            <div className={styles.s8}>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsReserveOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" form="reserve-form">
                Reserve
              </Button>
            </div>
          }
        >
          <form
            id="reserve-form"
            onSubmit={handleReserve}
            className="ui-stack-4"
          >
            <div className="ui-form-group">
              <label className="ui-label">Reference ID *</label>
              <input
                type="text"
                className="ui-input"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                required
                placeholder="Order or transfer ID"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Reference Type *</label>
              <select
                className="ui-input"
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value)}
                required
              >
                <option value="SALES_ORDER">Sales Order</option>
                <option value="TRANSFER">Transfer</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Quantity *</label>
              <input
                type="number"
                className="ui-input"
                value={reserveQty}
                onChange={(e) => setReserveQty(parseInt(e.target.value) || 1)}
                required
                min={1}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Committed Until</label>
              <input
                type="date"
                className="ui-input"
                value={committedUntil}
                onChange={(e) => setCommittedUntil(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
