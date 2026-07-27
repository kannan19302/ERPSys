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
          variant="success"
        />
        <KPICard
          title="Success Rate"
          value={`${data.successRate || 0}%`}
          icon={<CheckCircle size={20} />}
          variant={data.successRate > 90 ? "success" : "warning"}
        />
        <KPICard
          title="Logs (24h)"
          value={data.logsLast24h || 0}
          icon={<Activity size={20} />}
        />
      </div>
      <div className="ui-grid-3">
        <Card title="Webhook Stats">
          <div className="p-4">
            <p>Total Deliveries: {data.totalDeliveries || 0}</p>
            <p>Success: {data.successDeliveries || 0}</p>
            <p>Failed: {data.failedDeliveries || 0}</p>
          </div>
        </Card>
        <Card title="Rate Limits">
          <div className="p-4">
            <p>Configs: {data.totalRateLimits || 0}</p>
          </div>
        </Card>
        <Card title="Activity (24h)">
          <div className="p-4">
            <p>Log Entries: {data.logsLast24h || 0}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
