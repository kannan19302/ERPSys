"use client";

import { useSearchParams } from "next/navigation";
import { Calculator, FileText, Globe, ShieldCheck, Eye } from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { RouteGuard } from "@unerp/framework";
import { Card } from "@unerp/ui";

import TaxEnginePage from "../advanced/tax-engine/page";
import TaxFilingPage from "../advanced/tax-filing/page";
import TaxFilingSummaryPage from "../advanced/tax-filing-summary/page";
import Form1099Page from "../advanced/1099-reporting/page";
import TaxNexusPage from "../advanced/tax-nexus/page";
import AuditLogsPage from "../advanced/audit-logs/page";

const TAX_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/tax",
    icon: Calculator,
    description: "Tax management summary",
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

export default function TaxPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");

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
            <div className="ui-grid-3">
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">
                    Tax Liability (This Quarter)
                  </p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-primary)" }}
                  >
                    $124,500
                  </p>
                  <p className="ui-text-xs-muted">GST/VAT + Income Tax</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Upcoming Filings</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-warning)" }}
                  >
                    3
                  </p>
                  <p className="ui-text-xs-muted">Next due: Aug 15, 2026</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Tax Rates Active</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-success)" }}
                  >
                    24
                  </p>
                  <p className="ui-text-xs-muted">Across 6 jurisdictions</p>
                </div>
              </Card>
            </div>
            <TaxEnginePage />
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
