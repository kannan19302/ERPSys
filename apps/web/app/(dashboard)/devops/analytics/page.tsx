"use client";
import React, { useState, useEffect } from "react";
import { Card, KPICard, Spinner, DataTable, type Column } from "@unerp/ui";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface Analytics {
  id: string;
  period: string;
  periodStart: string;
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  rollbackCount: number;
  avgDuration: number;
  p95Duration: number;
  deploymentsByEnv: Record<string, number>;
  deploymentsByApp: Record<string, number>;
}

export default function DevopsAnalyticsPage() {
  const [items, setItems] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/devops/analytics")
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

  const latest = items[0] || {
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    rollbackCount: 0,
    avgDuration: 0,
  };
  const successRate =
    latest.totalDeployments > 0
      ? Math.round(
          (latest.successfulDeployments / latest.totalDeployments) * 100,
        )
      : 0;

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Deployment Analytics</h1>
      </div>
      <div className="ui-grid-4">
        <KPICard
          title="Total Deployments"
          value={latest.totalDeployments}
          icon={<BarChart3 size={20} />}
        />
        <KPICard
          title="Success Rate"
          value={`${successRate}%`}
          icon={<CheckCircle size={20} />}
          variant={successRate > 90 ? "success" : "warning"}
        />
        <KPICard
          title="Failed"
          value={latest.failedDeployments}
          icon={<AlertTriangle size={20} />}
          variant="danger"
        />
        <KPICard
          title="Avg Duration"
          value={
            latest.avgDuration ? `${Math.round(latest.avgDuration)}s` : "N/A"
          }
          icon={<TrendingUp size={20} />}
        />
      </div>
    </div>
  );
}
