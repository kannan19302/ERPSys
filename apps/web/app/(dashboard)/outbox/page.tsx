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
import {
  Inbox,
  AlertTriangle,
  Archive,
  Activity,
  RotateCcw,
  Eye,
} from "lucide-react";

interface DlqEntry {
  id: string;
  eventName: string;
  destination: string;
  status: string;
  failedAttempts: number;
  requeueCount: number;
  createdAt: string;
}

export default function OutboxPage() {
  const [dlqItems, setDlqItems] = useState<DlqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/outbox/dlq")
        .then((r) => r.json())
        .then((d) => setDlqItems(d.items || []))
        .catch(() => {}),
      fetch("/api/outbox/dlq/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  const columns: Column<DlqEntry>[] = [
    { key: "eventName", header: "Event" },
    { key: "destination", header: "Destination" },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.status === "PENDING_REVIEW" ? (
          <span className="ui-badge ui-badge-warning">Pending Review</span>
        ) : (
          <span className="ui-badge ui-badge-info">{r.status}</span>
        ),
    },
    { key: "failedAttempts", header: "Attempts" },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <Archive size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Transactional Outbox</h1>
      </div>
      <div className="ui-grid-4">
        <KPICard
          title="Pending Review"
          value={stats.pendingReview || 0}
          icon={<AlertTriangle size={20} />}
          color="var(--color-warning)"
        />
        <KPICard
          title="Retrying"
          value={stats.retrying || 0}
          icon={<Activity size={20} />}
          color="var(--color-primary)"
        />
        <KPICard
          title="Archived"
          value={stats.archived || 0}
          icon={<Archive size={20} />}
        />
        <KPICard
          title="Discarded"
          value={stats.discarded || 0}
          icon={<Inbox size={20} />}
        />
      </div>
      <Card padding="sm">
        <div style={{ padding: 'var(--space-3)' }}>
          <div className="ui-flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h4 className="text-xs font-semibold m-0">Dead Letter Queue</h4>
            <Button variant="primary" size="sm">
              <Eye size={14} /> View All
            </Button>
          </div>
          <DataTable columns={columns} data={dlqItems.slice(0, 10)} />
        </div>
      </Card>
    </div>
  );
}
