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
  Wrench,
  CalendarCheck,
  Activity,
  Ruler,
  AlertTriangle,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "tools",
    label: "Tool Inventory",
    href: "/manufacturing/tooling?tab=tools",
  },
  {
    id: "calibration",
    label: "Calibration Schedule",
    href: "/manufacturing/tooling?tab=calibration",
  },
];

interface Dashboard {
  totalTools: number;
  available: number;
  inUse: number;
  inCalibration: number;
  retired: number;
  dueCalibrationCount: number;
  dueCalibration: Array<{
    id: string;
    name: string;
    code: string;
    nextCalibrationDate: string;
  }>;
}

export default function ToolingPage() {
  const client = useApiClient();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "tools";

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(
        await client.get<Dashboard>("/manufacturing/tooling/dashboard"),
      );
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

  return (
    <RouteGuard permission="manufacturing.tooling.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Tooling & Gage Management"
          description="Tool crib, calibration scheduling, gage R&R studies"
          breadcrumbs={[
            { label: "Manufacturing", href: "/manufacturing" },
            { label: "Tooling" },
          ]}
        />

        {dashboard && (
          <div className="ui-grid-auto">
            <KPICard
              title="Total Tools"
              value={dashboard.totalTools}
              icon={<Wrench size={20} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="Available"
              value={dashboard.available}
              icon={<Activity size={20} />}
              color="var(--color-success)"
            />
            <KPICard
              title="In Use"
              value={dashboard.inUse}
              icon={<Ruler size={20} />}
              color="var(--color-warning)"
            />
            <KPICard
              title="Due Calibration"
              value={dashboard.dueCalibrationCount}
              icon={<CalendarCheck size={20} />}
              color="var(--color-danger)"
            />
          </div>
        )}

        {dashboard && dashboard.dueCalibration.length > 0 && (
          <Card padding="md">
            <div className="ui-flex-row gap-2 items-center">
              <AlertTriangle size={16} className="text-warning" />
              <span className="ui-text-sm">
                {dashboard.dueCalibration.length} tool(s) due for calibration
                within 30 days
              </span>
            </div>
          </Card>
        )}

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "tools" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Tool Crib — track tool location, check-in/out status, and tool
              life cycle.
            </p>
          </Card>
        )}

        {activeTab === "calibration" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Calibration Schedule — NIST traceable calibration logs and gage
              R&R studies.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
