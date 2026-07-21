"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  PageHeader,
  KPICard,
  DashboardChart,
  Card,
  DataTable,
  type Column,
  Spinner,
  Badge,
} from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Bell,
  RefreshCw,
} from "lucide-react";

interface DashboardSummary {
  openPurchaseOrders: number;
  inTransitShipments: number;
  deliveredThisMonth: number;
  activeSuppliers: number;
  totalSuppliers: number;
  inventoryItems: number;
  lowStockAlerts: number;
  totalInventoryUnits: number;
}

interface KpiMetric {
  current: number;
  target: number;
  unit: string;
  trend: "UP" | "DOWN" | "STABLE";
}

interface ControlTowerData {
  summary?: DashboardSummary;
  kpis?: {
    onTimeInFull?: KpiMetric;
    supplierFillRate?: KpiMetric;
    avgLeadTimeDays?: KpiMetric;
    inventoryTurns?: KpiMetric;
    procurementCycleTimeDays?: KpiMetric;
    perfectOrderRate?: KpiMetric;
  };
  recentAlerts?: Array<{
    id: string;
    type: string;
    message: string;
    severity: string;
    createdAt: string;
  }>;
}

interface Alert {
  id: string;
  module: string;
  type: string;
  message: string;
  severity: string;
  actionUrl: string | null;
}

interface KpiData {
  onTimeInFull?: KpiMetric;
  supplierFillRate?: KpiMetric;
  inventoryTurnover?: KpiMetric;
  avgLeadTime?: KpiMetric;
  perfectOrderRate?: KpiMetric;
  supplierCount?: {
    current: number;
    target: number;
    unit: string;
    trend: string;
  };
  history?: {
    onTimeInFull?: Array<{ period: string; value: number }>;
    inventoryTurnover?: Array<{ period: string; value: number }>;
  };
}

const fmtPct = (n: number) => `${n}%`;

