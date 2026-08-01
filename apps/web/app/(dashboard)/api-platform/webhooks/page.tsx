"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Plus } from "lucide-react";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/admin/api-platform/webhooks")
      .then((d) => setWebhooks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name" },
    { key: "targetUrl", header: "Target URL" },
    { key: "events", header: "Events" },
    { key: "status", header: "Status" },
    { key: "createdAt", header: "Created" },
  ];

  return (
    <div>
      <PageHeader
        title="Webhooks"
        description={`${webhooks.length} subscriptions`}
      />
      <div className="ui-card">
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>Add Webhook</Button>
        </div>
        <DataTable columns={columns} data={webhooks} />
      </div>
    </div>
  );
}
