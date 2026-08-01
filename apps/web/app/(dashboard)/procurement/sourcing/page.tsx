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
import { Plus, Search, Briefcase } from "lucide-react";
import Link from "next/link";

interface SourcingProject {
  id: string;
  projectNumber: string;
  projectName: string;
  projectType: string | null;
  category: string | null;
  status: string;
  estimatedValue: number | null;
  currency: string;
  buyerId: string | null;
  expectedSavings: number | null;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  _count?: { evaluations: number };
}

export default function SourcingPage() {
  const client = useApiClient();
  const [data, setData] = useState<SourcingProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    projectNumber: "",
    projectName: "",
    projectType: "",
    category: "",
    estimatedValue: 0,
    currency: "USD",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  const limit = 20;
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<{ data: SourcingProject[]; total: number }>(
        `/procurement/sourcing-projects?page=${page}&limit=${limit}`,
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
    if (!form.projectNumber || !form.projectName) return;
    setCreating(true);
    try {
      await client.post("/procurement/sourcing-projects", form);
      setCreateOpen(false);
      setForm({
        projectNumber: "",
        projectName: "",
        projectType: "",
        category: "",
        estimatedValue: 0,
        currency: "USD",
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
    (p) =>
      !search ||
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      p.projectNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<SourcingProject>[] = [
    {
      key: "projectNumber",
      header: "Project #",
      render: (r) => (
        <Link href={`/procurement/sourcing/${r.id}`} className="ui-link">
          {r.projectNumber}
        </Link>
      ),
    },
    { key: "projectName", header: "Name" },
    {
      key: "category",
      header: "Category",
      render: (r) => (r.category ? <Badge>{r.category}</Badge> : "—"),
    },
    {
      key: "estimatedValue",
      header: "Est. Value",
      render: (r) =>
        r.estimatedValue
          ? `${r.currency} ${Number(r.estimatedValue).toLocaleString()}`
          : "—",
    },
    {
      key: "expectedSavings",
      header: "Savings",
      render: (r) =>
        r.expectedSavings
          ? `$${Number(r.expectedSavings).toLocaleString()}`
          : "—",
    },
    {
      key: "targetDate",
      header: "Target",
      render: (r) =>
        r.targetDate ? new Date(r.targetDate).toLocaleDateString() : "—",
    },
    {
      key: "evaluations",
      header: "Evaluations",
      render: (r) => r._count?.evaluations ?? 0,
    },
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
        title="Sourcing Projects"
        description="Manage strategic sourcing initiatives and supplier evaluations"
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New Project
          </Button>
        }
      />
      <Card>
        <TextField
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey={(r) => r.id}
          emptyTitle="No sourcing projects"
          emptyMessage="Create your first sourcing project."
          emptyIcon={<Briefcase size={48} />}
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
        title="Create Sourcing Project"
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
          <div className="ui-grid-2">
            <TextField
              label="Project Number"
              required
              placeholder="SP-2026-001"
              value={form.projectNumber}
              onChange={(e) =>
                setForm({ ...form, projectNumber: e.target.value })
              }
            />
            <TextField
              label="Project Name"
              required
              placeholder="Q1 Raw Materials"
              value={form.projectName}
              onChange={(e) =>
                setForm({ ...form, projectName: e.target.value })
              }
            />
          </div>
          <div className="ui-grid-2">
            <TextField
              label="Category"
              placeholder="Raw Materials"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <TextField
              label="Est. Value"
              type="number"
              value={form.estimatedValue || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  estimatedValue: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
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
