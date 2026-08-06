"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, Button, Badge, KPICard, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui/layout";
import { Zap, TrendingDown, BarChart3, FileText, Target } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "meters",
    label: "Energy Meters",
    href: "/manufacturing/energy?tab=meters",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/manufacturing/energy?tab=analytics",
  },
];

interface Dashboard {
  meterCount: number;
  totalRecentConsumption: number;
  targetCount: number;
  recentReadings: Array<{
    id: string;
    meter: { name: string; code: string };
    reading: number;
    unit: string;
    cost: number;
    recordedAt: string;
  }>;
  targets: Array<{
    id: string;
    kpiType: string;
    targetValue: number;
    unit: string;
  }>;
}

export default function EnergyPage() {
  const client = useApiClient();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "meters";

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(
        await client.get<Dashboard>("/manufacturing/energy/dashboard"),
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
    <RouteGuard permission="manufacturing.energy.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Energy Management"
          description="Track energy consumption, machine-level monitoring, KPIs, and cost allocation"
          breadcrumbs={[
            { label: "Manufacturing", href: "/manufacturing" },
            { label: "Energy" },
          ]}
        />

        {dashboard && (
          <div className="ui-grid-auto">
            <KPICard
              title="Energy Meters"
              value={dashboard.meterCount}
              icon={<Zap size={20} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="Recent Consumption"
              value={`${dashboard.totalRecentConsumption} kWh`}
              icon={<TrendingDown size={20} />}
              color="var(--color-warning)"
            />
            <KPICard
              title="KPI Targets"
              value={dashboard.targetCount}
              icon={<Target size={20} />}
              color="var(--color-success)"
            />
          </div>
        )}

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "meters" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Register and manage energy meters (electricity, water, gas,
              steam).
            </p>
            <div className="ui-mt-4">
              <Button variant="primary" disabled>
                Register Meter
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "analytics" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Monitor machine-level energy consumption and carbon equivalent
              emissions.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
