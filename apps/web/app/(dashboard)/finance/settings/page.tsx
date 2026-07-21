"use client";

import { useSearchParams } from "next/navigation";
import {
  Settings,
  DollarSign,
  Calendar,
  ShieldCheck,
  Zap,
  Link2,
  Database,
} from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { FinanceDemoDataCard } from "@/components/finance/FinanceDemoDataCard";
import { Card } from "@unerp/ui";

import FinancialPeriodsPage from "../advanced/financial-periods/page";
import ExchangeRatesPage from "../advanced/exchange-rates/page";
import FxRevaluationPage from "../advanced/fx-revaluation/page";
import CurrencyRevaluationPage from "../advanced/currency-revaluation/page";
import CloseTasksPage from "../advanced/close-tasks/page";
import ConsolidationPage from "../advanced/consolidation/page";

const SETTINGS_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/settings",
    icon: Settings,
    description: "Finance settings overview",
  },
  {
    id: "demo-data",
    label: "Demo Data",
    href: "/finance/settings?tab=demo-data",
    icon: Database,
    description: "Load or unload Finance module sample data",
  },
  {
    id: "accounting",
    label: "Accounting Settings",
    href: "/finance/settings?tab=accounting",
    icon: Settings,
    description: "General accounting configuration",
  },
  {
    id: "currencies",
    label: "Currencies",
    href: "/finance/settings?tab=currencies",
    icon: DollarSign,
    description: "Currency and exchange rate settings",
  },
  {
    id: "fiscal-years",
    label: "Fiscal Years",
    href: "/finance/settings?tab=fiscal-years",
    icon: Calendar,
    description: "Fiscal year and period settings",
  },
  {
    id: "approval-rules",
    label: "Approval Rules",
    href: "/finance/settings?tab=approval-rules",
    icon: ShieldCheck,
    description: "Finance approval workflows",
  },
  {
    id: "automation",
    label: "Automation",
    href: "/finance/settings?tab=automation",
    icon: Zap,
    description: "Finance automation rules",
  },
  {
    id: "integrations",
    label: "Integrations",
    href: "/finance/settings?tab=integrations",
    icon: Link2,
    description: "External integrations",
  },
];

export default function FinanceSettingsPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");

  return (
    <FinanceTabLayout
      tabs={SETTINGS_TABS}
      moduleId="settings"
      moduleLabel="Settings"
      moduleIcon={Settings}
      moduleDescription="Finance module configuration and preferences"
    >
      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          <div className="ui-grid-3" style={{ marginTop: 0 }}>
            <Card
              padding="lg"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
            >
              <Settings size={24} className="ui-text-primary" />
              <div>
                <h3 className="ui-heading-sm">Accounting Settings</h3>
                <p className="ui-text-xs-muted">
                  Default currency, numbering, GL config
                </p>
              </div>
            </Card>
            <Card
              padding="lg"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
            >
              <DollarSign size={24} className="ui-text-success" />
              <div>
                <h3 className="ui-heading-sm">Currencies</h3>
                <p className="ui-text-xs-muted">
                  Base currency, exchange rates
                </p>
              </div>
            </Card>
            <Card
              padding="lg"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
            >
              <Calendar size={24} className="ui-text-warning" />
              <div>
                <h3 className="ui-heading-sm">Fiscal Years</h3>
                <p className="ui-text-xs-muted">Periods, close dates</p>
              </div>
            </Card>
          </div>
          <FinanceDemoDataCard />
        </div>
      )}
      {activeTab === "demo-data" && (
        <div className="ui-stack-4 ui-animate-in">
          <FinanceDemoDataCard />
        </div>
      )}
      {activeTab === "accounting" && (
        <div className="ui-stack-4 ui-animate-in">
          <FinancialPeriodsPage />
        </div>
      )}
      {activeTab === "currencies" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "rates",
                label: "Multi-Currency",
                href: "/finance/settings?tab=currencies&subtab=rates",
              },
              {
                id: "fx",
                label: "FX Revaluation",
                href: "/finance/settings?tab=currencies&subtab=fx",
              },
              {
                id: "reval",
                label: "Currency Revaluation",
                href: "/finance/settings?tab=currencies&subtab=reval",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "fx" ? (
              <FxRevaluationPage />
            ) : subTab === "reval" ? (
              <CurrencyRevaluationPage />
            ) : (
              <ExchangeRatesPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "fiscal-years" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "periods",
                label: "Financial Periods",
                href: "/finance/settings?tab=fiscal-years&subtab=periods",
              },
              {
                id: "close",
                label: "Close Tasks",
                href: "/finance/settings?tab=fiscal-years&subtab=close",
              },
              {
                id: "consolidation",
                label: "Consolidation",
                href: "/finance/settings?tab=fiscal-years&subtab=consolidation",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "close" ? (
              <CloseTasksPage />
            ) : subTab === "consolidation" ? (
              <ConsolidationPage />
            ) : (
              <FinancialPeriodsPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "approval-rules" && (
        <div className="ui-stack-4 ui-animate-in">
          <CloseTasksPage />
        </div>
      )}
      {activeTab === "automation" && (
        <div className="ui-stack-4 ui-animate-in">
          <FinancialPeriodsPage />
        </div>
      )}
      {activeTab === "integrations" && (
        <div className="ui-stack-4 ui-animate-in">
          <ExchangeRatesPage />
        </div>
      )}
    </FinanceTabLayout>
  );
}
