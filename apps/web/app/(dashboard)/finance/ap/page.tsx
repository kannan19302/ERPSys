"use client";

import { useSearchParams } from "next/navigation";
import {
  FileText,
  Building2,
  CreditCard,
  Layers,
  ScanSearch,
  ShoppingCart,
  GitCompare,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { ListView, RouteGuard } from "@unerp/framework";
import { invoiceResource, paymentResource } from "@/modules/finance";
import { vendorResource } from "@/modules/crm";
import { Card, PageHeader } from "@unerp/ui";

import PaymentBatchesPage from "../advanced/payment-batches/page";
import PaymentTermsPage from "../advanced/payment-terms/page";
import ExpensePoliciesPage from "../advanced/expense-policies/page";
import ExpenseReportsPage from "../advanced/expense-reports/page";
import InvoiceCapturePage from "../advanced/invoice-capture/page";
import ApAutomationPage from "../advanced/ap-automation/page";
import ApMatchRulesPage from "../advanced/ap-match-rules/page";
import ExceptionQueuePage from "../advanced/exception-queue/page";

const AP_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/ap",
    icon: FileText,
    description: "Accounts Payable summary",
  },
  {
    id: "bills",
    label: "Bills",
    href: "/finance/ap?tab=bills",
    icon: FileText,
    description: "Vendor bills and payable invoices",
  },
  {
    id: "vendors",
    label: "Vendors",
    href: "/finance/ap?tab=vendors",
    icon: Building2,
    description: "Vendor directory",
  },
  {
    id: "payments",
    label: "Payments",
    href: "/finance/ap?tab=payments",
    icon: CreditCard,
    description: "Outgoing payments",
  },
  {
    id: "payment-batches",
    label: "Payment Batches",
    href: "/finance/ap?tab=payment-batches",
    icon: Layers,
    description: "Batch payment processing",
  },
  {
    id: "expense-policies",
    label: "Expense Policies",
    href: "/finance/ap?tab=expense-policies",
    icon: ShieldCheck,
    description: "Expense policies, mileage, per-diem, and corporate cards",
  },
  {
    id: "ai-invoice-capture",
    label: "AI Invoice Capture",
    href: "/finance/ap?tab=ai-invoice-capture",
    icon: ScanSearch,
    description: "AI-powered invoice data extraction",
    advanced: true,
    group: "AP Automation",
  },
  {
    id: "ap-automation",
    label: "AP Automation",
    href: "/finance/ap?tab=ap-automation",
    icon: ShoppingCart,
    description: "Full AP workflow automation",
    advanced: true,
    group: "AP Automation",
  },
  {
    id: "ap-match-rules",
    label: "AP Match Rules",
    href: "/finance/ap?tab=ap-match-rules",
    icon: GitCompare,
    description: "Invoice-to-PO matching rules",
    advanced: true,
    group: "AP Automation",
  },
  {
    id: "exception-queue",
    label: "Exception Queue",
    href: "/finance/ap?tab=exception-queue",
    icon: AlertTriangle,
    description: "AP exceptions and resolution",
    advanced: true,
    group: "AP Automation",
  },
];

export default function APPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");

  return (
    <RouteGuard permission="finance.payables.read">
      <FinanceTabLayout
        tabs={AP_TABS}
        moduleId="ap"
        moduleLabel="Accounts Payable"
        moduleIcon={Building2}
        moduleDescription="Vendor bills, payments, AP automation, and invoice processing"
      >
        {activeTab === "overview" && (
          <div className="ui-stack-4 ui-animate-in">
            <div className="ui-grid-3">
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Outstanding Payables</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-primary)" }}
                  >
                    $192,300
                  </p>
                  <p className="ui-text-xs-muted">Across 89 bills</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Due This Week</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-warning)" }}
                  >
                    $38,500
                  </p>
                  <p className="ui-text-xs-muted">14 bills due</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Processed This Month</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-success)" }}
                  >
                    $156,200
                  </p>
                  <p className="ui-text-xs-muted">42 payments processed</p>
                </div>
              </Card>
            </div>
            <Card padding="md">
              <h3
                className="ui-heading-sm"
                style={{ marginBottom: "var(--space-3)" }}
              >
                Upcoming Payments
              </h3>
              <ListView resource={invoiceResource} />
            </Card>
          </div>
        )}
        {activeTab === "bills" && (
          <div className="ui-stack-4 ui-animate-in">
            <PageHeader
              title="Bills"
              description="Manage vendor bills and accounts payable"
            />
            <ListView resource={invoiceResource} />
          </div>
        )}
        {activeTab === "vendors" && (
          <div className="ui-stack-4 ui-animate-in">
            <PageHeader
              title="Vendors"
              description="Vendor directory and management"
            />
            <ListView resource={vendorResource} />
          </div>
        )}
        {activeTab === "payments" && (
          <div className="ui-stack-4 ui-animate-in">
            <PageHeader
              title="Payments"
              description="Process outgoing payments to vendors"
            />
            <ListView resource={paymentResource} />
          </div>
        )}
        {activeTab === "payment-batches" && (
          <div className="ui-stack-4 ui-animate-in">
            <SubTabBar
              tabs={[
                {
                  id: "batches",
                  label: "Payment Batches",
                  href: "/finance/ap?tab=payment-batches&subtab=batches",
                },
                {
                  id: "terms",
                  label: "Payment Terms",
                  href: "/finance/ap?tab=payment-batches&subtab=terms",
                },
              ]}
            />
            <div style={{ marginTop: "var(--space-3)" }}>
              {subTab === "terms" ? (
                <PaymentTermsPage />
              ) : (
                <PaymentBatchesPage />
              )}
            </div>
          </div>
        )}
        {activeTab === "expense-policies" && (
          <div className="ui-stack-4 ui-animate-in">
            <SubTabBar
              tabs={[
                {
                  id: "policies",
                  label: "Expense Policies",
                  href: "/finance/ap?tab=expense-policies&subtab=policies",
                },
                {
                  id: "reports",
                  label: "Expense Reports",
                  href: "/finance/ap?tab=expense-policies&subtab=reports",
                },
              ]}
            />
            <div style={{ marginTop: "var(--space-3)" }}>
              {subTab === "reports" ? (
                <ExpenseReportsPage />
              ) : (
                <ExpensePoliciesPage />
              )}
            </div>
          </div>
        )}
        {activeTab === "ai-invoice-capture" && (
          <div className="ui-stack-4 ui-animate-in">
            <InvoiceCapturePage />
          </div>
        )}
        {activeTab === "ap-automation" && (
          <div className="ui-stack-4 ui-animate-in">
            <ApAutomationPage />
          </div>
        )}
        {activeTab === "ap-match-rules" && (
          <div className="ui-stack-4 ui-animate-in">
            <ApMatchRulesPage />
          </div>
        )}
        {activeTab === "exception-queue" && (
          <div className="ui-stack-4 ui-animate-in">
            <ExceptionQueuePage />
          </div>
        )}
      </FinanceTabLayout>
    </RouteGuard>
  );
}
