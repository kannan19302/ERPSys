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
import { Shield, Trash2 } from "lucide-react";

export default function StorageEncryptionPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(
        Array.isArray(await apiGet("/storage/encryption"))
          ? await apiGet("/storage/encryption")
          : [],
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "fileId", header: "File ID" },
    { key: "algorithm", header: "Algorithm" },
    {
      key: "status",
      header: "Status",
      render: (v: any) => (
        <StatusBadge
          status={v === "ENCRYPTED" ? "success" : "warning"}
          label={v}
        />
      ),
    },
    { key: "createdAt", header: "Created" },
    {
      key: "actions",
      header: "Actions",
      render: (_v: any, row: any) => (
        <button
          className="ui-btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            apiDelete(`/storage/encryption/${row.fileId}`).then(load);
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
        title="Storage Encryption"
        description="Manage file encryption"
      />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <h3 className="ui-heading-sm">
          <Shield size={20} /> Encrypted Files
        </h3>
        <DataTable columns={columns} data={items} />
      </div>
    </div>
  );
}
