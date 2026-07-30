// @ts-nocheck
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet, apiDelete } from "@/lib/api";
import { Globe, Plus, Edit3, Trash2 } from "lucide-react";

export default function WorkflowWebhooksPage() {
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
    { key: "url", header: "URL" },
    { key: "method", header: "Method" },
    { key: "retryCount", header: "Retries" },
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
            <Edit3 size={16} />
          </button>
          <button
            className="ui-btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              apiDelete(`/workflow/webhooks/${row.id}`).then(load);
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
        title="Workflow Webhooks"
        description="Webhook integrations for workflows"
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
            <Globe size={20} /> Webhooks
          </h3>
          <Button leftIcon={<Plus size={16} />}>New Webhook</Button>
        </div>
        <DataTable columns={columns} data={items} />
      </div>
    </div>
  );
}
