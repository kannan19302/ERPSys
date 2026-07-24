"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Modal, PageHeader, Button, Spinner, useToast } from "@unerp/ui";
import { ListView, FormView, RouteGuard, useApiClient } from "@unerp/framework";
import { DashboardChart } from "@unerp/ui-charts";
import { invoiceResource } from "@/modules/finance";
import { MultiPageDashboard } from "@/components/dashboard/MultiPageDashboard";
import {
  FileText,
  TrendingUp,
  DollarSign,
  BookOpen,
  Building2,
  Wallet,
  Calculator,
  PieChart,
  BarChart3,
  Plus,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface DashboardKPIs {
  totalRevenueYtd: number;
  totalRevenue: number;
  outstandingAr: number;
  pendingAp: number;
  netCashBalance: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  paymentRate: number;
  bankAccounts: number;
}

interface DashboardCharts {
  revenueTrend: Array<{ month: string; revenue: number; invoices: number }>;
  statusDistribution: Array<{ name: string; value: number; amount: number }>;
  arAgingChart: Array<{ bucket: string; amount: number }>;
  topCustomers: Array<{ name: string; revenue: number; invoices: number }>;
  paymentMethodChart: Array<{ name: string; value: number }>;
  cashFlowTrend: Array<{ month: string; inflows: number; outflows: number }>;
  accountTypeChart: Array<{ name: string; value: number }>;
}

interface DashboardData {
  kpis: DashboardKPIs;
  charts: DashboardCharts;
}

interface ComplianceSummary {
  periodName: string | null;
  closePct: number | null;
  bankAccountCount: number | null;
  icEliminationsRun: boolean | null;
}

const EMPTY_COMPLIANCE: ComplianceSummary = {
  periodName: null,
  closePct: null,
  bankAccountCount: null,
  icEliminationsRun: null,
};

const EMPTY_KPIS: DashboardKPIs = {
  totalRevenueYtd: 0,
  totalRevenue: 0,
  outstandingAr: 0,
  pendingAp: 0,
  netCashBalance: 0,
  totalInvoices: 0,
  paidInvoices: 0,
  overdueInvoices: 0,
  paymentRate: 0,
  bankAccounts: 0,
};

const EMPTY_CHARTS: DashboardCharts = {
  revenueTrend: [],
  statusDistribution: [],
  arAgingChart: [],
  topCustomers: [],
  paymentMethodChart: [],
  cashFlowTrend: [],
  accountTypeChart: [],
};

// ─── Format helpers ────────────────────────────────────────────────────────
function fmt(n: number, compact = true) {
  if (compact && n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (compact && n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

// ─── Rich KPI Card ─────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card padding="md">
      <div className="ui-stack-1">
        <div className="ui-flex-between">
          <span className="ui-text-xs-muted font-medium ui-truncate">
            {label}
          </span>
          <div
            className="ui-flex-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-md)",
              background: `${color}18`,
              color,
              flexShrink: 0,
            }}
          >
            <Icon size={15} />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-bold ui-truncate"
            style={{ color: "var(--color-text)", letterSpacing: "-0.02em" }}
          >
            {value}
          </span>
          {trend === "up" && (
            <ArrowUpRight size={14} className="ui-text-success" />
          )}
          {trend === "down" && (
            <ArrowDownRight size={14} className="ui-text-danger" />
          )}
        </div>
        {sub && <p className="ui-text-xs-tertiary ui-truncate m-0">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── Sub-module Nav Card ────────────────────────────────────────────────────
function NavCard({
  title,
  desc,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  onClick: () => void;
}) {
  return (
    <Card
      padding="sm"
      className="cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="ui-hstack-2">
        <div
          className="ui-flex-center"
          style={{
            width: 30,
            height: 30,
            borderRadius: "var(--radius-md)",
            background: `${color}15`,
            color,
            flexShrink: 0,
          }}
        >
          <Icon size={16} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 className="text-xs font-semibold ui-truncate m-0">{title}</h4>
          <p className="ui-text-micro ui-truncate m-0">{desc}</p>
        </div>
        <ArrowRight
          size={13}
          className="ui-text-tertiary"
          style={{ flexShrink: 0 }}
        />
      </div>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function FinanceDashboardPage() {
  const router = useRouter();
  const client = useApiClient();
  const { success, error: notifyError } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    kpis: EMPTY_KPIS,
    charts: EMPTY_CHARTS,
  });
  const [compliance, setCompliance] =
    useState<ComplianceSummary>(EMPTY_COMPLIANCE);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<DashboardData>("/finance/dashboard");
      if (res) {
        setData(res);
        setDataError(null);
      }
    } catch (err) {
      // Distinct error state — never let a fetch failure render as "$0 / no
      // activity". Previously-loaded KPIs/charts are preserved (not blanked).
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setDataError(message);
      notifyError("Failed to load Finance dashboard", message);
    } finally {
      setLoading(false);
    }
  }, [client, notifyError]);

  const fetchCompliance = useCallback(async () => {
    try {
      const periodsRes = await client.get<{
        data: Array<{ id: string; name: string; status: string }>;
      }>("/finance/close/financial-periods");
      const openPeriod = periodsRes?.data?.find((p) => p.status === "OPEN");

      let closePct: number | null = null;
      if (openPeriod) {
        const dash = await client
          .get<{
            totalTasks: number;
            completionPercent: number;
          }>(
            `/advanced-finance/close-tasks/dashboard?periodId=${openPeriod.id}`,
          )
          .catch(() => null);
        if (dash && dash.totalTasks > 0) {
          closePct = Math.round(dash.completionPercent);
        }
      }

      const bankAccounts = await client
        .list<{
          id: string;
        }>("/advanced-finance/bank-accounts", { pageSize: 1 })
        .catch(() => null);

      const icRuns = await client
        .get<
          Array<{ status: string }>
        >("/advanced-finance/intercompany/elimination-runs")
        .catch(() => null);

      setCompliance({
        periodName: openPeriod?.name ?? null,
        closePct,
        bankAccountCount: bankAccounts?.total ?? null,
        icEliminationsRun: Array.isArray(icRuns) ? icRuns.length > 0 : null,
      });
    } catch {
      // Leave as empty/unknown — never show fabricated compliance status
    }
  }, [client]);

  useEffect(() => {
    fetchData();
    fetchCompliance();
  }, [fetchData, fetchCompliance]);

  const { kpis, charts } = data;

  const QUICK_LINKS = [
    {
      title: "General Ledger",
      href: "/finance/gl",
      icon: BookOpen,
      desc: "Chart of Accounts & Journals",
      color: "var(--color-primary)",
    },
    {
      title: "Accounts Receivable",
      href: "/finance/ar",
      icon: FileText,
      desc: "Invoices, Collections & Aging",
      color: "var(--color-success)",
    },
    {
      title: "Accounts Payable",
      href: "/finance/ap",
      icon: Building2,
      desc: "Vendor Bills & Payments",
      color: "var(--color-warning)",
    },
    {
      title: "Banking & Cash",
      href: "/finance/banking",
      icon: Wallet,
      desc: "Bank Accounts & Liquidity",
      color: "#6366f1",
    },
    {
      title: "Tax & Compliance",
      href: "/finance/tax",
      icon: Calculator,
      desc: "Tax Rules & Return Filings",
      color: "#ec4899",
    },
    {
      title: "Budget & FP&A",
      href: "/finance/budget-planning",
      icon: PieChart,
      desc: "Budgets & Forecasting",
      color: "#8b5cf6",
    },
    {
      title: "Fixed Assets",
      href: "/finance/assets",
      icon: Layers,
      desc: "Asset Registry & Depreciation",
      color: "#14b8a6",
    },
    {
      title: "Financial Reports",
      href: "/finance/reports",
      icon: BarChart3,
      desc: "P&L, Balance Sheet, Cash Flow",
      color: "#f59e0b",
    },
  ];

  // ── Page 1: Executive Overview (Prominent Charts height=185px, 100% Fit) ───
  const Page1 = (
    <div className="ui-stack-3">
      {/* 4 KPI Cards */}
      <div className="ui-grid-4 gap-3">
        <KpiCard
          label="Revenue YTD"
          value={fmt(kpis.totalRevenueYtd)}
          sub="Paid invoices this fiscal year"
          icon={TrendingUp}
          color="var(--color-primary)"
          trend="up"
        />
        <KpiCard
          label="Net Cash Position"
          value={fmt(kpis.netCashBalance)}
          sub={`Across ${kpis.bankAccounts || "—"} bank accounts`}
          icon={Wallet}
          color="#6366f1"
          trend="neutral"
        />
        <KpiCard
          label="Outstanding AR"
          value={fmt(kpis.outstandingAr)}
          sub={`${kpis.overdueInvoices} overdue invoices`}
          icon={FileText}
          color="var(--color-warning)"
          trend={kpis.overdueInvoices > 0 ? "down" : "neutral"}
        />
        <KpiCard
          label="Invoice Payment Rate"
          value={`${kpis.paymentRate}%`}
          sub={`${kpis.paidInvoices} of ${kpis.totalInvoices} invoices paid`}
          icon={CheckCircle2}
          color="var(--color-success)"
          trend={kpis.paymentRate >= 70 ? "up" : "down"}
        />
      </div>

      {/* 2 Prominent Charts side by side (Height 185px) */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <DashboardChart
          title="Monthly Revenue Trend"
          subtitle="Invoice value issued per month over 12 months"
          data={charts.revenueTrend}
          config={{
            xAxisKey: "month",
            series: [
              {
                dataKey: "revenue",
                name: "Revenue ($)",
                color: "var(--color-primary)",
              },
            ],
          }}
          defaultChartType="area"
          allowedChartTypes={["area", "bar", "line"]}
          height={185}
          loading={loading}
        />
        <DashboardChart
          title="Invoice Status Distribution"
          subtitle="Count by status across all invoices"
          data={charts.statusDistribution}
          config={{
            series: [],
            valueKey: "value",
            nameKey: "name",
          }}
          defaultChartType="donut"
          allowedChartTypes={["donut", "pie", "bar"]}
          height={185}
          loading={loading}
        />
      </div>
    </div>
  );

  // ── Page 2: Receivables & Customer Analytics (Height 175px, 100% Fit) ──────
  const Page2 = (
    <div className="ui-stack-3">
      {/* 2 Charts side by side */}
      <div className="ui-grid-2 gap-3">
        <DashboardChart
          title="AR Aging Analysis"
          subtitle="Outstanding receivable amounts by aging bucket"
          data={charts.arAgingChart}
          config={{
            xAxisKey: "bucket",
            series: [
              {
                dataKey: "amount",
                name: "Outstanding ($)",
                color: "var(--color-warning)",
              },
            ],
          }}
          defaultChartType="bar"
          allowedChartTypes={["bar", "line", "area"]}
          height={175}
          loading={loading}
        />
        <DashboardChart
          title="Payment Method Distribution"
          subtitle="How customers pay their invoices"
          data={charts.paymentMethodChart}
          config={{
            series: [],
            valueKey: "value",
            nameKey: "name",
          }}
          defaultChartType="donut"
          allowedChartTypes={["donut", "pie", "bar"]}
          height={175}
          loading={loading}
        />
      </div>

      {/* Top Customers Chart */}
      <DashboardChart
        title="Top Customers by Revenue"
        subtitle="Highest-value customers over 12 months"
        data={charts.topCustomers}
        config={{
          xAxisKey: "name",
          series: [
            {
              dataKey: "revenue",
              name: "Revenue ($)",
              color: "var(--color-primary)",
              type: "bar",
            },
            {
              dataKey: "invoices",
              name: "Invoice Count",
              color: "var(--color-success)",
              type: "line",
            },
          ],
        }}
        defaultChartType="composed"
        allowedChartTypes={["composed", "bar", "line"]}
        height={175}
        loading={loading}
      />
    </div>
  );

  // ── Page 3: Cash Flow & Budget Analytics (Height 175px, 100% Fit) ──────────
  const Page3 = (
    <div className="ui-stack-3">
      {/* Cash Flow Chart */}
      <DashboardChart
        title="Monthly Cash Flow"
        subtitle="Payment inflows vs estimated outflows over 12 months"
        data={charts.cashFlowTrend}
        config={{
          xAxisKey: "month",
          series: [
            {
              dataKey: "inflows",
              name: "Inflows ($)",
              color: "var(--color-success)",
              type: "area",
            },
            {
              dataKey: "outflows",
              name: "Outflows ($)",
              color: "var(--color-danger)",
              type: "area",
            },
          ],
        }}
        defaultChartType="area"
        allowedChartTypes={["area", "line", "bar", "composed"]}
        height={175}
        loading={loading}
      />

      {/* 2 Charts side by side */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 2fr" }}>
        <DashboardChart
          title="GL Account Distribution"
          subtitle="Active accounts by type"
          data={charts.accountTypeChart}
          config={{
            series: [],
            valueKey: "value",
            nameKey: "name",
          }}
          defaultChartType="donut"
          allowedChartTypes={["donut", "pie", "bar"]}
          height={175}
          loading={loading}
        />
        <DashboardChart
          title="Revenue & Invoice Volume Trend"
          subtitle="Monthly revenue value and invoice count"
          data={charts.revenueTrend}
          config={{
            xAxisKey: "month",
            series: [
              {
                dataKey: "revenue",
                name: "Revenue ($)",
                color: "var(--color-primary)",
                type: "bar",
              },
              {
                dataKey: "invoices",
                name: "Invoice Count",
                color: "#8b5cf6",
                type: "line",
              },
            ],
          }}
          defaultChartType="composed"
          allowedChartTypes={["composed", "stacked-bar", "bar", "line"]}
          height={175}
          loading={loading}
        />
      </div>
    </div>
  );

  // ── Page 4: Operations & Compliance (100% Fit) ───────────────────────────
  const Page4 = (
    <div className="ui-stack-3">
      {/* Compliance & Health Ratios */}
      <div className="ui-grid-2 gap-3">
        <Card padding="md">
          <div className="ui-stack-2">
            <div className="ui-flex-between">
              <h3 className="text-xs font-semibold m-0 flex items-center gap-1">
                <ShieldCheck size={15} className="ui-text-success" />
                Period Close & Compliance
              </h3>
              <span className="ui-text-xs-tertiary">FY 2026</span>
            </div>
            {[
              {
                label: compliance.periodName
                  ? `${compliance.periodName} Period Close`
                  : "Financial Period Close",
                status:
                  compliance.periodName === null
                    ? "No open period"
                    : compliance.closePct === null
                      ? "No checklist yet"
                      : compliance.closePct >= 100
                        ? "Complete"
                        : `In Progress (${compliance.closePct}%)`,
                variant:
                  compliance.closePct !== null && compliance.closePct >= 100
                    ? "success"
                    : "warning",
              },
              {
                label: "Bank Accounts",
                status:
                  compliance.bankAccountCount === null
                    ? "Unknown"
                    : compliance.bankAccountCount === 0
                      ? "None configured"
                      : `${compliance.bankAccountCount} configured`,
                variant: compliance.bankAccountCount ? "success" : "info",
              },
              {
                label: "Sales Tax & VAT Filing",
                status: "Not yet tracked",
                variant: "info",
              },
              {
                label: "Intercompany Eliminations",
                status:
                  compliance.icEliminationsRun === null
                    ? "Unknown"
                    : compliance.icEliminationsRun
                      ? "Run this period"
                      : "Not run",
                variant: compliance.icEliminationsRun ? "success" : "neutral",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="ui-flex-between border-b"
                style={{ padding: "3px 0" }}
              >
                <span className="text-xs">{item.label}</span>
                <span
                  className={`ui-badge ui-badge-${item.variant}`}
                  style={{ fontSize: "10px", padding: "1px 6px" }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <div className="ui-stack-2">
            <h3 className="text-xs font-semibold m-0 flex items-center gap-1">
              <Activity size={15} className="ui-text-primary" />
              Financial Health Ratios
            </h3>
            {[
              {
                label: "Payment Collection Rate",
                value: `${kpis.paymentRate}%`,
                pct: kpis.paymentRate,
                color: "var(--color-success)",
              },
              {
                label: "AR Turnover Efficiency",
                value: kpis.outstandingAr > 0 ? "Active" : "N/A",
                pct: kpis.outstandingAr > 0 ? 60 : 0,
                color: "var(--color-primary)",
              },
              {
                label: "Cash Coverage Ratio",
                value:
                  kpis.netCashBalance > 0 ? fmt(kpis.netCashBalance) : "N/A",
                pct: Math.min(100, (kpis.netCashBalance / 10_000_000) * 100),
                color: "#6366f1",
              },
              {
                label: "Overdue Invoice Exposure",
                value: `${kpis.overdueInvoices} invoices`,
                pct:
                  kpis.totalInvoices > 0
                    ? Math.max(
                        0,
                        100 - (kpis.overdueInvoices / kpis.totalInvoices) * 100,
                      )
                    : 100,
                color:
                  kpis.overdueInvoices > 0
                    ? "var(--color-danger)"
                    : "var(--color-success)",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", flexDirection: "column", gap: "2px" }}
              >
                <div className="ui-flex-between text-xs">
                  <span className="ui-text-muted">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "var(--color-bg-sunken)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(2, item.pct)}%`,
                      background: item.color,
                      height: "100%",
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Workspaces Hub */}
      <div className="ui-stack-1">
        <h3 className="text-xs font-semibold m-0">Finance Workspaces</h3>
        <div className="ui-grid-4 gap-2">
          {QUICK_LINKS.map((link) => (
            <NavCard
              key={link.title}
              title={link.title}
              desc={link.desc}
              icon={link.icon}
              color={link.color}
              onClick={() => router.push(link.href)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // ── Page 5: Active Invoices Ledger (100% Fit) ─────────────────────────────
  const Page5 = (
    <Card padding="md">
      <div className="ui-stack-2">
        <div className="ui-flex-between">
          <div>
            <h3 className="text-xs font-semibold m-0">
              Active Invoices & Receivables
            </h3>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/finance/ar")}
          >
            View All AR →
          </Button>
        </div>
        <ListView
          resource={invoiceResource}
          onRowClick={(row) => router.push(`/finance/invoices/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />
      </div>
    </Card>
  );

  // ── Dashboard pages config ───────────────────────────────────────────────
  const pages = [
    {
      id: "overview",
      title: "Executive Overview",
      subtitle: "Live KPIs, revenue trend, and invoice status distribution",
      content: Page1,
    },
    {
      id: "receivables",
      title: "Receivables & Customers",
      subtitle:
        "AR aging analysis, payment methods, and top customer breakdown",
      content: Page2,
    },
    {
      id: "cashflow",
      title: "Cash Flow & Budget",
      subtitle:
        "Monthly cash flow trends, GL account distribution, and revenue volume",
      content: Page3,
    },
    {
      id: "operations",
      title: "Compliance & Workspaces",
      subtitle: "Period close compliance, health ratios, and workspace hub",
      content: Page4,
    },
    {
      id: "invoices",
      title: "Active Invoices Ledger",
      subtitle: "Search and manage active customer invoice records",
      content: Page5,
    },
  ];

  return (
    <RouteGuard permission="finance.invoice.read">
      <div className="ui-stack-2 ui-animate-in">
        {/* Compact PageHeader — Single "+ New Invoice" Button */}
        <PageHeader
          title="Finance & Accounting"
          description="Executive dashboard — revenue, cash flow, receivables, compliance, and module workspaces."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Finance" },
          ]}
          actions={
            <div className="ui-hstack-2">
              <Button
                variant="secondary"
                onClick={fetchData}
                disabled={loading}
                size="sm"
              >
                <RefreshCw
                  size={13}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Loading…" : "Refresh"}
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowCreate(true)}
                size="sm"
              >
                <Plus size={13} /> New Invoice
              </Button>
            </div>
          }
        />

        {dataError && (
          <div className="ui-alert ui-alert-danger">
            <AlertCircle size={16} />
            Failed to refresh dashboard KPIs — showing last known values.{" "}
            {dataError}
          </div>
        )}

        {loading && (
          <div className="flex justify-center p-6">
            <Spinner size="md" />
          </div>
        )}

        {/* Multi-Page Dashboard */}
        {!loading && (
          <MultiPageDashboard
            pages={pages}
            defaultPageId="overview"
            navActions={
              <span className="ui-text-xs-tertiary">
                Use ← → keys to navigate
              </span>
            }
          />
        )}

        {/* Create Invoice Modal */}
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Create New Invoice"
          size="lg"
        >
          <FormView
            resource={invoiceResource}
            onSuccess={() => {
              setShowCreate(false);
              success("Invoice created successfully");
              fetchData();
            }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
