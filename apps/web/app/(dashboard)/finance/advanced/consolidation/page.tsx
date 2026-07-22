"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  type Column,
  KPICard,
  DashboardChart,
  Spinner,
} from "@unerp/ui";
import {
  Building2,
  DollarSign,
  TrendingUp,
  GitMerge,
  BarChart3,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";

interface Entity {
  id: string;
  name: string;
  currency: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  assets: number;
  status: "ACTIVE" | "INACTIVE";
}

interface QuarterTrend {
  name: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  [key: string]: unknown;
}

interface ConsolidationOverview {
  entities: Entity[];
  consolidated: {
    revenue: number;
    expenses: number;
    netIncome: number;
    assets: number;
    entityCount: number;
  };
  eliminations: { total: number; transfers: unknown[] };
  trend: QuarterTrend[];
}

const fmtFull = (n: number) => `$${n.toLocaleString()}`;

export default function ConsolidationPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("subtab") || "entities";
  const [overview, setOverview] = useState<ConsolidationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setOverview(
        await client.get<ConsolidationOverview>(
          "/advanced-finance/consolidation/overview",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const runConsolidation = async () => {
    setRunning(true);
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), 0, 1).toISOString();
      const periodEnd = now.toISOString();
      await client.post("/advanced-finance/consolidation/run", {
        periodStart,
        periodEnd,
        eliminateIntercompany: true,
      });
      await fetchOverview();
    } finally {
      setRunning(false);
    }
  };

  const entities = overview?.entities || [];
  const trend = overview?.trend || [];
  const totalRevenue = overview?.consolidated.revenue || 0;
  const totalNet = overview?.consolidated.netIncome || 0;
  const totalAssets = overview?.consolidated.assets || 0;

  const columns: Column<Entity>[] = [
    {
      key: "name",
      header: "Entity",
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={styles.s1}>
            <Building2 size={16} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.name}</div>
            <div className="ui-text-xs-tertiary">{row.currency}</div>
          </div>
        </div>
      ),
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right" as const,
      render: (row) => <span className="text-sm">{fmtFull(row.revenue)}</span>,
    },
    {
      key: "expenses",
      header: "Expenses",
      align: "right" as const,
      render: (row) => (
        <span className="ui-text-sm-muted">{fmtFull(row.expenses)}</span>
      ),
    },
    {
      key: "netIncome",
      header: "Net Income",
      align: "right" as const,
      render: (row) => (
        <span
          style={{
            color:
              row.netIncome >= 0
                ? "var(--color-success)"
                : "var(--color-danger)",
          }}
          className={styles.s2}
        >
          {fmtFull(row.netIncome)}
        </span>
      ),
    },
    {
      key: "assets",
      header: "Total Assets",
      align: "right" as const,
      render: (row) => <span className="text-sm">{fmtFull(row.assets)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "ACTIVE" ? "success" : "default"}>
          {row.status}
        </Badge>
      ),
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
    <RouteGuard permission="finance.consolidation.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Financial Consolidation"
          description="Multi-entity consolidated financial statements and inter-company eliminations"
          breadcrumbs={[
            { label: "Finance", href: "/finance" },
            { label: "Advanced", href: "/finance/advanced" },
            { label: "Consolidation" },
          ]}
          actions={
            <Button
              variant="primary"
              onClick={runConsolidation}
              disabled={running}
            >
              <GitMerge size={14} className="mr-2" />{" "}
              {running ? "Running…" : "Run Consolidation"}
            </Button>
          }
        />

        <div className={styles.s3}>
          <KPICard
            title="Consolidated Revenue"
            value={fmtFull(totalRevenue)}
            icon={<TrendingUp size={20} />}
            color="var(--color-success)"
          />
          <KPICard
            title="Consolidated Net Income"
            value={fmtFull(totalNet)}
            icon={<DollarSign size={20} />}
            color="var(--color-primary)"
          />
          <KPICard
            title="Consolidated Assets"
            value={fmtFull(totalAssets)}
            icon={<BarChart3 size={20} />}
            color="var(--color-info)"
          />
          <KPICard
            title="Entities"
            value={entities.length}
            icon={<Building2 size={20} />}
            color="var(--color-text-secondary)"
          />
        </div>

        {overview && overview.eliminations.total > 0 && (
          <Card padding="md">
            <div className={styles.s4}>
              <GitMerge size={14} />
              Inter-company eliminations netted from consolidated totals:{" "}
              <strong>{fmtFull(overview.eliminations.total)}</strong>
            </div>
          </Card>
        )}

        <SubTabBar
          tabs={
            [
              {
                id: "entities",
                label: "Entities",
                href: "/finance/advanced/consolidation?subtab=entities",
                icon: Building2,
              },
              {
                id: "trend",
                label: "Consolidated Trend",
                href: "/finance/advanced/consolidation?subtab=trend",
                icon: BarChart3,
              },
            ] as SubTab[]
          }
        />

        {activeTab === "entities" ? (
          <Card padding="none">
            <DataTable
              columns={columns}
              data={entities}
              rowKey={(r) => r.id}
              emptyTitle="No entities"
              emptyMessage="Add subsidiary organizations for consolidation."
              emptyIcon={<Building2 size={48} />}
            />
          </Card>
        ) : (
          <DashboardChart
            title="Quarterly Consolidated P&L"
            subtitle="Revenue, expenses, and net income across all entities"
            data={trend}
            config={{
              xAxisKey: "name",
              series: [
                { dataKey: "revenue", name: "Revenue", color: "#22c55e" },
                { dataKey: "expenses", name: "Expenses", color: "#ef4444" },
                { dataKey: "netIncome", name: "Net Income", color: "#6366f1" },
              ],
            }}
            defaultChartType="bar"
            allowedChartTypes={["bar", "area", "line", "stacked-bar"]}
            height={360}
          />
        )}
      </div>
    </RouteGuard>
  );
}
