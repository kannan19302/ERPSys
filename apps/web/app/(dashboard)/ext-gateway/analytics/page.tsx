// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { Card, KPICard, Spinner } from "@unerp/ui";
import { BarChart3, CheckCircle, AlertTriangle, Activity } from "lucide-react";

export default function ExtAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ext-gateway/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
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
        <h1>Extension Analytics</h1>
      </div>
      <div className="ui-grid-4">
        <KPICard
          title="Total Connections"
          value={data.totalConnections || 0}
          icon={<BarChart3 size={20} />}
        />
        <KPICard
          title="Active"
          value={data.activeConnections || 0}
          icon={<Activity size={20} />}
        />
        <KPICard
          title="Success Rate"
          value={`${data.successRate || 0}%`}
          icon={<CheckCircle size={20} />}
        />
        <KPICard
          title="Logs (24h)"
          value={data.logsLast24h || 0}
          icon={<Activity size={20} />}
        />
      </div>
      <div className="ui-grid-3">
        <Card padding="md">
          <h3 className="text-xs font-semibold m-0 mb-2">Webhook Stats</h3>
          <div className="ui-stack-1">
            <p className="m-0 text-xs">Total Deliveries: {data.totalDeliveries || 0}</p>
            <p className="m-0 text-xs">Success: {data.successDeliveries || 0}</p>
            <p className="m-0 text-xs">Failed: {data.failedDeliveries || 0}</p>
          </div>
        </Card>
        <Card padding="md">
          <h3 className="text-xs font-semibold m-0 mb-2">Rate Limits</h3>
          <p className="m-0 text-xs">Configs: {data.totalRateLimits || 0}</p>
        </Card>
        <Card padding="md">
          <h3 className="text-xs font-semibold m-0 mb-2">Activity (24h)</h3>
          <p className="m-0 text-xs">Log Entries: {data.logsLast24h || 0}</p>
        </Card>
      </div>
    </div>
  );
}
