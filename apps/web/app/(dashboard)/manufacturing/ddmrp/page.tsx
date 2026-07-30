// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, Button, Badge, KPICard, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  Layers,
  BarChart4,
  GitBranch,
  Bell,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "buffers",
    label: "Buffer Status",
    href: "/manufacturing/ddmrp?tab=buffers",
  },
  {
    id: "recs",
    label: "Recommendations",
    href: "/manufacturing/ddmrp?tab=recs",
  },
];

interface Dashboard {
  totalParts: number;
  zoneDistribution: {
    GREEN: number;
    YELLOW: number;
    RED: number;
    RED_ALERT: number;
  };
  openRecommendations: number;
  criticalRecommendations: number;
  recommendations: Array<{
    id: string;
    recommendation: string;
    priority: string;
    quantity: number;
    reason: string;
    createdAt: string;
  }>;
  recentStatusChanges: Array<{
    id: string;
    zone: string;
    netFlow: number;
    recordedAt: string;
  }>;
}

export default function DdmrpPage() {
  const client = useApiClient();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "buffers";

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(
        await client.get<Dashboard>("/manufacturing/ddmrp/dashboard"),
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
    <RouteGuard permission="manufacturing.ddmrp.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Demand Driven MRP"
          description="Strategic inventory positioning, buffer management, net flow equation"
          breadcrumbs={[
            { label: "Manufacturing", href: "/manufacturing" },
            { label: "DDMRP" },
          ]}
        />

        {dashboard && (
          <div className="ui-grid-auto">
            <KPICard
              title="Total Parts"
              value={dashboard.totalParts}
              icon={<Layers size={20} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="Green Zone"
              value={dashboard.zoneDistribution.GREEN}
              icon={<CheckCircle2 size={20} />}
              color="var(--color-success)"
            />
            <KPICard
              title="Yellow Zone"
              value={dashboard.zoneDistribution.YELLOW}
              icon={<BarChart4 size={20} />}
              color="var(--color-warning)"
            />
            <KPICard
              title="Red Zone"
              value={dashboard.zoneDistribution.RED}
              icon={<AlertCircle size={20} />}
              color="var(--color-danger)"
            />
            <KPICard
              title="Critical Recs"
              value={dashboard.criticalRecommendations}
              icon={<Bell size={20} />}
              color="var(--color-danger)"
            />
          </div>
        )}

        {dashboard && dashboard.criticalRecommendations > 0 && (
          <Card padding="md">
            <div className="ui-flex-row gap-2 items-center text-danger">
              <AlertCircle size={16} />
              <span className="ui-text-sm font-semibold">
                {dashboard.criticalRecommendations} critical recommendation(s)
                require immediate attention
              </span>
            </div>
          </Card>
        )}

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "buffers" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Buffer Status — Net Flow = On Hand + On Order - Qualified Spike
              Demand.
            </p>
          </Card>
        )}

        {activeTab === "recs" && dashboard && (
          <div className="ui-stack-3">
            {dashboard.recommendations.map((r) => (
              <Card key={r.id} padding="md">
                <div className="ui-flex-between">
                  <span className="font-semibold">
                    {r.recommendation} (Qty: {r.quantity})
                  </span>
                  <Badge variant={r.priority === "HIGH" ? "danger" : "warning"}>
                    {r.priority}
                  </Badge>
                </div>
                <p className="ui-text-micro ui-mt-1">{r.reason}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
