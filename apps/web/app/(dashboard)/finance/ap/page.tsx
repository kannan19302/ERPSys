"use client";

import { useEffect, useState } from "react";
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
import { FormView, ListView, RouteGuard, useApiClient } from "@unerp/framework";
import {
  debitNoteResource,
  vendorBillPaymentResource,
  vendorBillResource,
} from "@/modules/finance";
import { vendorResource } from "@/modules/crm";
import { Card, Modal, PageHeader, useToast } from "@unerp/ui";

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
    id: "debit-notes",
    label: "Debit Notes",
    href: "/finance/ap?tab=debit-notes",
    icon: FileText,
    description: "Vendor debit notes and adjustments",
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

function DebitNotesPanel() {
  const { success } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="ui-stack-4">
      <ListView
        key={refreshKey}
        resource={debitNoteResource}
        onCreate={() => setShowCreate(true)}
      />
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Debit Note"
        size="lg"
      >
        <FormView
          resource={debitNoteResource}
          onSuccess={() => {
            setShowCreate(false);
            success("Debit note created");
            setRefreshKey((k) => k + 1);
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}

interface ApSummary {
  totalOutstanding: number;
  totalBills: number;
  dueThisWeekAmount: number;
  dueThisWeekCount: number;
  processedThisMonthAmount: number;
  processedThisMonthCount: number;
}

const EMPTY_AP_SUMMARY: ApSummary = {
  totalOutstanding: 0,
  totalBills: 0,
  dueThisWeekAmount: 0,
  dueThisWeekCount: 0,
  processedThisMonthAmount: 0,
  processedThisMonthCount: 0,
};

export default function APPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");
  const client = useApiClient();
  const [summary, setSummary] = useState<ApSummary>(EMPTY_AP_SUMMARY);

  useEffect(() => {
    if (activeTab !== "overview") return;
    let cancelled = false;
    Promise.all([
      client.get<{ total: number; totalOutstanding: number }>(
        "/finance/vendor-bills/stats",
      ),
      client.list<{
        status: string;
        dueDate: string;
        totalAmount: number;
        paidAmount: number;
      }>("/finance/vendor-bills", { pageSize: 500 }),
    ])
      .then(([stats, billsResult]) => {
        if (cancelled) return;
        const bills = billsResult.data ?? [];
        const now = new Date();
        const weekOut = new Date(now.getTime() + 7 * 86400000);
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        let dueThisWeekAmount = 0;
        let dueThisWeekCount = 0;
        let processedThisMonthAmount = 0;
        let processedThisMonthCount = 0;

        for (const b of bills) {
          const due = new Date(b.dueDate);
          if (
            b.status !== "PAID" &&
            b.status !== "VOID" &&
            due >= now &&
            due <= weekOut
          ) {
            dueThisWeekAmount += b.totalAmount - b.paidAmount;
            dueThisWeekCount++;
          }
          if (
            b.status === "PAID" &&
            due.getMonth() === thisMonth &&
            due.getFullYear() === thisYear
          ) {
            processedThisMonthAmount += b.totalAmount;
            processedThisMonthCount++;
          }
        }

        setSummary({
          totalOutstanding: stats?.totalOutstanding ?? 0,
          totalBills: stats?.total ?? 0,
          dueThisWeekAmount,
          dueThisWeekCount,
          processedThisMonthAmount,
          processedThisMonthCount,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeTab, client]);

  const { success } = useToast();
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [billsKey, setBillsKey] = useState(0);

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
                    {summary.totalOutstanding.toLocaleString(undefined, {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="ui-text-xs-muted">
                    Across {summary.totalBills} bills
                  </p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Due This Week</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-warning)" }}
                  >
                    {summary.dueThisWeekAmount.toLocaleString(undefined, {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="ui-text-xs-muted">
                    {summary.dueThisWeekCount} bills due
                  </p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Processed This Month</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-success)" }}
                  >
                    {summary.processedThisMonthAmount.toLocaleString(
                      undefined,
                      {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      },
                    )}
                  </p>
                  <p className="ui-text-xs-muted">
                    {summary.processedThisMonthCount} bills paid
                  </p>
                </div>
              </Card>
            </div>
            <Card padding="md">
              <h3
                className="ui-heading-sm"
                style={{ marginBottom: "var(--space-3)" }}
              >
                Vendor Bills
              </h3>
              <ListView resource={vendorBillResource} />
            </Card>
          </div>
        )}
        {activeTab === "bills" && (
          <div className="ui-stack-4 ui-animate-in">
            <PageHeader
              title="Bills"
              description="Manage vendor bills and accounts payable"
            />
            <ListView
              key={billsKey}
              resource={vendorBillResource}
              onCreate={() => setShowCreateBill(true)}
            />
            <Modal
              open={showCreateBill}
              onClose={() => setShowCreateBill(false)}
              title="Create Vendor Bill"
              size="lg"
            >
              <FormView
                resource={vendorBillResource}
                onSuccess={() => {
                  setShowCreateBill(false);
                  success("Vendor bill created");
                  setBillsKey((k) => k + 1);
                }}
                onCancel={() => setShowCreateBill(false)}
              />
            </Modal>
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
        {activeTab === "debit-notes" && (
          <div className="ui-stack-4 ui-animate-in">
            <PageHeader
              title="Debit Notes"
              description="Vendor debit notes and adjustments"
            />
            <DebitNotesPanel />
          </div>
        )}
        {activeTab === "payments" && (
          <div className="ui-stack-4 ui-animate-in">
            <PageHeader
              title="Payments"
              description="Process outgoing payments to vendors"
            />
            <ListView resource={vendorBillPaymentResource} />
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
