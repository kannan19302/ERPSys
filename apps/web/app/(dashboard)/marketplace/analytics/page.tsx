"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, DataTable, Card } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { BarChart3, TrendingUp, DollarSign, Download } from "lucide-react";
import type { Column } from "@unerp/ui";

interface AnalyticsRecord {
  id: string; appId: string; date: string; installs: number; uninstalls: number; activeUsers: number; revenue: number;
}
interface AnalyticsResponse {
  items: AnalyticsRecord[];
  totals: { installs: number; uninstalls: number; revenue: number };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    const res = await fetch("/api/v1/marketplace/analytics?top=50");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const columns: Column<AnalyticsRecord>[] = [
    { id: "appId", header: "App ID", render: (r) => r.appId },
    { id: "date", header: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
    { id: "installs", header: "Installs", render: (r) => r.installs },
    { id: "uninstalls", header: "Uninstalls", render: (r) => r.uninstalls },
    { id: "activeUsers", header: "Active Users", render: (r) => r.activeUsers },
    { id: "revenue", header: "Revenue", render: (r) => `$${r.revenue.toFixed(2)}` },
  ];

  return (
    <RouteGuard permission="marketplace.analytics.read">
      <div className="ui-stack-6">
        <PageHeader title="Marketplace Analytics" description="Install trends, top apps, and revenue data." icon={BarChart3} breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: "Marketplace", href: "/marketplace" }, { label: "Analytics" }]} />
        <div className="ui-grid-3">
          <Card title="Total Installs" icon={TrendingUp}>{data?.totals.installs ?? 0}</Card>
          <Card title="Total Uninstalls" icon={Download}>{data?.totals.uninstalls ?? 0}</Card>
          <Card title="Total Revenue" icon={DollarSign}>${(data?.totals.revenue ?? 0).toFixed(2)}</Card>
        </div>
        <DataTable columns={columns} data={data?.items ?? []} loading={loading} sortable />
      </div>
    </RouteGuard>
  );
}
