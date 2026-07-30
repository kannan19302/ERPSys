// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  type Column,
  Spinner,
  StatusBadge,
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { Target, BarChart3 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "targets",
    label: "Targets",
    href: "/supply-chain/sustainability?tab=targets",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/supply-chain/sustainability?tab=dashboard",
  },
];

export default function SustainabilityPage() {
  const client = useApiClient();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "targets";

  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get<any>("/supply-chain/sustainability/targets")
      .then((res: any) => setTargets(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    {
      key: "targetName",
      header: "Target",
      render: (r) => <span className="ui-link">{r.targetName}</span>,
    },
    {
      key: "targetType",
      header: "Type",
      render: (r) => (
        <Badge variant={r.targetType === "REDUCTION" ? "success" : "primary"}>
          {r.targetType}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="supply-chain.sustainability.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Sustainability & Carbon Tracking"
          description="Carbon emissions, sustainability targets, offsets, and ESG reporting"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "Sustainability" },
          ]}
        />

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "targets" && (
          <Card padding="none">
            <DataTable
              columns={columns}
              data={targets}
              loading={loading}
              rowKey={(r) => r.id}
              emptyTitle="No targets"
              emptyMessage="Set your first sustainability target."
              emptyIcon={<Target size={48} />}
            />
          </Card>
        )}

        {activeTab === "dashboard" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Scope 1, 2, 3 carbon emissions tracking, ESG compliance rating,
              and sustainability targets.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
