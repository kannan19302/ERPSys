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
} from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { Layers, GitBranch, BarChart3 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  { id: "models", label: "Models", href: "/supply-chain/meio?tab=models" },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/supply-chain/meio?tab=dashboard",
  },
];

export default function MeioPage() {
  const client = useApiClient();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "models";

  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get<any>("/supply-chain/meio/models")
      .then((res: any) => setModels(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    {
      key: "modelName",
      header: "Model Name",
      render: (r) => <span className="ui-link">{r.modelName}</span>,
    },
    {
      key: "modelType",
      header: "Type",
      render: (r) => <Badge variant="info">{r.modelType}</Badge>,
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="supply-chain.meio.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Multi-Echelon Inventory Optimization"
          description="MEIO modeling, optimal stocking, scenario simulation"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "MEIO" },
          ]}
        />

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "models" && (
          <Card padding="none">
            <DataTable
              columns={columns}
              data={models}
              loading={loading}
              rowKey={(r) => r.id}
              emptyTitle="No models"
              emptyMessage="Build your first MEIO model."
              emptyIcon={<GitBranch size={48} />}
            />
          </Card>
        )}

        {activeTab === "dashboard" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Multi-echelon safety stock optimization and holding cost savings.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
