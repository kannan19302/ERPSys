"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calculator,
  FileText,
  Globe,
  ShieldCheck,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { Card, useToast } from "@unerp/ui";

import TaxEnginePage from "../advanced/tax-engine/page";
import TaxFilingPage from "../advanced/tax-filing/page";
import TaxFilingSummaryPage from "../advanced/tax-filing-summary/page";
import Form1099Page from "../advanced/1099-reporting/page";
import TaxNexusPage from "../advanced/tax-nexus/page";
import AuditLogsPage from "../advanced/audit-logs/page";
import { TaxJurisdictionLookupTab } from "./TaxJurisdictionLookupTab";
import { TaxFilingCalendarTab } from "./TaxFilingCalendarTab";

const TAX_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/tax",
    icon: Calculator,
    description: "Tax management summary",
  },
  {
    id: "jurisdictions",
    label: "Tax Rates & Lookup",
    href: "/finance/tax?tab=jurisdictions",
    icon: Globe,
    description: "Real-time multi-jurisdiction tax lookup",
  },
  {
    id: "calendar",
    label: "Filing Calendar",
    href: "/finance/tax?tab=calendar",
    icon: FileText,
    description: "Filing schedule timeline & reminders",
  },
  {
    id: "tax-engine",
    label: "Tax Engine",
    href: "/finance/tax?tab=tax-engine",
    icon: Calculator,
    description: "Tax rule configuration and computation",
  },
  {
    id: "tax-filing",
    label: "Tax Filing",
    href: "/finance/tax?tab=tax-filing",
    icon: FileText,
    description: "Tax return preparation and filing",
  },
  {
    id: "gst-vat",
    label: "GST/VAT",
    href: "/finance/tax?tab=gst-vat",
    icon: Globe,
    description: "GST/VAT return management",
  },
  {
    id: "1099",
    label: "1099 Reporting",
    href: "/finance/tax?tab=1099",
    icon: FileText,
    description: "1099 vendor tax reporting",
  },
  {
    id: "economic-nexus",
    label: "Economic Nexus",
    href: "/finance/tax?tab=economic-nexus",
    icon: Globe,
    description: "Economic nexus monitoring",
    advanced: true,
    group: "Compliance",
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    href: "/finance/tax?tab=audit-logs",
    icon: Eye,
    description: "Tax audit trail",
    advanced: true,
    group: "Compliance",
  },
];

interface TaxSummary {
  activeRates: number;
  jurisdictionCount: number;
}

const EMPTY_TAX_SUMMARY: TaxSummary = { activeRates: 0, jurisdictionCount: 0 };

export default function TaxPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [summary, setSummary] = useState<TaxSummary>(EMPTY_TAX_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "overview") return;
    let cancelled = false;
    client
      .list<{ jurisdiction?: string }>("/finance/tax-rates", { pageSize: 500 })
      .then((res) => {
        if (cancelled) return;
        const rates = res.data ?? [];
        setSummary({
          activeRates: res.total ?? rates.length,
          jurisdictionCount: new Set(
            rates.map((r) => r.jurisdiction).filter(Boolean),
          ).size,
        });
        setSummaryError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load tax summary";
        setSummaryError(message);
        notifyError("Failed to load Tax summary", message);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, client, notifyError]);

  return (
    <RouteGuard permission="finance.tax.read">
      <FinanceTabLayout
        tabs={TAX_TABS}
        moduleId="tax"
        moduleLabel="Tax"
        moduleIcon={Calculator}
        moduleDescription="Tax engine, filing, compliance, and reporting"
      >
        {activeTab === "overview" && (
          <div className="ui-stack-4 ui-animate-in">
            {summaryError && (
              <div className="ui-alert ui-alert-danger">
                <AlertTriangle size={16} />
                Failed to load tax summary — figures below may be stale.{" "}
                {summaryError}
              </div>
            )}
            <div className="ui-grid-2">
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Tax Rates Active</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-success)" }}
                  >
                    {summary.activeRates}
                  </p>
                  <p className="ui-text-xs-muted">
                    Across {summary.jurisdictionCount} jurisdictions
                  </p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Filing Calendar</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-warning)" }}
                  >
                    View Detail
                  </p>
                  <p className="ui-text-xs-muted">
                    See Filing Calendar and Tax Filing tabs
                  </p>
                </div>
              </Card>
            </div>
            <TaxEnginePage />
          </div>
        )}
        {activeTab === "jurisdictions" && (
          <div className="ui-stack-4 ui-animate-in">
            <TaxJurisdictionLookupTab />
          </div>
        )}
        {activeTab === "calendar" && (
          <div className="ui-stack-4 ui-animate-in">
            <TaxFilingCalendarTab />
          </div>
        )}
        {activeTab === "tax-engine" && (
          <div className="ui-stack-4 ui-animate-in">
            <TaxEnginePage />
          </div>
        )}
        {activeTab === "tax-filing" && (
          <div className="ui-stack-4 ui-animate-in">
            <SubTabBar
              tabs={[
                {
                  id: "filing",
                  label: "Tax Filing",
                  href: "/finance/tax?tab=tax-filing&subtab=filing",
                },
                {
                  id: "summary",
                  label: "Tax Filing Summary",
                  href: "/finance/tax?tab=tax-filing&subtab=summary",
                },
              ]}
            />
            <div style={{ marginTop: "var(--space-3)" }}>
              {subTab === "summary" ? (
                <TaxFilingSummaryPage />
              ) : (
                <TaxFilingPage />
              )}
            </div>
          </div>
        )}
        {activeTab === "gst-vat" && (
          <div className="ui-stack-4 ui-animate-in">
            <TaxFilingPage />
          </div>
        )}
        {activeTab === "1099" && (
          <div className="ui-stack-4 ui-animate-in">
            <Form1099Page />
          </div>
        )}
        {activeTab === "economic-nexus" && (
          <div className="ui-stack-4 ui-animate-in">
            <TaxNexusPage />
          </div>
        )}
        {activeTab === "audit-logs" && (
          <div className="ui-stack-4 ui-animate-in">
            <AuditLogsPage />
          </div>
        )}
      </FinanceTabLayout>
    </RouteGuard>
  );
}
