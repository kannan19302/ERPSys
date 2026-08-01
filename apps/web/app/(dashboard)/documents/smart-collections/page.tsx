"use client";
import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet, apiDelete } from "@/lib/api";
import { Plus, Edit3, Trash2, FolderOpen } from "lucide-react";

export default function SmartCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/documents/smart-collections");
      setCollections(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "description", header: "Description" },
    { key: "createdAt", header: "Created", sortable: true },
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
            <Edit3 size={16} />
          </button>
          <button
            className="ui-btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              apiDelete(`/documents/smart-collections/${row.id}`).then(load);
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
        title="Smart Collections"
        description="Dynamic document collections with filter criteria"
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
            <FolderOpen size={20} /> Collections
          </h3>
          <Button leftIcon={<Plus size={16} />}>New Collection</Button>
        </div>
        <DataTable columns={columns} data={collections} />
      </div>
    </div>
  );
}
