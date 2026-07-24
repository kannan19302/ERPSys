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
  Select,
} from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import {
  Plus,
  FileJson,
  Eye,
  Package,
  Upload,
  Download,
  CheckCircle,
  FileText,
} from "lucide-react";

interface EdiTransaction {
  id: string;
  transactionId: string;
  ediType: string;
  direction: string;
  senderId: string;
  receiverId: string;
  payload: string;
  status: string;
  createdAt: string;
  sender?: { name: string };
  receiver?: { name: string };
}

interface DashboardStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

const EDI_TYPES = ["846", "856", "850"];
const DIRECTIONS = ["INBOUND", "OUTBOUND"];

export default function EdiTransactionsPage() {
  const [transactions, setTransactions] = useState<EdiTransaction[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    transactionId: "",
    ediType: "846",
    direction: "INBOUND" as "INBOUND" | "OUTBOUND",
    senderId: "",
    receiverId: "",
    payload: "",
    status: "RECEIVED",
  });

  const [payloadOpen, setPayloadOpen] = useState(false);
  const [payloadContent, setPayloadContent] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, listRes] = await Promise.all([
        apiGet("/inventory/edi/dashboard"),
        apiGet(`/inventory/edi?page=${page}&limit=${limit}`),
      ]);
      setDashboard(dashRes as DashboardStats);
      const data = listRes as { data: EdiTransaction[]; totalPages?: number };
      setTransactions(data.data || []);
      if (data.totalPages) setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load EDI transaction data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.transactionId || !form.senderId || !form.receiverId) return;
    setCreating(true);
    try {
      await apiPost("/inventory/edi", form);
      setCreateOpen(false);
      setForm({
        transactionId: "",
        ediType: "846",
        direction: "INBOUND",
        senderId: "",
        receiverId: "",
        payload: "",
        status: "RECEIVED",
      });
      loadData();
    } catch {
      setError("Failed to create EDI transaction.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiPatch(`/inventory/edi/${id}`, { status });
      loadData();
    } catch {
      setError("Failed to update status.");
    }
  };

  const columns: Column<EdiTransaction>[] = [
    { key: "transactionId", header: "Transaction ID" },
    {
      key: "ediType",
      header: "EDI Type",
      render: (row) => <StatusBadge status={row.ediType} />,
    },
    {
      key: "direction",
      header: "Direction",
      render: (row) => (
        <span className="ui-hstack-1">
          {row.direction === "INBOUND" ? (
            <Download size={12} className="ui-text-info" />
          ) : (
            <Upload size={12} className="ui-text-warning" />
          )}
          <span>{row.direction}</span>
        </span>
      ),
    },
    {
      key: "senderId",
      header: "Sender",
      render: (row) => row.sender?.name || row.senderId,
    },
    {
      key: "receiverId",
      header: "Receiver",
      render: (row) => row.receiver?.name || row.receiverId,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
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
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setPayloadContent(row.payload);
              setPayloadOpen(true);
            }}
          >
            <Eye size={14} />
          </Button>
          {row.status !== "PROCESSED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(row.id, "PROCESSED");
              }}
            >
              <CheckCircle size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading && transactions.length === 0) {
    return (
      <RouteGuard permission="inventory.edi.read">
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="inventory.edi.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="EDI Transactions"
          description="Electronic Data Interchange — inventory transaction types 846, 856, 850."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Inventory", href: "/inventory" },
            { label: "EDI Transactions" },
          ]}
          actions={
            <Button
              variant="primary"
              onClick={() => setCreateOpen(true)}
              className="ui-hstack-2"
            >
              <Plus size={14} /> New Transaction
            </Button>
          }
        />

        {error && <div className={styles.errorBox}>{error}</div>}

        {dashboard && (
          <StatCardRow
            stats={[
              {
                label: "Total Transactions",
                value: dashboard.total,
                icon: <FileJson size={16} />,
                color: "var(--chart-1)",
                loading: false,
              },
              ...EDI_TYPES.map((type) => ({
                label: `Type ${type}`,
                value: dashboard.byType[type] || 0,
                icon: <FileText size={16} />,
                color: "var(--chart-2)",
                loading: false,
              })),
              ...Object.entries(dashboard.byStatus).map(
                ([status, count], idx) => ({
                  label: `${status}`,
                  value: count,
                  icon: <CheckCircle size={16} />,
                  color:
                    idx === 0
                      ? "var(--chart-4)"
                      : idx === 1
                        ? "var(--chart-5)"
                        : "var(--chart-3)",
                  loading: false,
                }),
              ),
            ]}
          />
        )}

        <DataTable
          columns={columns}
          data={transactions}
          rowKey={(r) => r.id}
          emptyTitle="No EDI transactions"
          emptyMessage="Create a new EDI transaction to get started."
          emptyIcon={<FileJson size={48} />}
        />
        {totalPages > 1 && (
          <div style={{ marginTop: 16 }}>
            <Pagination page={page} pageCount={totalPages} onChange={setPage} />
          </div>
        )}

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New EDI Transaction"
          size="lg"
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
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Transaction ID" required>
                <Input
                  value={form.transactionId}
                  onChange={(e) =>
                    setForm({ ...form, transactionId: e.target.value })
                  }
                  placeholder="EDI-2026-001"
                />
              </FormField>
              <FormField label="EDI Type" required>
                <select
                  className="ui-input"
                  value={form.ediType}
                  onChange={(e) =>
                    setForm({ ...form, ediType: e.target.value })
                  }
                >
                  {EDI_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Direction" required>
                <select
                  className="ui-input"
                  value={form.direction}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      direction: e.target.value as "INBOUND" | "OUTBOUND",
                    })
                  }
                >
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status">
                <select
                  className="ui-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSED">PROCESSED</option>
                </select>
              </FormField>
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <FormField label="Sender ID" required>
                <Input
                  value={form.senderId}
                  onChange={(e) =>
                    setForm({ ...form, senderId: e.target.value })
                  }
                  placeholder="QUALCOMM"
                />
              </FormField>
              <FormField label="Receiver ID" required>
                <Input
                  value={form.receiverId}
                  onChange={(e) =>
                    setForm({ ...form, receiverId: e.target.value })
                  }
                  placeholder="ACME"
                />
              </FormField>
            </div>
            <FormField label="Payload (EDI content)">
              <textarea
                className="ui-input"
                rows={6}
                value={form.payload}
                onChange={(e) => setForm({ ...form, payload: e.target.value })}
                placeholder="ISA*00*...*GS*...*ST*846*..."
              />
            </FormField>
          </form>
        </Modal>

        <Modal
          open={payloadOpen}
          onClose={() => {
            setPayloadOpen(false);
            setPayloadContent("");
          }}
          title="EDI Payload"
          size="lg"
        >
          <pre className={styles.payloadPre}>{payloadContent}</pre>
        </Modal>
      </div>
    </RouteGuard>
  );
}
