"use client";
import React, { useState, useEffect } from "react";
import { Card, DataTable, Badge, Spinner, type Column } from "@unerp/ui";
import { Trash2 } from "lucide-react";

interface PushSub {
  id: string;
  userId: string;
  endpoint: string;
  deviceType?: string;
  browser?: string;
  platform?: string;
  status: string;
  tags: string[];
  createdAt: string;
}

export default function PushSubscriptionsPage() {
  const [items, setItems] = useState<PushSub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/pwa/push-subscriptions")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  const columns: Column<PushSub>[] = [
    { key: "userId", header: "User" },
    { key: "deviceType", header: "Device", render: (r) => r.deviceType || "-" },
    { key: "browser", header: "Browser", render: (r) => r.browser || "-" },
    { key: "platform", header: "Platform", render: (r) => r.platform || "-" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "ACTIVE" ? "success" : "danger"}>
          {r.status}
        </Badge>
      ),
    },
    { key: "tags", header: "Tags", render: (r) => r.tags?.join(", ") || "-" },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="ui-btn-icon"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Push Subscriptions</h1>
      </div>
      <Card>
        <DataTable columns={columns} data={items} />
      </Card>
    </div>
  );
}
