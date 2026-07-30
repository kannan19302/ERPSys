// @ts-nocheck
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Tabs, Spinner, Card, Badge, DataTable } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { BarChart3, Calendar, Target, DollarSign } from "lucide-react";
import type { Column } from "@unerp/ui";

const TAB_KEYS = ["roi", "calendar"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function MarketingDeepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useApiClient();
  const initialTab = isTabKey(searchParams.get("tab"))
    ? (searchParams.get("tab") as TabKey)
    : "roi";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [summary, setSummary] = useState<any>(null);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client
        .get("/crm/marketing-deep/performance-summary")
        .catch(() => ({ campaigns: [], totals: {} })),
      client.get("/crm/marketing-deep/calendar").catch(() => []),
    ]).then(([s, c]) => {
      setSummary(s);
      setCalendar(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string) => {
    if (!isTabKey(key)) return;
    setActiveTab(key);
    router.replace(`/crm/marketing-deep?tab=${key}`, { scroll: false });
  };

  const roiColumns: Column<any>[] = [
    { key: "name", header: "Campaign" },
    {
      key: "status",
      header: "Status",
      render: (v: string) => <Badge>{v}</Badge>,
    },
    { key: "leads", header: "Leads" },
    { key: "opportunitiesWon", header: "Won" },
    {
      key: "revenue",
      header: "Revenue",
      render: (v: number) => `$${v.toLocaleString()}`,
    },
    {
      key: "cost",
      header: "Cost",
      render: (v: number) => `$${v.toLocaleString()}`,
    },
    { key: "roi", header: "ROI %", render: (v: number) => `${v}%` },
  ];

  const calColumns: Column<any>[] = [
    { key: "title", header: "Title" },
    {
      key: "entryType",
      header: "Type",
      render: (v: string) => <Badge>{v}</Badge>,
    },
    {
      key: "startDate",
      header: "Start",
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "endDate",
      header: "End",
      render: (v: string | null) =>
        v ? new Date(v).toLocaleDateString() : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (v: string) => (
        <Badge
          variant={
            v === "COMPLETED"
              ? "success"
              : v === "CANCELLED"
                ? "danger"
                : "info"
          }
        >
          {v}
        </Badge>
      ),
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
        title="Marketing Deep"
        description="Campaign ROI, marketing calendar, landing pages, and attribution analytics"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Marketing Deep" },
        ]}
      />

      <Tabs
        tabs={[
          { key: "roi", label: "Campaign ROI", icon: <BarChart3 size={14} /> },
          { key: "calendar", label: "Calendar", icon: <Calendar size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === "roi" ? "block" : "none" }}>
        {summary && (
          <div className="ui-stack-4">
            <div className="ui-grid-3">
              <Card>
                <div className="ui-text-center">
                  <div className="ui-text-2xl ui-font-bold">
                    ${(summary.totals?.revenue || 0).toLocaleString()}
                  </div>
                  <div className="ui-text-muted">Total Revenue</div>
                </div>
              </Card>
              <Card>
                <div className="ui-text-center">
                  <div className="ui-text-2xl ui-font-bold">
                    ${(summary.totals?.cost || 0).toLocaleString()}
                  </div>
                  <div className="ui-text-muted">Total Cost</div>
                </div>
              </Card>
              <Card>
                <div className="ui-text-center">
                  <div className="ui-text-2xl ui-font-bold">
                    {summary.totals?.leads || 0}
                  </div>
                  <div className="ui-text-muted">Total Leads</div>
                </div>
              </Card>
            </div>
            <Card>
              <DataTable columns={roiColumns} data={summary.campaigns || []} />
            </Card>
          </div>
        )}
      </div>

      <div style={{ display: activeTab === "calendar" ? "block" : "none" }}>
        <Card>
          <DataTable columns={calColumns} data={calendar} />
        </Card>
      </div>
    </div>
  );
}

export default function MarketingDeepPage() {
  return (
    <RouteGuard permission="crm.marketing-deep.attribution.read">
      <Suspense
        fallback={
          <div className="ui-center-pad">
            <Spinner size="lg" />
          </div>
        }
      >
        <MarketingDeepContent />
      </Suspense>
    </RouteGuard>
  );
}
