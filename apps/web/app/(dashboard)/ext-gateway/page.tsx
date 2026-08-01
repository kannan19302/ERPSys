"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  KPICard,
  Spinner,
  DataTable,
  Button,
  type Column,
} from "@unerp/ui";
import { Plug, Globe, Webhook, Activity, Eye, Plus } from "lucide-react";

interface Connection {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: string;
  lastTestedAt?: string;
  errorCount: number;
}

export default function ExtGatewayPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusSummary, setStatusSummary] = useState<any>({});
  const [webhookStats, setWebhookStats] = useState<any>({});
  const [analytics, setAnalytics] = useState<any>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/ext-gateway/connections")
        .then((r) => r.json())
        .then((d) => setConnections(d.items || []))
        .catch(() => {}),
      fetch("/api/ext-gateway/connections/status")
        .then((r) => r.json())
        .then(setStatusSummary)
        .catch(() => {}),
      fetch("/api/ext-gateway/webhooks/stats")
        .then((r) => r.json())
        .then(setWebhookStats)
        .catch(() => {}),
      fetch("/api/ext-gateway/analytics")
        .then((r) => r.json())
        .then(setAnalytics)
        .catch(() => {}),
    ]).finally(() => setLoading(false));
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
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={`ui-badge ui-badge-${r.status === "ACTIVE" ? "success" : r.status === "ERROR" ? "danger" : "warning"}`}
        >
          {r.status}
        </span>
      ),
    },
    { key: "errorCount", header: "Errors" },
    {
      key: "id",
      header: "Actions",
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="ui-btn-icon"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Extension Gateway</h1>
        <Button variant="primary" size="sm">
          <Plus size={14} /> New Connection
        </Button>
      </div>
      <div className="ui-grid-4">
        <KPICard
          title="Connections"
          value={analytics.totalConnections || 0}
          icon={<Plug size={20} />}
        />
        <KPICard
          title="Active"
          value={analytics.activeConnections || 0}
          icon={<Globe size={20} />}
        />
        <KPICard
          title="Webhooks"
          value={analytics.totalWebhooks || 0}
          icon={<Webhook size={20} />}
        />
        <KPICard
          title="Success Rate"
          value={`${analytics.successRate || 0}%`}
          icon={<Activity size={20} />}
        />
      </div>
      <Card padding="md">
        <DataTable columns={columns} data={connections} />
      </Card>
    </div>
  );
}
