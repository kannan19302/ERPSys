"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  PageHeader,
  Card,
  DataTable,
  type Column,
  Button,
  Modal,
  TextField,
  Select,
  FormField,
  Badge,
  StatusBadge,
  Spinner,
  Pagination,
} from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import { Plus, Search, Eye, Trash2, RotateCcw } from "lucide-react";
import Link from "next/link";

interface Rma {
  id: string;
  rmaNumber: string;
  source: string;
  status: string;
  customerName: string | null;
  vendorName: string | null;
  returnReason: string | null;
  priority: string;
  totalQty: number;
  totalValue: number;
  createdAt: string;
}

export default function RmaPage() {
  const client = useApiClient();
  const [data, setData] = useState<Rma[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    rmaNumber: "",
    source: "CUSTOMER_RETURN",
    customerName: "",
    vendorName: "",
    returnReason: "",
    priority: "MEDIUM",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  const limit = 20;
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<{ data: Rma[]; total: number }>(
        `/inventory/rma?page=${page}&limit=${limit}`,
      );
      setData(res.data);
      setTotal(res.total);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [client, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rmaNumber) return;
    setCreating(true);
    try {
      await client.post("/inventory/rma", form);
      setCreateOpen(false);
      setForm({
        rmaNumber: "",
        source: "CUSTOMER_RETURN",
        customerName: "",
        vendorName: "",
        returnReason: "",
        priority: "MEDIUM",
        notes: "",
      });
      fetchData();
    } catch {
      /* empty */
    } finally {
      setCreating(false);
    }
  };

  const filtered = data.filter(
    (r) =>
      !search ||
      r.rmaNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.vendorName || "").toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Rma>[] = [
    {
      key: "rmaNumber",
      header: "RMA #",
      render: (r) => (
        <Link href={`/inventory/rma/${r.id}`} className="ui-link">
          {r.rmaNumber}
        </Link>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (r) => (
        <Badge variant={r.source === "CUSTOMER_RETURN" ? "info" : "warning"}>
          {r.source.replace("_", " ")}
        </Badge>
      ),
    },
    { key: "customerName", header: "Customer" },
    { key: "vendorName", header: "Vendor" },
    { key: "returnReason", header: "Reason" },
    {
      key: "priority",
      header: "Priority",
      render: (r) => (
        <Badge
          variant={
            r.priority === "HIGH"
              ? "danger"
              : r.priority === "MEDIUM"
                ? "warning"
                : "info"
          }
        >
          {r.priority}
        </Badge>
      ),
    },
    { key: "totalQty", header: "Qty" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="ui-page">
      <PageHeader
        title="RMA (Return Merchandise Authorization)"
        description="Manage customer and vendor returns"
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New RMA
          </Button>
        }
      />
      <Card>
        <div className="ui-flex ui-gap-2" style={{ marginBottom: "1rem" }}>
          <div className="ui-flex-1">
            <TextField
              placeholder="Search RMAs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey={(r) => r.id}
          emptyTitle="No RMAs"
          emptyMessage="Create your first RMA to start tracking returns."
          emptyIcon={<RotateCcw size={48} />}
        />
        <Pagination
          page={page}
          pageCount={Math.ceil(total / limit)}
          onChange={setPage}
        />
      </Card>
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create RMA"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate as any}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="ui-stack-4">
          <TextField
            label="RMA Number"
            required
            placeholder="RMA-2026-001"
            value={form.rmaNumber}
            onChange={(e) => setForm({ ...form, rmaNumber: e.target.value })}
          />
          <FormField label="Source">
            <Select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option value="CUSTOMER_RETURN">Customer Return</option>
              <option value="VENDOR_RETURN">Vendor Return</option>
              <option value="INTERNAL">Internal</option>
              <option value="QUALITY">Quality</option>
            </Select>
          </FormField>
          <div className="ui-grid-2">
            <TextField
              label="Customer Name"
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
            />
            <TextField
              label="Vendor Name"
              value={form.vendorName}
              onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
            />
          </div>
          <TextField
            label="Return Reason"
            value={form.returnReason}
            onChange={(e) => setForm({ ...form, returnReason: e.target.value })}
          />
          <FormField label="Priority">
            <Select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </FormField>
          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
