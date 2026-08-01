"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  useToast,
  DataTable,
  type Column,
} from "@unerp/ui";
import { Plus, Trash2, Layout } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function DashboardTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "GENERAL",
  });
  const toast = useToast();
  const client = useApiClient();

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<any>("/crm/reporting/dashboards/templates");
      setTemplates(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast.error("Could not load templates");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/crm/reporting/dashboards/templates", form);
      toast.success("Template created");
      setShowCreate(false);
      setForm({ name: "", description: "", category: "GENERAL" });
      loadTemplates();
    } catch {
      toast.error("Failed to create template");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/crm/reporting/dashboards/templates/${id}`);
      toast.success("Template deleted");
      loadTemplates();
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const columns: Column<any>[] = [
    { key: "name", header: "Template Name" },
    { key: "description", header: "Description" },
    {
      key: "category",
      header: "Category",
      render: (v: string) => <Badge>{v}</Badge>,
    },
    {
      key: "isDefault",
      header: "Default",
      render: (v: boolean) => (v ? "Yes" : "No"),
    },
    {
      key: "isSystem",
      header: "System",
      render: (v: boolean) => (v ? "Yes" : "No"),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "id",
      header: "",
      render: (_: string, row: any) => (
        <button
          className="ui-btn ui-btn-sm ui-btn-ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.id);
          }}
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <PageHeader
        title="Dashboard Templates"
        description="Pre-built dashboard layouts"
        breadcrumbs={[
          { label: "Reporting", href: "/crm/reporting-deep" },
          { label: "Templates" },
        ]}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Template
          </Button>
        }
      />
      {showCreate && (
        <Card title="Create Template" className="ui-card-sm">
          <form onSubmit={handleCreate} className="ui-form">
            <div className="ui-form-group">
              <label className="ui-label">Name</label>
              <input
                className="ui-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Description</label>
              <input
                className="ui-input"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Category</label>
              <select
                className="ui-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="GENERAL">General</option>
                <option value="SALES">Sales</option>
                <option value="MARKETING">Marketing</option>
                <option value="SERVICE">Service</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>
            <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
              <Button type="submit">Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      <Card className="ui-card-full">
        <DataTable columns={columns} data={templates} />
      </Card>
    </div>
  );
}