export default function ScmControlTowerPage() {
  const client = useApiClient();
  const [dashboard, setDashboard] = useState<ControlTowerData>({});
  const [kpis, setKpis] = useState<KpiData>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const [dash, kpiData, alertData] = await Promise.allSettled([
          client.get<ControlTowerData>("/supply-chain/dashboard"),
          client.get<KpiData>("/supply-chain/kpis"),
          client.get<{ alerts: Alert[] }>("/supply-chain/alerts"),
        ]);
        if (dash.status === "fulfilled") setDashboard(dash.value);
        if (kpiData.status === "fulfilled") setKpis(kpiData.value);
        if (alertData.status === "fulfilled")
          setAlerts(alertData.value.alerts ?? []);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const s = dashboard.summary;
  const k = dashboard.kpis;

  const kpiHistory = kpis.history?.onTimeInFull ?? [];
  const invHistory = kpis.history?.inventoryTurnover ?? [];

  const otifChartData = kpiHistory.map((h) => ({
    name: h.period,
    value: h.value,
  }));
  const invChartData = invHistory.map((h) => ({
    name: h.period,
    value: h.value,
  }));

  const trendIcon = (trend?: string) => {
    if (trend === "UP")
      return <TrendingUp size={14} style={{ color: "var(--success-600)" }} />;
    if (trend === "DOWN")
      return <TrendingDown size={14} style={{ color: "var(--danger-600)" }} />;
    return <Activity size={14} style={{ color: "var(--neutral-400)" }} />;
  };

  const severityBadgeVariant = (
    severity: string,
  ): "danger" | "warning" | "info" => {
    if (severity === "HIGH" || severity === "CRITICAL") return "danger";
    if (severity === "MEDIUM") return "warning";
    return "info";
  };

  const alertCols: Column<Alert>[] = [
    {
      key: "module",
      header: "Module",
      render: (r) => <Badge variant="info">{r.module}</Badge>,
    },
    { key: "type", header: "Type", render: (r) => r.type.replace(/_/g, " ") },
    { key: "message", header: "Message", render: (r) => r.message },
    {
      key: "severity",
      header: "Severity",
      render: (r) => (
        <Badge variant={severityBadgeVariant(r.severity)}>{r.severity}</Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="ui-page">
        <PageHeader
          title="SCM Control Tower"
          description="Loading real-time supply chain overview..."
        />
        <div
          style={{ display: "flex", justifyContent: "center", padding: "4rem" }}
        >
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page">
      <PageHeader
        title="SCM Control Tower"
        description="Real-time supply chain KPIs, alerts, and cross-module visibility"
        actions={
          <button
            id="scm-refresh-btn"
            className="ui-btn ui-btn--secondary"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Cross-module Alerts Banner */}
      {alerts.filter((a) => a.severity === "HIGH").length > 0 && (
        <Card
          style={{
            border: "1px solid var(--danger-300)",
            background: "var(--danger-50)",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--danger-700)",
              fontWeight: 600,
            }}
          >
            <Bell size={16} />
            {alerts.filter((a) => a.severity === "HIGH").length} critical supply
            chain alert(s) require attention
          </div>
        </Card>
      )}

      {/* Summary KPI Cards */}
      <div className="ui-grid-4" style={{ marginBottom: "1.5rem" }}>
        <KPICard
          title="Open Purchase Orders"
          value={s?.openPurchaseOrders ?? 0}
          icon={<Package size={20} />}
          color="var(--primary-600)"
        />
        <KPICard
          title="In-Transit Shipments"
          value={s?.inTransitShipments ?? 0}
          icon={<Truck size={20} />}
          color="var(--warning-600)"
        />
        <KPICard
          title="Delivered This Month"
          value={s?.deliveredThisMonth ?? 0}
          icon={<CheckCircle size={20} />}
          color="var(--success-600)"
        />
        <KPICard
          title="Low Stock Alerts"
          value={s?.lowStockAlerts ?? 0}
          icon={<AlertTriangle size={20} />}
          color="var(--danger-600)"
        />
      </div>

      {/* Main KPIs */}
      <div className="ui-grid-3" style={{ marginBottom: "1.5rem" }}>
        {[
          {
            id: "kpi-otif",
            label: "On-Time In-Full",
            kpi: k?.onTimeInFull,
            metric: kpis.onTimeInFull,
          },
          {
            id: "kpi-fill",
            label: "Supplier Fill Rate",
            kpi: k?.supplierFillRate,
            metric: kpis.supplierFillRate,
          },
          {
            id: "kpi-por",
            label: "Perfect Order Rate",
            kpi: k?.perfectOrderRate,
            metric: kpis.perfectOrderRate,
          },
          {
            id: "kpi-lead",
            label: "Avg Lead Time",
            kpi: k?.avgLeadTimeDays,
            metric: kpis.avgLeadTime,
          },
          {
            id: "kpi-turns",
            label: "Inventory Turns",
            kpi: k?.inventoryTurns,
            metric: kpis.inventoryTurnover,
          },
          {
            id: "kpi-cycle",
            label: "Procurement Cycle",
            kpi: k?.procurementCycleTimeDays,
            metric: kpis.supplierFillRate,
          },
        ].map(({ id, label, metric }) => (
          <div
            id={id}
            key={id}
            className="ui-card"
            style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--neutral-500)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--neutral-900)",
                }}
              >
                {metric?.current ?? "—"}
                {metric?.unit === "%"
                  ? "%"
                  : metric?.unit
                    ? ` ${metric.unit}`
                    : ""}
              </span>
              {trendIcon(metric?.trend)}
            </div>
            {metric?.target && (
              <div style={{ fontSize: "0.75rem", color: "var(--neutral-400)" }}>
                Target: {metric.target}
                {metric?.unit === "%" ? "%" : ` ${metric.unit}`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="ui-grid-2" style={{ marginBottom: "1.5rem" }}>
        <Card>
          {otifChartData.length > 0 ? (
            <DashboardChart
              title="OTIF Rate — 6 Month Trend"
              data={otifChartData}
              config={{
                series: [
                  {
                    dataKey: "value",
                    name: "OTIF Rate %",
                    color: "var(--primary-600)",
                  },
                ],
                xAxisKey: "name",
              }}
              defaultChartType="line"
              height={200}
            />
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "var(--neutral-400)",
                padding: "3rem 0",
              }}
            >
              <LayoutDashboard size={32} />
              <p>No trend data yet</p>
            </div>
          )}
        </Card>
        <Card>
          {invChartData.length > 0 ? (
            <DashboardChart
              title="Inventory Turnover — 6 Month Trend"
              data={invChartData}
              config={{
                series: [
                  {
                    dataKey: "value",
                    name: "Turns",
                    color: "var(--success-600)",
                  },
                ],
                xAxisKey: "name",
              }}
              defaultChartType="bar"
              height={200}
            />
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "var(--neutral-400)",
                padding: "3rem 0",
              }}
            >
              <LayoutDashboard size={32} />
              <p>No trend data yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          <Bell size={16} style={{ color: "var(--warning-600)" }} />
          <h3
            style={{
              margin: 0,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--neutral-700)",
            }}
          >
            Cross-Module Supply Chain Alerts
          </h3>
        </div>
        {alerts.length > 0 ? (
          <DataTable
            columns={alertCols}
            data={alerts}
            emptyMessage="No active alerts"
          />
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "var(--success-600)",
              padding: "2rem 0",
            }}
          >
            <CheckCircle size={28} />
            <p style={{ marginTop: "0.5rem" }}>
              All clear — no active supply chain alerts
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
