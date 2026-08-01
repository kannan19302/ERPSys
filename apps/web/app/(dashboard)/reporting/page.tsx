"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type Column,
  StatusBadge,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/reporting")
      .then((d) => setReports(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "title", header: "Title" },
    { key: "category", header: "Category" },
    { key: "status", header: "Status" },
    { key: "createdAt", header: "Created" },
    { key: "updatedAt", header: "Updated" },
    {
      key: "actions",
      header: "Actions",
      render: (row: Record<string, unknown>) => (
        <div
          className="ui-flex"
          style={{ gap: "var(--space-2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="ghost">
            <Eye size={14} />
          </Button>
          <Button size="sm" variant="ghost">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Reports" description={`${reports.length} reports`} />
      <div className="ui-card">
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>New Report</Button>
        </div>
        <DataTable columns={columns} data={reports} />
      </div>
    </div>
  );
}
