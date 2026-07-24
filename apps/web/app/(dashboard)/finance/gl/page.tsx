"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  FileSliders,
  Activity,
  ClipboardCheck,
  RefreshCw,
  DollarSign,
  Eye,
  TrendingUp,
  PieChart,
  GitBranch,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { ListView, RouteGuard, useApiClient } from "@unerp/framework";
import { accountResource, journalResource } from "@/modules/finance";
import { Card, PageHeader, useToast } from "@unerp/ui";

import FinancialPeriodsPage from "../advanced/financial-periods/page";
import CloseTasksPage from "../advanced/close-tasks/page";
import RecurringInvoicesPage from "../advanced/recurring/page";
import ExchangeRatesPage from "../advanced/exchange-rates/page";
import FxRevaluationPage from "../advanced/fx-revaluation/page";
import RevenueRecognitionPage from "../advanced/revenue-schedules/page";
import AllocationsPage from "../advanced/allocations/page";
import AccountingBooksPage from "../advanced/accounting-books/page";
import ConsolidationPage from "../advanced/consolidation/page";
import { RecurringJournalsTab } from "../journal-entries/RecurringJournalsTab";

const GL_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/gl",
    icon: BookOpen,
    description: "General Ledger summary and KPIs",
  },
  {
    id: "chart-of-accounts",
    label: "Chart of Accounts",
    href: "/finance/gl?tab=chart-of-accounts",
    icon: BookOpen,
    description: "Manage your chart of accounts",
  },
  {
    id: "journal-entries",
    label: "Journal Entries",
    href: "/finance/gl?tab=journal-entries",
    icon: FileSliders,
    description: "Record, approve, and post journal entries",
  },
  {
    id: "financial-periods",
    label: "Financial Periods",
    href: "/finance/gl?tab=financial-periods",
    icon: Activity,
    description: "Period close checklist and validation",
  },
  {
    id: "closing-checklist",
    label: "Closing Checklist",
    href: "/finance/gl?tab=closing-checklist",
    icon: ClipboardCheck,
    description: "Period close tasks and checklists",
  },
  {
    id: "recurring-journals",
    label: "Recurring Journals",
    href: "/finance/gl?tab=recurring-journals",
    icon: RefreshCw,
    description: "Auto-generate recurring journal entries",
  },
  {
    id: "exchange-rates",
    label: "Exchange Rates",
    href: "/finance/gl?tab=exchange-rates",
    icon: DollarSign,
    description: "Manage foreign exchange rates",
  },
  {
    id: "audit-trail",
    label: "Audit Trail",
    href: "/finance/gl?tab=audit-trail",
    icon: Eye,
    description: "Track changes to financial records",
  },
  {
    id: "revenue-recognition",
    label: "Revenue Recognition",
    href: "/finance/gl?tab=revenue-recognition",
    icon: TrendingUp,
    description: "Deferred revenue and recognition schedules",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "dynamic-allocations",
    label: "Dynamic Allocation",
    href: "/finance/gl?tab=dynamic-allocations",
    icon: PieChart,
    description: "Allocate costs and revenue dynamically",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "multi-gaap",
    label: "Multi-GAAP",
    href: "/finance/gl?tab=multi-gaap",
    icon: GitBranch,
    description: "Multiple accounting standards support",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "consolidation",
    label: "Consolidation",
    href: "/finance/gl?tab=consolidation",
    icon: Building2,
    description: "Multi-entity financial consolidation",
    advanced: true,
    group: "Advanced",
  },
];

interface GlSummary {
  totalAccounts: number;
  accountCategories: number;
  journalCount: number;
  pendingApproval: number;
  openPeriods: number;
  nextCloseDate: string | null;
}

const EMPTY_GL_SUMMARY: GlSummary = {
  totalAccounts: 0,
  accountCategories: 0,
  journalCount: 0,
  pendingApproval: 0,
  openPeriods: 0,
  nextCloseDate: null,
};

