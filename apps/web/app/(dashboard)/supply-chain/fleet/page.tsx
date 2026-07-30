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
import { Truck, Plus, BarChart3 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "vehicles",
    label: "Vehicles",
    href: "/supply-chain/fleet?tab=vehicles",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/supply-chain/fleet?tab=analytics",
  },
];

export default function FleetPage() {
  const client = useApiClient();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "vehicles";

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get<any>("/supply-chain/fleet/vehicles")
      .then((res: any) => setVehicles(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    {
      key: "vin",
      header: "VIN / ID",
      render: (r) => <span className="ui-link">{r.vin ?? r.id}</span>,
    },
    {
      key: "makeModel",
      header: "Make & Model",
      render: (r) => `${r.make ?? ""} ${r.model ?? ""}`,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status ?? "ACTIVE"} />,
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="supply-chain.fleet.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Fleet Management"
          description="Manage vehicles, drivers, maintenance, fuel, and trips"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "Fleet" },
          ]}
        />

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "vehicles" && (
          <Card padding="none">
            <DataTable
              columns={columns}
              data={vehicles}
              loading={loading}
              rowKey={(r) => r.id}
              emptyTitle="No vehicles"
              emptyMessage="Add your first fleet vehicle."
              emptyIcon={<Truck size={48} />}
            />
          </Card>
        )}

        {activeTab === "analytics" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Fleet utilization, fuel consumption trends, and telematics
              analysis.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
