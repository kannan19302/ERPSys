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
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Plus, Edit3, Trash2, Tags } from "lucide-react";

export default function DocumentTagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/documents/tags");
      setTags(Array.isArray(data) ? data : []);
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
      key: "color",
      header: "Color",
      render: (v: any) => (
        <span
          style={{
            display: "inline-block",
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: v || "#1976D2",
          }}
        />
      ),
    },
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
              apiDelete(`/documents/tags/${row.id}`).then(load);
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
        title="Document Tags"
        description="Manage document tags and categories"
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
            <Tags size={20} /> Tags ({tags.length})
          </h3>
          <Button leftIcon={<Plus size={16} />}>New Tag</Button>
        </div>
        <DataTable columns={columns} data={tags} />
      </div>
    </div>
  );
}
