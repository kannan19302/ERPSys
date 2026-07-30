// @ts-nocheck
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
import { Database, Trash2, Play } from "lucide-react";

export default function StorageBackupsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/storage/backups");
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
    {
      key: "type",
      header: "Type",
      render: (v: any) => <StatusBadge status={v || "FULL"} />,
    },
    {
      key: "status",
      header: "Status",
      render: (v: any) => <StatusBadge status={v} />,
    },
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
              apiDelete(`/storage/backups/${row.id}`).then(load);
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
        title="Storage Backups"
        description="Manage storage backups"
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
            <Database size={20} /> Backups ({items.length})
          </h3>
          <Button leftIcon={<Database size={16} />}>New Backup</Button>
        </div>
        <DataTable columns={columns} data={items} />
      </div>
    </div>
  );
}
