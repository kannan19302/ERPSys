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
import {
  Factory,
  Truck,
  PackageCheck,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface Dashboard {
  activeManufacturers: number;
  activePOCount: number;
  totalPoValue: number;
  activePOs: Array<{
    id: string;
    orderNo: string;
    contractMfg: { name: string };
    totalAmount: number;
    status: string;
    expectedDate: string;
  }>;
  recentReceipts: Array<{
    id: string;
    receiptNo: string;
    contractMfg: { name: string };
    status: string;
    receivedAt: string;
  }>;
}

export default function ContractMfgPage() {
  const client = useApiClient();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(
        await client.get<Dashboard>("/manufacturing/contract-mfg/dashboard"),
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

  const poColumns: Column<{
    id: string;
    orderNo: string;
    contractMfg: { name: string };
    totalAmount: number;
    status: string;
  }>[] = [
    { key: "orderNo", header: "PO #" },
    {
      key: "contractMfg",
      header: "Manufacturer",
      render: (r) => r.contractMfg.name,
    },
    {
      key: "totalAmount",
      header: "Amount",
      render: (r) => `$${Number(r.totalAmount).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "RECEIVED" ? "success" : "default"}>
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <RouteGuard permission="manufacturing.contract-mfg.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Contract Manufacturing"
          description="Outsource production, manage co-packers, receive subcontracted goods"
          breadcrumbs={[
            { label: "Manufacturing", href: "/manufacturing" },
            { label: "Contract MFG" },
          ]}
        />

        {dashboard && (
          <div className="ui-grid-auto">
            <KPICard
              title="Active Manufacturers"
              value={dashboard.activeManufacturers}
              icon={<Factory size={20} />}
              color="var(--color-primary)"
            />
            <KPICard
              title="Active POs"
              value={dashboard.activePOCount}
              icon={<ClipboardList size={20} />}
              color="var(--color-warning)"
            />
            <KPICard
              title="Total PO Value"
              value={`$${dashboard.totalPoValue.toLocaleString()}`}
              icon={<DollarSign size={20} />}
              color="var(--color-success)"
            />
          </div>
        )}

        <div className="ui-grid-2">
          <Card padding="md" title="Active Purchase Orders">
            {dashboard && dashboard.activePOs.length > 0 ? (
              <DataTable
                columns={poColumns}
                data={dashboard.activePOs}
                rowKey={(r) => r.id}
              />
            ) : (
              <p className="ui-text-tertiary">No active outsourcing POs.</p>
            )}
          </Card>
          <Card padding="md" title="Quick Actions">
            <div className="ui-stack-3">
              <Button variant="primary" disabled>
                <Factory size={14} /> Register Manufacturer
              </Button>
              <Button variant="outline" disabled>
                <ClipboardList size={14} /> Create Outsourcing PO
              </Button>
              <Button variant="outline" disabled>
                <PackageCheck size={14} /> Receive Goods
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
