// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, Button, Badge, KPICard, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  KanbanSquare,
  Lightbulb,
  TrendingUp,
  Map,
  AlertTriangle,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  { id: "kanban", label: "Kanban", href: "/manufacturing/lean?tab=kanban" },
  { id: "kaizen", label: "Kaizen", href: "/manufacturing/lean?tab=kaizen" },
];

interface Dashboard {
  activeBoards: number;
  totalImprovements: number;
  implemented: number;
  wasteLogs: number;
  wasteCost: number;
  wasteByType: Record<string, { count: number; totalCost: number }>;
}

export default function LeanPage() {
  const client = useApiClient();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "kanban";

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(
        await client.get<Dashboard>("/manufacturing/lean/dashboard"),
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
    <RouteGuard permission="manufacturing.lean.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Lean Manufacturing"
          description="Kanban, continuous improvement, waste tracking, value stream mapping"
          breadcrumbs={[
            { label: "Manufacturing", href: "/manufacturing" },
            { label: "Lean" },
          ]}
        />

        {dashboard && (
          <div className="ui-grid-auto">
            <KPICard
              title="Active Boards"
              value={dashboard.activeBoards}
              icon={<KanbanSquare size={20} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="Improvements"
              value={dashboard.totalImprovements}
              icon={<Lightbulb size={20} />}
              color="var(--color-warning)"
            />
            <KPICard
              title="Implemented"
              value={dashboard.implemented}
              icon={<TrendingUp size={20} />}
              color="var(--color-success)"
            />
            <KPICard
              title="Waste Logs"
              value={dashboard.wasteLogs}
              icon={<AlertTriangle size={20} />}
              color="var(--color-danger)"
            />
          </div>
        )}

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "kanban" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Visual production and inventory pull systems with WIP limits.
            </p>
            <div className="ui-mt-4">
              <Button variant="primary" disabled>
                Create Kanban Board
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "kaizen" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Continuous improvement (Kaizen) ideas, implementation tracking,
              and ROI.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
