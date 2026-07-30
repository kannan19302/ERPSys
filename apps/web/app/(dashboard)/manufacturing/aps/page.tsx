// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  type Column,
  KPICard,
  Spinner,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  CalendarClock,
  Play,
  BarChart3,
  GitBranch,
  Layers,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "scheduler",
    label: "Scheduler",
    href: "/manufacturing/aps?tab=scheduler",
  },
  {
    id: "schedules",
    label: "Recent Schedules",
    href: "/manufacturing/aps?tab=schedules",
  },
  {
    id: "constraints",
    label: "Constraints",
    href: "/manufacturing/aps?tab=constraints",
  },
];

interface Dashboard {
  totalSchedules: number;
  activeSchedules: number;
  constraintsByType: Record<string, number>;
  recentSchedules: Array<{
    id: string;
    name: string;
    algorithm: string;
    status: string;
    createdAt: string;
  }>;
}

export default function ApsPage() {
  const client = useApiClient();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "scheduler";

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(await client.get<Dashboard>("/manufacturing/aps/dashboard"));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  const scheduleColumns: Column<{
    id: string;
    name: string;
    algorithm: string;
    status: string;
    createdAt: string;
  }>[] = [
    { key: "name", header: "Name" },
    { key: "algorithm", header: "Algorithm" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "COMPLETED" ? "success" : "default"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <RouteGuard permission="manufacturing.aps.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Advanced Planning & Scheduling"
          description="Constraint-based APS with finite loading and what-if simulation"
          breadcrumbs={[
            { label: "Manufacturing", href: "/manufacturing" },
            { label: "APS" },
          ]}
        />

        {dashboard && (
          <div className="ui-grid-auto">
            <KPICard
              title="Total Schedules"
              value={dashboard.totalSchedules}
              icon={<Layers size={20} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="Active Schedules"
              value={dashboard.activeSchedules}
              icon={<CalendarClock size={20} />}
              color="var(--color-success)"
            />
          </div>
        )}

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "scheduler" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Run constraint-based scheduling algorithms
              (forward/backward/genetic).
            </p>
            <div className="ui-mt-4">
              <Button variant="primary" disabled>
                Run APS Engine
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "schedules" && dashboard && (
          <Card padding="none">
            <DataTable
              columns={scheduleColumns}
              data={dashboard.recentSchedules}
              rowKey={(r) => r.id}
            />
          </Card>
        )}

        {activeTab === "constraints" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Configure work center capacity constraints, tooling availability,
              and material dependencies.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