export default function GLPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [summary, setSummary] = useState<GlSummary>(EMPTY_GL_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "overview") return;
    let cancelled = false;
    Promise.all([
      client.list<{ type: string }>("/advanced-finance/accounts", {
        pageSize: 500,
      }),
      client.list<{ status: string }>("/advanced-finance/journals", {
        pageSize: 500,
      }),
      client.get<{ data: Array<{ status: string; endDate: string }> }>(
        "/finance/close/financial-periods",
      ),
    ])
      .then(([accountsResult, journalsResult, periodsResult]) => {
        if (cancelled) return;
        const accounts = accountsResult.data ?? [];
        const journals = journalsResult.data ?? [];
        const periods = periodsResult?.data ?? [];
        const openPeriodRows = periods.filter((p) => p.status === "OPEN");
        const nextClose = openPeriodRows.map((p) => p.endDate).sort()[0];
        setSummary({
          totalAccounts: accountsResult.total ?? accounts.length,
          accountCategories: new Set(accounts.map((a) => a.type)).size,
          journalCount: journalsResult.total ?? journals.length,
          pendingApproval: journals.filter((j) => j.status === "SUBMITTED")
            .length,
          openPeriods: openPeriodRows.length,
          nextCloseDate: nextClose ?? null,
        });
        setSummaryError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        // Distinct error state — a failed fetch must never render as "0
        // accounts / 0 journals", which is indistinguishable from real data.
        const message =
          err instanceof Error ? err.message : "Failed to load GL summary";
        setSummaryError(message);
        notifyError("Failed to load General Ledger summary", message);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, client, notifyError]);

  return (
    <RouteGuard permission="finance.journal.read">
      {activeTab === "overview" && (
        <div className="ui-stack-6 ui-animate-in">
          {summaryError && (
            <div className="ui-alert ui-alert-danger">
              <AlertTriangle size={16} />
              Failed to load GL summary — figures below may be stale.{" "}
              {summaryError}
            </div>
          )}
          <div className="ui-grid-3">
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Total Accounts</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-primary)" }}
                >
                  {summary.totalAccounts}
                </p>
                <p className="ui-text-xs-muted">
                  Across {summary.accountCategories} categories
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Journal Entries</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-success)" }}
                >
                  {summary.journalCount}
                </p>
                <p className="ui-text-xs-muted">
                  {summary.pendingApproval} pending approval
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Open Periods</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-warning)" }}
                >
                  {summary.openPeriods}
                </p>
                <p className="ui-text-xs-muted">
                  {summary.nextCloseDate
                    ? `Next close: ${new Date(summary.nextCloseDate).toLocaleDateString()}`
                    : "No open periods"}
                </p>
              </div>
            </Card>
          </div>
          <Card padding="lg">
            <h3
              className="ui-heading-sm"
              style={{ marginBottom: "var(--space-3)" }}
            >
              Recent Journal Entries
            </h3>
            <ListView resource={journalResource} />
          </Card>
          <Card padding="lg">
            <h3
              className="ui-heading-sm"
              style={{ marginBottom: "var(--space-3)" }}
            >
              Chart of Accounts Summary
            </h3>
            <ListView resource={accountResource} />
          </Card>
        </div>
      )}
      {activeTab === "chart-of-accounts" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Chart of Accounts"
            description="Manage your full chart of accounts structure"
          />
          <ListView resource={accountResource} />
        </div>
      )}
      {activeTab === "journal-entries" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Journal Entries"
            description="Record, approve, and post journal entries to the general ledger"
          />
          <ListView resource={journalResource} />
        </div>
      )}
      {activeTab === "financial-periods" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "periods",
                label: "Financial Periods",
                href: "/finance/gl?tab=financial-periods&subtab=periods",
              },
              {
                id: "close",
                label: "Close Tasks",
                href: "/finance/gl?tab=financial-periods&subtab=close",
              },
              {
                id: "recurring",
                label: "Recurring Entries",
                href: "/finance/gl?tab=financial-periods&subtab=recurring",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-4)" }}>
            {subTab === "close" ? (
              <CloseTasksPage />
            ) : subTab === "recurring" ? (
              <RecurringInvoicesPage />
            ) : (
              <FinancialPeriodsPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "closing-checklist" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "close",
                label: "Close Tasks",
                href: "/finance/gl?tab=closing-checklist&subtab=close",
              },
              {
                id: "periods",
                label: "Financial Periods",
                href: "/finance/gl?tab=closing-checklist&subtab=periods",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-4)" }}>
            {subTab === "periods" ? (
              <FinancialPeriodsPage />
            ) : (
              <CloseTasksPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "recurring-journals" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "recurring",
                label: "Recurring Entries",
                href: "/finance/gl?tab=recurring-journals&subtab=recurring",
              },
              {
                id: "revenue",
                label: "Revenue Schedules",
                href: "/finance/gl?tab=recurring-journals&subtab=revenue",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-4)" }}>
            {subTab === "revenue" ? (
              <RevenueRecognitionPage />
            ) : (
              <RecurringJournalsTab />
            )}
          </div>
        </div>
      )}
      {activeTab === "exchange-rates" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "rates",
                label: "Exchange Rates",
                href: "/finance/gl?tab=exchange-rates&subtab=rates",
              },
              {
                id: "fx",
                label: "FX Revaluation",
                href: "/finance/gl?tab=exchange-rates&subtab=fx",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-4)" }}>
            {subTab === "fx" ? <FxRevaluationPage /> : <ExchangeRatesPage />}
          </div>
        </div>
      )}
      {activeTab === "audit-trail" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Audit Trail"
            description="Track all changes to financial records"
          />
          <div style={{ marginTop: "var(--space-4)" }}>
            <CloseTasksPage />
          </div>
        </div>
      )}
      {activeTab === "revenue-recognition" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "revenue",
                label: "Revenue Schedules",
                href: "/finance/gl?tab=revenue-recognition&subtab=revenue",
              },
              {
                id: "recurring",
                label: "Recurring Billing",
                href: "/finance/gl?tab=revenue-recognition&subtab=recurring",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-4)" }}>
            {subTab === "recurring" ? (
              <RecurringInvoicesPage />
            ) : (
              <RevenueRecognitionPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "dynamic-allocations" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "allocations",
                label: "Allocations",
                href: "/finance/gl?tab=dynamic-allocations&subtab=allocations",
              },
              {
                id: "periods",
                label: "Financial Periods",
                href: "/finance/gl?tab=dynamic-allocations&subtab=periods",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-4)" }}>
            {subTab === "periods" ? (
              <FinancialPeriodsPage />
            ) : (
              <AllocationsPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "multi-gaap" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "books",
                label: "Accounting Books",
                href: "/finance/gl?tab=multi-gaap&subtab=books",
              },
              {
                id: "consolidation",
                label: "Consolidation",
                href: "/finance/gl?tab=multi-gaap&subtab=consolidation",
              },
              {
                id: "fx",
                label: "FX Revaluation",
                href: "/finance/gl?tab=multi-gaap&subtab=fx",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-4)" }}>
            {subTab === "consolidation" ? (
              <ConsolidationPage />
            ) : subTab === "fx" ? (
              <FxRevaluationPage />
            ) : (
              <AccountingBooksPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "consolidation" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "consolidation",
                label: "Consolidation",
                href: "/finance/gl?tab=consolidation&subtab=consolidation",
              },
              {
                id: "books",
                label: "Accounting Books",
                href: "/finance/gl?tab=consolidation&subtab=books",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-4)" }}>
            {subTab === "books" ? (
              <AccountingBooksPage />
            ) : (
              <ConsolidationPage />
            )}
          </div>
        </div>
      )}
    </RouteGuard>
  );
}
