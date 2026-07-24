"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PieChart,
  TrendingUp,
  Layers,
  BarChart3,
  Activity,
  GitCompare,
  AlertTriangle,
} from "lucide-react";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Card, useToast } from "@unerp/ui";

import BudgetingPage from "../advanced/budgeting/page";
import BudgetScenariosPage from "../advanced/budget-scenarios/page";
import ForecastScenariosPage from "../advanced/forecast-scenarios/page";
import ScenarioComparisonPage from "../advanced/scenario-comparison/page";

const BUDGET_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/budget-planning",
    icon: PieChart,
    description: "Budget and planning summary",
  },
  {
    id: "budgets",
    label: "Budgets",
    href: "/finance/budget-planning?tab=budgets",
    icon: PieChart,
    description: "Budget creation and management",
  },
  {
    id: "forecasts",
    label: "Forecasts",
    href: "/finance/budget-planning?tab=forecasts",
    icon: TrendingUp,
    description: "Financial forecasting",
  },
  {
    id: "scenario-planning",
    label: "Scenario Planning",
    href: "/finance/budget-planning?tab=scenario-planning",
    icon: Layers,
    description: "What-if scenario modeling",
  },
  {
    id: "rolling-forecast",
    label: "Rolling Forecast",
    href: "/finance/budget-planning?tab=rolling-forecast",
    icon: Activity,
    description: "Continuous rolling forecasts",
    advanced: true,
    group: "Advanced Planning",
  },
  {
    id: "variance-analysis",
    label: "Variance Analysis",
    href: "/finance/budget-planning?tab=variance-analysis",
    icon: GitCompare,
    description: "Budget vs actual variance",
    advanced: true,
    group: "Advanced Planning",
  },
];

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  activeBudgets: number;
}

const EMPTY_BUDGET_SUMMARY: BudgetSummary = {
  totalBudget: 0,
  totalSpent: 0,
  activeBudgets: 0,
};

export default function BudgetPlanningPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [summary, setSummary] = useState<BudgetSummary>(EMPTY_BUDGET_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "overview") return;
    let cancelled = false;
    client
      .list<{ amount: number; spentAmount: number; status: string }>(
        "/finance/budgets",
        { pageSize: 500 },
      )
      .then((res) => {
        if (cancelled) return;
        const budgets = res.data ?? [];
        const active = budgets.filter((b) => b.status === "ACTIVE");
        setSummary({
          totalBudget: budgets.reduce((s, b) => s + Number(b.amount || 0), 0),
          totalSpent: budgets.reduce(
            (s, b) => s + Number(b.spentAmount || 0),
            0,
          ),
          activeBudgets: active.length,
        });
        setSummaryError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load budget summary";
        setSummaryError(message);
        notifyError("Failed to load Budget & Planning summary", message);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, client, notifyError]);

  const variancePct =
    summary.totalBudget > 0
      ? Math.round(
          ((summary.totalSpent - summary.totalBudget) / summary.totalBudget) *
            1000,
        ) / 10
      : 0;

  return (
    <RouteGuard permission="finance.fpa.read">
      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          {summaryError && (
            <div className="ui-alert ui-alert-danger">
              <AlertTriangle size={16} />
              Failed to load budget summary — figures below may be stale.{" "}
              {summaryError}
            </div>
          )}
          <div className="ui-grid-3">
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Total Budget</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-primary)" }}
                >
                  {summary.totalBudget.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  Across {summary.activeBudgets} active budgets
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">YTD Variance</p>
                <p
                  className="ui-heading-sm"
                  style={{
                    color:
                      variancePct > 0
                        ? "var(--color-danger)"
                        : "var(--color-success)",
                  }}
                >
                  {variancePct > 0 ? "+" : ""}
                  {variancePct}%
                </p>
                <p className="ui-text-xs-muted">
                  {summary.totalSpent.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}{" "}
                  spent
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Active Budgets</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-success)" }}
                >
                  {summary.activeBudgets}
                </p>
                <p className="ui-text-xs-muted">
                  See Scenario Planning tab for forecasts
                </p>
              </div>
            </Card>
          </div>
          <BudgetingPage />
        </div>
      )}
      {activeTab === "budgets" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "budgeting",
                label: "Budgeting & Planning",
                href: "/finance/budget-planning?tab=budgets&subtab=budgeting",
              },
              {
                id: "scenarios",
                label: "Budget Scenarios",
                href: "/finance/budget-planning?tab=budgets&subtab=scenarios",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "scenarios" ? (
              <BudgetScenariosPage />
            ) : (
              <BudgetingPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "forecasts" && (
        <div className="ui-stack-4 ui-animate-in">
          <ForecastScenariosPage />
        </div>
      )}
      {activeTab === "scenario-planning" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "scenarios",
                label: "Budget Scenarios",
                href: "/finance/budget-planning?tab=scenario-planning&subtab=scenarios",
              },
              {
                id: "forecast",
                label: "Forecast Scenarios",
                href: "/finance/budget-planning?tab=scenario-planning&subtab=forecast",
              },
              {
                id: "compare",
                label: "Scenario Comparison",
                href: "/finance/budget-planning?tab=scenario-planning&subtab=compare",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "forecast" ? (
              <ForecastScenariosPage />
            ) : subTab === "compare" ? (
              <ScenarioComparisonPage />
            ) : (
              <BudgetScenariosPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "rolling-forecast" && (
        <div className="ui-stack-4 ui-animate-in">
          <ForecastScenariosPage />
        </div>
      )}
      {activeTab === "variance-analysis" && (
        <div className="ui-stack-4 ui-animate-in">
          <BudgetingPage />
        </div>
      )}
    </RouteGuard>
  );
}
