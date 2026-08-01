"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  DataTable,
  Badge,
  Spinner,
  Button,
  type Column,
} from "@unerp/ui";
import { Plus, Eye, Trash2, RotateCcw } from "lucide-react";

interface Webhook {
  id: string;
  name: string;
  url: string;
  eventTypes: string[];
  format: string;
  retryPolicy: string;
  active: boolean;
  lastTriggeredAt?: string;
  lastSuccessAt?: string;
  consecutiveFailureCount: number;
}

export default function WebhooksPage() {
  const [items, setItems] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ext-gateway/webhooks")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  const columns: Column<Webhook>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "url", header: "URL", render: (r) => r.url.slice(0, 40) + "..." },
    {
      key: "eventTypes",
      header: "Events",
      render: (r) => r.eventTypes?.join(", ") || "-",
    },
    { key: "format", header: "Format" },
    { key: "retryPolicy", header: "Retry" },
    {
      key: "active",
      header: "Active",
      render: (r) =>
        r.active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="default">Inactive</Badge>
        ),
    },
    {
      key: "consecutiveFailureCount",
      header: "Failures",
      render: (r) => (
        <Badge variant={r.consecutiveFailureCount > 0 ? "danger" : "success"}>
          {r.consecutiveFailureCount}
        </Badge>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Webhooks</h1>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Create Webhook
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={items} />
      </Card>
    </div>
  );
}
