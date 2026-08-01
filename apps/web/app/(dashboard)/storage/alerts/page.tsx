"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type Column,
  StatusBadge,
} from "@unerp/ui";
import { apiGet, apiDelete } from "@/lib/api";
import { AlertTriangle, Trash2, Plus } from "lucide-react";

export default function StorageAlertsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/storage/alerts");
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "metric", header: "Metric" },
    { key: "threshold", header: "Threshold" },
    {
      key: "enabled",
      header: "Enabled",
      render: (v: any) => <StatusBadge status={v ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (_v: any, row: any) => (
        <button
          className="ui-btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            apiDelete(`/storage/alerts/${row.id}`).then(load);
          }}
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Storage Alerts"
        description="Monitor storage metrics"
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
            <AlertTriangle size={20} /> Alerts
          </h3>
          <Button leftIcon={<Plus size={16} />}>New Alert</Button>
        </div>
        <DataTable columns={columns} data={items} />
      </div>
    </div>
  );
}
