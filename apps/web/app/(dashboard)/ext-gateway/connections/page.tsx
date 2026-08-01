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
import { Plus, Eye, Plug, Trash2 } from "lucide-react";

interface Connection {
  id: string;
  name: string;
  slug: string;
  provider: string;
  type: string;
  authType: string;
  status: string;
  rateLimitPerMin: number;
  timeout: number;
  errorCount: number;
  lastTestedAt?: string;
  createdAt: string;
}

export default function ConnectionsPage() {
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ext-gateway/connections")
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

  const columns: Column<Connection>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "provider", header: "Provider" },
    { key: "type", header: "Type" },
    { key: "authType", header: "Auth" },
    {
      key: "rateLimitPerMin",
      header: "Rate Limit",
      render: (r) => `${r.rateLimitPerMin}/min`,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.status === "ACTIVE"
              ? "success"
              : r.status === "ERROR"
                ? "danger"
                : "warning"
          }
        >
          {r.status}
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
            <Plug size={16} />
          </button>
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
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Connections</h1>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Create Connection
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={items} />
      </Card>
    </div>
  );
}
