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
import { DollarSign, BarChart3 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "programs",
    label: "Programs",
    href: "/supply-chain/supply-chain-finance?tab=programs",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/supply-chain/supply-chain-finance?tab=dashboard",
  },
];

export default function SupplyChainFinancePage() {
  const client = useApiClient();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "programs";

  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get<any>("/supply-chain/finance/programs")
      .then((res: any) => setPrograms(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    {
      key: "programName",
      header: "Program Name",
      render: (r) => <span className="ui-link">{r.programName}</span>,
    },
    {
      key: "programType",
      header: "Type",
      render: (r) => <Badge variant="info">{r.programType}</Badge>,
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="supply-chain.finance.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Supply Chain Finance"
          description="Invoice factoring, dynamic discounting, reverse factoring programs"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "Finance" },
          ]}
        />

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "programs" && (
          <Card padding="none">
            <DataTable
              columns={columns}
              data={programs}
              loading={loading}
              rowKey={(r) => r.id}
              emptyTitle="No programs"
              emptyMessage="Create your first SCF program."
              emptyIcon={<DollarSign size={48} />}
            />
          </Card>
        )}

        {activeTab === "dashboard" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Supply chain factoring, prompt payment discounts, and liquidity
              program analytics.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
