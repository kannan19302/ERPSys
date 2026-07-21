"use client";

import { useSearchParams } from "next/navigation";
import {
  Wallet,
  GitCompare,
  DollarSign,
  Activity,
  BarChart3,
  TrendingUp,
  CreditCard,
  Download,
} from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { ListView, RouteGuard } from "@unerp/framework";
import { bankAccountResource } from "@/modules/finance";
import { Card, PageHeader } from "@unerp/ui";

import ReconciliationsPage from "../advanced/reconciliations/page";
import BankFeedsPage from "../advanced/bank-feeds/page";
import BankReconPage from "../advanced/bank-recon/page";
import CashPositionPage from "../advanced/cash-position/page";
import CashFlowForecastPage from "../advanced/cash-flow-forecast/page";
import ReportsPage from "../advanced/reports/page";
import TreasuryPage from "../advanced/treasury/page";
import CorporateCardsPage from "../advanced/corporate-cards/page";

const BANKING_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/banking",
    icon: Activity,
    description: "Banking summary and cash position",
  },
  {
    id: "bank-accounts",
    label: "Bank Accounts",
    href: "/finance/banking?tab=bank-accounts",
    icon: Wallet,
    description: "Manage bank accounts",
  },
  {
    id: "reconciliation",
    label: "Bank Reconciliation",
    href: "/finance/banking?tab=reconciliation",
    icon: GitCompare,
    description: "Reconcile bank statements",
  },
  {
    id: "cash-position",
    label: "Cash Position",
    href: "/finance/banking?tab=cash-position",
    icon: DollarSign,
    description: "Real-time cash position",
  },
  {
    id: "cash-flow",
    label: "Cash Flow",
    href: "/finance/banking?tab=cash-flow",
    icon: Activity,
    description: "Cash flow analysis",
  },
  {
    id: "treasury",
    label: "Treasury",
    href: "/finance/banking?tab=treasury",
    icon: BarChart3,
    description: "Treasury operations",
  },
  {
    id: "corporate-cards",
    label: "Corporate Cards",
    href: "/finance/banking?tab=corporate-cards",
    icon: CreditCard,
    description: "Card spend limits and management",
    advanced: true,
    group: "Advanced Treasury",
  },
  {
    id: "investments",
    label: "Investments",
    href: "/finance/banking?tab=investments",
    icon: TrendingUp,
    description: "Investment tracking",
    advanced: true,
    group: "Advanced Treasury",
  },
  {
    id: "forecasting",
    label: "Forecasting",
    href: "/finance/banking?tab=forecasting",
    icon: TrendingUp,
    description: "Cash flow forecasting",
    advanced: true,
    group: "Advanced Treasury",
  },
  {
    id: "payment-gateway",
    label: "Payment Gateway",
    href: "/finance/banking?tab=payment-gateway",
    icon: CreditCard,
    description: "Payment gateway configuration",
    advanced: true,
    group: "Advanced Treasury",
  },
  {
    id: "bank-import-rules",
    label: "Bank Import Rules",
    href: "/finance/banking?tab=bank-import-rules",
    icon: Download,
    description: "Bank statement import rules",
    advanced: true,
    group: "Advanced Treasury",
  },
];

export default function BankingPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");

  return (
    <RouteGuard permission="finance.bank-account.read">
      <FinanceTabLayout
        tabs={BANKING_TABS}
        moduleId="banking"
        moduleLabel="Banking"
        moduleIcon={Wallet}
        moduleDescription="Bank accounts, reconciliation, cash management, and treasury"
      >
        {activeTab === "overview" && (
          <div className="ui-stack-4 ui-animate-in">
            <div className="ui-grid-3">
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Total Cash Balance</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-primary)" }}
                  >
                    $1,847,200
                  </p>
                  <p className="ui-text-xs-muted">Across 4 accounts</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Pending Reconciliation</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-warning)" }}
                  >
                    23
                  </p>
                  <p className="ui-text-xs-muted">Transactions to match</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Forecasted 30-day</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-success)" }}
                  >
                    $2.1M
                  </p>
                  <p className="ui-text-xs-muted">Inflow / $1.8M outflow</p>
                </div>
              </Card>
            </div>
            <Card padding="md">
              <h3
                className="ui-heading-sm"
                style={{ marginBottom: "var(--space-3)" }}
              >
                Bank Accounts
              </h3>
              <ListView resource={bankAccountResource} />
            </Card>
          </div>
        )}
        {activeTab === "bank-accounts" && (
          <div className="ui-stack-4 ui-animate-in">
            <PageHeader
              title="Bank Accounts"
              description="Manage bank accounts and opening balances"
            />
            <ListView resource={bankAccountResource} />
          </div>
        )}
        {activeTab === "reconciliation" && (
          <div className="ui-stack-4 ui-animate-in">
            <SubTabBar
              tabs={[
                {
                  id: "recon",
                  label: "Bank Reconciliation",
                  href: "/finance/banking?tab=reconciliation&subtab=recon",
                },
                {
                  id: "feeds",
                  label: "Bank Feeds & Connections",
                  href: "/finance/banking?tab=reconciliation&subtab=feeds",
                },
                {
                  id: "auto",
                  label: "Bank Statement Auto-Match",
                  href: "/finance/banking?tab=reconciliation&subtab=auto",
                },
              ]}
            />
            <div style={{ marginTop: "var(--space-3)" }}>
              {subTab === "feeds" ? (
                <BankFeedsPage />
              ) : subTab === "auto" ? (
                <BankReconPage />
              ) : (
                <ReconciliationsPage />
              )}
            </div>
          </div>
        )}
        {activeTab === "cash-position" && (
          <div className="ui-stack-4 ui-animate-in">
            <SubTabBar
              tabs={[
                {
                  id: "position",
                  label: "Cash Position",
                  href: "/finance/banking?tab=cash-position&subtab=position",
                },
                {
                  id: "forecast",
                  label: "Cash Flow Forecast",
                  href: "/finance/banking?tab=cash-position&subtab=forecast",
                },
              ]}
            />
            <div style={{ marginTop: "var(--space-3)" }}>
              {subTab === "forecast" ? (
                <CashFlowForecastPage />
              ) : (
                <CashPositionPage />
              )}
            </div>
          </div>
        )}
        {activeTab === "cash-flow" && (
          <div className="ui-stack-4 ui-animate-in">
            <CashFlowForecastPage />
          </div>
        )}
        {activeTab === "treasury" && (
          <div className="ui-stack-4 ui-animate-in">
            <TreasuryPage />
          </div>
        )}
        {activeTab === "corporate-cards" && (
          <div className="ui-stack-4 ui-animate-in">
            <CorporateCardsPage />
          </div>
        )}
        {activeTab === "investments" && (
          <div className="ui-stack-4 ui-animate-in">
            <TreasuryPage />
          </div>
        )}
        {activeTab === "forecasting" && (
          <div className="ui-stack-4 ui-animate-in">
            <CashFlowForecastPage />
          </div>
        )}
        {activeTab === "payment-gateway" && (
          <div className="ui-stack-4 ui-animate-in">
            <BankFeedsPage />
          </div>
        )}
        {activeTab === "bank-import-rules" && (
          <div className="ui-stack-4 ui-animate-in">
            <BankReconPage />
          </div>
        )}
      </FinanceTabLayout>
    </RouteGuard>
  );
}
