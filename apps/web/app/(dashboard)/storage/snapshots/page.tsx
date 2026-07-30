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
import { Camera, Trash2, Plus, Play } from "lucide-react";

export default function StorageSnapshotsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/storage/snapshots");
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
    { key: "type", header: "Type" },
    { key: "fileCount", header: "Files" },
    {
      key: "status",
      header: "Status",
      render: (v: any) => (
        <StatusBadge
          status={
            v === "COMPLETED" ? "success" : v === "FAILED" ? "error" : "warning"
          }
          label={v}
        />
      ),
    },
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
              apiDelete(`/storage/snapshots/${row.id}`).then(load);
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
        title="Storage Snapshots"
        description="Point-in-time storage snapshots"
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
            <Camera size={20} /> Snapshots
          </h3>
          <Button leftIcon={<Plus size={16} />}>New Snapshot</Button>
        </div>
        <DataTable columns={columns} data={items} />
      </div>
    </div>
  );
}
