"use client";
import React, { useState, useEffect } from "react";
import { Card, KPICard, Spinner } from "@unerp/ui";
import { BarChart3, CheckCircle, AlertTriangle, Activity } from "lucide-react";

export default function OutboxAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/outbox/analytics")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  if (!data)
    return <div className="p-12 text-center">No analytics data available</div>;

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Outbox Analytics</h1>
      </div>
      <div className="ui-grid-4">
        <KPICard
          title="Total Events"
          value={data.totalEvents || 0}
          icon={<BarChart3 size={20} />}
        />
        <KPICard
          title="Success Rate"
          value={`${data.successRate || 0}%`}
          icon={<CheckCircle size={20} />}
          color={data.successRate > 90 ? "var(--color-success)" : "var(--color-warning)"}
        />
        <KPICard
          title="Failed"
          value={data.failedDeliveries || 0}
          icon={<AlertTriangle size={20} />}
          color="var(--color-danger)"
        />
        <KPICard
          title="Avg Duration"
          value={`${Math.round(data.avgDurationMs || 0)}ms`}
          icon={<Activity size={20} />}
        />
      </div>
      <div className="ui-grid-3">
        <Card padding="sm">
          <div style={{ padding: 'var(--space-4)' }}>
            <h4 className="text-xs font-semibold m-0" style={{ marginBottom: 'var(--space-2)' }}>DLQ Stats</h4>
            <p>DLQ Entries: {data.dlqCount || 0}</p>
            <p>Dead Letters: {data.deadLetterCount || 0}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div style={{ padding: 'var(--space-4)' }}>
            <h4 className="text-xs font-semibold m-0" style={{ marginBottom: 'var(--space-2)' }}>Delivery Stats</h4>
            <p>Completed: {data.completedDeliveries || 0}</p>
            <p>Total: {data.totalDeliveries || 0}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div style={{ padding: 'var(--space-4)' }}>
            <h4 className="text-xs font-semibold m-0" style={{ marginBottom: 'var(--space-2)' }}>Dispatcher</h4>
            <p>Active: {data.activeDispatchers || 0}</p>
            <p>Total: {data.dispatcherCount || 0}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
