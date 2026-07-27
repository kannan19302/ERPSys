"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type ListColumn,
} from "@unerp/ui";
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

  const columns: ListColumn[] = [
    { key: "name", label: "Name" },
    { key: "targetUrl", label: "Target URL" },
    { key: "events", label: "Events" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created" },
  ];

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle={`${webhooks.length} subscriptions`}
      />
      <div className="ui-card">
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button icon={Plus}>Add Webhook</Button>
        </div>
        <DataTable columns={columns} data={webhooks} />
      </div>
    </div>
  );
}
