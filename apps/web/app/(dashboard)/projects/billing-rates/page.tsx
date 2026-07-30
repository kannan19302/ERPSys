// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Badge, DataTable, type Column, Spinner } from "@unerp/ui";
import { DollarSign } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface BillingRate {
  id: string;
  role: string;
  hourlyRate: number;
  dailyRate: number | null;
  currency: string;
  isActive: boolean;
  projectName: string | null;
}

const fmtCurrency = (n: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);

export default function BillingRatesPage() {
  const client = useApiClient();
  const [rates, setRates] = useState<BillingRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await client.get<BillingRate[] | { data?: BillingRate[] }>(
        "/projects/billing-rates",
      );
      setRates(Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<BillingRate>[] = [
    { key: "role", header: "Role" },
    {
      key: "hourlyRate",
      header: "Hourly Rate",
      align: "right",
      render: (row) => fmtCurrency(row.hourlyRate, row.currency),
    },
    {
      key: "dailyRate",
      header: "Daily Rate",
      align: "right",
      render: (row) =>
        row.dailyRate ? fmtCurrency(row.dailyRate, row.currency) : "-",
    },
    { key: "currency", header: "Currency" },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "default"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "projectName",
      header: "Project",
      render: (row) => row.projectName || "Global",
    },
  ];

  if (loading) {
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RouteGuard permission="projects.billing-rates.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Billing Rates"
          description="Configure project billing rates and roles"
          breadcrumbs={[
            { label: "Projects", href: "/projects" },
            { label: "Billing Rates" },
          ]}
        />
        <DataTable
          columns={columns}
          data={rates}
          rowKey={(r) => r.id}
          emptyTitle="No Billing Rates"
          emptyMessage="Add billing rates for roles to track project costs and billing."
          emptyIcon={<DollarSign size={48} />}
        />
      </div>
    </RouteGuard>
  );
}
