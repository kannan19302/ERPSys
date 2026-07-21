"use client";

import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Scale,
  PieChart,
  FileText,
} from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { RouteGuard } from "@unerp/framework";
import { Card } from "@unerp/ui";

import ReportsPage from "../advanced/reports/page";
import FinancialRatiosPage from "../advanced/financial-ratios/page";

const REPORTS_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/reports",
    icon: PieChart,
    description: "Reports overview",
  },
  {
    id: "balance-sheet",
    label: "Balance Sheet",
    href: "/finance/reports?tab=balance-sheet",
    icon: Scale,
    description: "Balance sheet statement",
  },
  {
    id: "profit-loss",
    label: "Profit & Loss",
    href: "/finance/reports?tab=profit-loss",
    icon: TrendingUp,
    description: "Income statement",
  },
  {
    id: "cash-flow",
    label: "Cash Flow",
    href: "/finance/reports?tab=cash-flow",
    icon: Activity,
    description: "Cash flow statement",
  },
  {
    id: "trial-balance",
    label: "Trial Balance",
    href: "/finance/reports?tab=trial-balance",
    icon: BarChart3,
    description: "Trial balance report",
  },
  {
    id: "financial-ratios",
    label: "Financial Ratios",
    href: "/finance/reports?tab=financial-ratios",
    icon: PieChart,
    description: "Key financial ratio analysis",
  },
  {
    id: "custom-reports",
    label: "Custom Reports",
    href: "/finance/reports?tab=custom-reports",
    icon: FileText,
    description: "Custom report builder",
  },
];

export default function FinanceReportsPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  return (
    <RouteGuard permission="finance.report.read">
      <FinanceTabLayout
        tabs={REPORTS_TABS}
        moduleId="reports"
        moduleLabel="Reports"
        moduleIcon={PieChart}
        moduleDescription="Financial statements, reports, and ratio analysis"
      >
        {activeTab === "overview" && (
          <div className="ui-stack-4 ui-animate-in">
            <div
              className="ui-grid-2"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <Card
                padding="md"
                className="ui-hstack-3"
                style={{ cursor: "pointer" }}
              >
                <Scale size={24} className="ui-text-primary" />
                <div>
                  <h3 className="ui-heading-sm">Balance Sheet</h3>
                  <p className="ui-text-xs-muted">As of Jul 20, 2026</p>
                </div>
              </Card>
              <Card
                padding="md"
                className="ui-hstack-3"
                style={{ cursor: "pointer" }}
              >
                <TrendingUp size={24} className="ui-text-success" />
                <div>
                  <h3 className="ui-heading-sm">Profit & Loss</h3>
                  <p className="ui-text-xs-muted">Q2 2026 vs Q1 2026</p>
                </div>
              </Card>
            </div>
            <ReportsPage />
          </div>
        )}
        {activeTab === "balance-sheet" && (
          <div className="ui-stack-4 ui-animate-in">
            <ReportsPage />
          </div>
        )}
        {activeTab === "profit-loss" && (
          <div className="ui-stack-4 ui-animate-in">
            <ReportsPage />
          </div>
        )}
        {activeTab === "cash-flow" && (
          <div className="ui-stack-4 ui-animate-in">
            <ReportsPage />
          </div>
        )}
        {activeTab === "trial-balance" && (
          <div className="ui-stack-4 ui-animate-in">
            <ReportsPage />
          </div>
        )}
        {activeTab === "financial-ratios" && (
          <div className="ui-stack-4 ui-animate-in">
            <FinancialRatiosPage />
          </div>
        )}
        {activeTab === "custom-reports" && (
          <div className="ui-stack-4 ui-animate-in">
            <ReportsPage />
          </div>
        )}
      </FinanceTabLayout>
    </RouteGuard>
  );
}
