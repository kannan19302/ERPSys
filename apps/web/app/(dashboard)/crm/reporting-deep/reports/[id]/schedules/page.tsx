// @ts-nocheck
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
import { Plus, Trash2, Play } from "lucide-react";
import { useApiClient } from "@unerp/framework";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ReportSchedulesPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    frequency: "WEEKLY",
    format: "PDF",
    recipients: "",
  });
  const toast = useToast();
  const client = useApiClient();

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<any>(
        `/crm/reporting/reports/${id}/schedules`,
      );
      setSchedules(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast.error("Could not load schedules");
    } finally {
      setLoading(false);
    }
  }, [id, client]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post(`/crm/reporting/reports/${id}/schedules`, {
        ...form,
        recipients: form.recipients
          .split(",")
          .map((r: string) => r.trim())
          .filter(Boolean),
      });
      toast.success("Schedule created");
      setShowCreate(false);
      setForm({ name: "", frequency: "WEEKLY", format: "PDF", recipients: "" });
      loadSchedules();
    } catch {
      toast.error("Failed to create schedule");
    }
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      await client.delete(
        `/crm/reporting/reports/${id}/schedules/${scheduleId}`,
      );
      toast.success("Schedule deleted");
      loadSchedules();
    } catch {
      toast.error("Failed to delete schedule");
    }
  };

  const columns: Column<any>[] = [
    { key: "name", header: "Schedule Name" },
    { key: "frequency", header: "Frequency" },
    {
      key: "format",
      header: "Format",
      render: (v: string) => <Badge>{v}</Badge>,
    },
    {
      key: "isActive",
      header: "Active",
      render: (v: boolean) => (
        <Badge variant={v ? "success" : "default"}>
          {v ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "lastRunAt",
      header: "Last Run",
      render: (v: string | null) =>
        v ? new Date(v).toLocaleDateString() : "Never",
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
        title="Report Schedules"
        description="Schedule recurring report exports"
        breadcrumbs={[
          { label: "Reporting", href: "/crm/reporting-deep" },
          { label: "Reports", href: "/crm/reporting-deep/reports" },
          { label: "Schedules" },
        ]}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Schedule
          </Button>
        }
      />
      {showCreate && (
        <Card title="Create Schedule" className="ui-card-sm">
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
              <label className="ui-label">Frequency</label>
              <select
                className="ui-input"
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Format</label>
              <select
                className="ui-input"
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
              >
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
                <option value="XLSX">XLSX</option>
                <option value="HTML">HTML</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">
                Recipients (comma-separated emails)
              </label>
              <input
                className="ui-input"
                value={form.recipients}
                onChange={(e) =>
                  setForm({ ...form, recipients: e.target.value })
                }
                placeholder="user@example.com, user2@example.com"
              />
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
        <DataTable columns={columns} data={schedules} />
        {schedules.length === 0 && (
          <div className="ui-empty">No schedules yet</div>
        )}
      </Card>
    </div>
  );
}
