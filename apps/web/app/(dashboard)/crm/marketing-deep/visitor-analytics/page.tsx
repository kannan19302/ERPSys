"use client";

import React, { useState, useEffect } from "react";
import { PageHeader, Card, Spinner, Badge, DataTable } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import type { Column } from "@unerp/ui";

function VisitorAnalyticsPage() {
  const client = useApiClient();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/crm/marketing-deep/visitor-analytics")
      .then((res: any) => setAnalytics(res))
      .catch(() => {
        /* ignore */
      })
      .finally(() => setLoading(false));
  }, []);

  const sourceColumns: Column<any>[] = [
    { key: "source", header: "Source" },
    { key: "count", header: "Visitors" },
    { key: "percentage", header: "%", render: (v: number) => `${v}%` },
  ];

  const visitorColumns: Column<any>[] = [
    { key: "visitorId", header: "Visitor ID" },
    {
      key: "source",
      header: "Source",
      render: (v: string | null) => v || "DIRECT",
    },
    { key: "pageViews", header: "Page Views" },
    {
      key: "timeOnSite",
      header: "Time (s)",
      render: (v: number | null) => v ?? 0,
    },
    {
      key: "lastSeen",
      header: "Last Seen",
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Web Visitor Analytics"
        description="Analyze web traffic sources, visitor behavior, and conversion patterns"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Marketing Deep", href: "/crm/marketing-deep" },
          { label: "Visitor Analytics" },
        ]}
      />
      {analytics && (
        <div className="ui-stack-4">
          <div className="ui-grid-4">
            <Card>
              <div className="ui-text-center">
                <div className="ui-text-2xl ui-font-bold">
                  {analytics.totalVisitors}
                </div>
                <div className="ui-text-muted">Total Visitors</div>
              </div>
            </Card>
            <Card>
              <div className="ui-text-center">
                <div className="ui-text-2xl ui-font-bold">
                  {analytics.totalPageViews}
                </div>
                <div className="ui-text-muted">Page Views</div>
              </div>
            </Card>
            <Card>
              <div className="ui-text-center">
                <div className="ui-text-2xl ui-font-bold">
                  {analytics.avgTimeOnSite}s
                </div>
                <div className="ui-text-muted">Avg Time</div>
              </div>
            </Card>
            <Card>
              <div className="ui-text-center">
                <div className="ui-text-2xl ui-font-bold">
                  {analytics.bySource?.length || 0}
                </div>
                <div className="ui-text-muted">Sources</div>
              </div>
            </Card>
          </div>
          <Card title="By Source">
            <DataTable
              columns={sourceColumns}
              data={analytics.bySource || []}
            />
          </Card>
          <Card title="Recent Visitors">
            <DataTable
              columns={visitorColumns}
              data={analytics.recentVisitors || []}
            />
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RouteGuard permission="crm.marketing-deep.landing-pages.read">
      <VisitorAnalyticsPage />
    </RouteGuard>
  );
}
