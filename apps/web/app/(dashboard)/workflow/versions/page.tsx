"use client";
import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet, apiDelete } from "@/lib/api";
import { FileText, Plus, Trash2, Play } from "lucide-react";

export default function WorkflowVersionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "version", header: "Version", sortable: true },
    { key: "changeLog", header: "Change Log" },
    { key: "createdAt", header: "Created" },
    {
      key: "actions",
      header: "Actions",
      render: (_v: any, row: any) => (
        <div className="ui-flex" style={{ gap: "var(--space-2)" }}>
          <button
            className="ui-btn-icon"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Play size={16} />
          </button>
          <button
            className="ui-btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              apiDelete(`/workflow/versions/${row.id}`).then(load);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Workflow Versions"
        description="Version history for workflow definitions"
      />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{
            justifyContent: "space-between",
            marginBottom: "var(--space-4)",
          }}
        >
          <h3 className="ui-heading-sm">
            <FileText size={20} /> Versions
          </h3>
        </div>
        <DataTable columns={columns} data={items} />
      </div>
    </div>
  );
}
