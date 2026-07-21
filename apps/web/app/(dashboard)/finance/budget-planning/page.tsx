"use client";

import { useSearchParams } from "next/navigation";
import {
  PieChart,
  TrendingUp,
  Layers,
  BarChart3,
  Activity,
  GitCompare,
} from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { RouteGuard } from "@unerp/framework";
import { Card } from "@unerp/ui";

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

export default function BudgetPlanningPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");

  return (
    <RouteGuard permission="finance.fpa.read">
      <FinanceTabLayout
        tabs={BUDGET_TABS}
        moduleId="budget-planning"
        moduleLabel="Budget & Planning"
        moduleIcon={PieChart}
        moduleDescription="Budgets, forecasts, scenario planning, and financial KPIs"
      >
        {activeTab === "overview" && (
          <div className="ui-stack-4 ui-animate-in">
            <div className="ui-grid-3">
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Annual Budget</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-primary)" }}
                  >
                    $12.5M
                  </p>
                  <p className="ui-text-xs-muted">FY 2026</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">YTD Variance</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-warning)" }}
                  >
                    +3.2%
                  </p>
                  <p className="ui-text-xs-muted">Over budget by $124K</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Active Forecasts</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-success)" }}
                  >
                    4
                  </p>
                  <p className="ui-text-xs-muted">2 scenarios in progress</p>
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
      </FinanceTabLayout>
    </RouteGuard>
  );
}
