"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Repeat,
  FileText,
  CalendarCheck,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Play,
  Pause,
  DollarSign,
} from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { Card, PageHeader, Button, Badge, Spinner } from "@unerp/ui";

interface RecurringTemplate {
  id: string;
  title: string;
  type: "Sales Invoice" | "Purchase Invoice" | "Expense" | "Payment";
  frequency: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  amount: number;
  currency: string;
  nextDate: string;
  customerOrVendor: string;
  status: "active" | "paused" | "completed";
  lastGenerated: string;
}

const TEMPLATES: RecurringTemplate[] = [
  {
    id: "RT01",
    title: "Monthly Rent - HQ",
    type: "Expense",
    frequency: "Monthly",
    amount: 15000.0,
    currency: "USD",
    nextDate: "2026-08-01",
    customerOrVendor: "Prime Properties LLC",
    status: "active",
    lastGenerated: "2026-07-01",
  },
  {
    id: "RT02",
    title: "Office Cleaning Service",
    type: "Expense",
    frequency: "Weekly",
    amount: 850.0,
    currency: "USD",
    nextDate: "2026-07-22",
    customerOrVendor: "CleanPro Services",
    status: "active",
    lastGenerated: "2026-07-15",
  },
  {
    id: "RT03",
    title: "Software License - Enterprise Suite",
    type: "Purchase Invoice",
    frequency: "Monthly",
    amount: 4200.0,
    currency: "USD",
    nextDate: "2026-08-05",
    customerOrVendor: "TechCorp Solutions",
    status: "active",
    lastGenerated: "2026-07-05",
  },
  {
    id: "RT04",
    title: "Managed IT Support Retainer",
    type: "Purchase Invoice",
    frequency: "Monthly",
    amount: 3500.0,
    currency: "USD",
    nextDate: "2026-08-01",
    customerOrVendor: "IT Guardian Inc",
    status: "active",
    lastGenerated: "2026-07-01",
  },
  {
    id: "RT05",
    title: "Consulting Retainer - ABC Corp",
    type: "Sales Invoice",
    frequency: "Monthly",
    amount: 12000.0,
    currency: "USD",
    nextDate: "2026-08-15",
    customerOrVendor: "ABC Corporation",
    status: "active",
    lastGenerated: "2026-07-15",
  },
  {
    id: "RT06",
    title: "Quarterly Maintenance Fee",
    type: "Sales Invoice",
    frequency: "Quarterly",
    amount: 5000.0,
    currency: "USD",
    nextDate: "2026-10-01",
    customerOrVendor: "Global Services Inc",
    status: "paused",
    lastGenerated: "2026-07-01",
  },
  {
    id: "RT07",
    title: "Insurance Premium",
    type: "Expense",
    frequency: "Yearly",
    amount: 24000.0,
    currency: "USD",
    nextDate: "2027-01-15",
    customerOrVendor: "SafeGuard Insurance",
    status: "active",
    lastGenerated: "2026-01-15",
  },
  {
    id: "RT08",
    title: "Cloud Hosting - AWS Reserved",
    type: "Purchase Invoice",
    frequency: "Monthly",
    amount: 2890.0,
    currency: "USD",
    nextDate: "2026-08-01",
    customerOrVendor: "Amazon Web Services",
    status: "active",
    lastGenerated: "2026-07-01",
  },
];

const GENERATED_INVOICES = [
  {
    id: "GI01",
    template: "Monthly Rent - HQ",
    invoiceNo: "INV-2026-0781",
    amount: 15000.0,
    date: "2026-07-01",
    status: "paid",
  },
  {
    id: "GI02",
    template: "Office Cleaning Service",
    invoiceNo: "INV-2026-0782",
    amount: 850.0,
    date: "2026-07-08",
    status: "paid",
  },
  {
    id: "GI03",
    template: "Software License - Enterprise Suite",
    invoiceNo: "INV-2026-0783",
    amount: 4200.0,
    date: "2026-07-05",
    status: "paid",
  },
  {
    id: "GI04",
    template: "Consulting Retainer - ABC Corp",
    invoiceNo: "INV-2026-0784",
    amount: 12000.0,
    date: "2026-07-15",
    status: "pending",
  },
  {
    id: "GI05",
    template: "Cloud Hosting - AWS Reserved",
    invoiceNo: "INV-2026-0785",
    amount: 2890.0,
    date: "2026-07-01",
    status: "paid",
  },
  {
    id: "GI06",
    template: "Managed IT Support Retainer",
    invoiceNo: "INV-2026-0786",
    amount: 3500.0,
    date: "2026-07-01",
    status: "paid",
  },
];

const UPCOMING_SCHEDULE = [
  {
    id: "US01",
    template: "Office Cleaning Service",
    date: "2026-07-22",
    amount: 850.0,
    status: "scheduled",
  },
  {
    id: "US02",
    template: "Monthly Rent - HQ",
    date: "2026-08-01",
    amount: 15000.0,
    status: "scheduled",
  },
  {
    id: "US03",
    template: "Managed IT Support Retainer",
    date: "2026-08-01",
    amount: 3500.0,
    status: "scheduled",
  },
  {
    id: "US04",
    template: "Cloud Hosting - AWS Reserved",
    date: "2026-08-01",
    amount: 2890.0,
    status: "scheduled",
  },
  {
    id: "US05",
    template: "Software License - Enterprise Suite",
    date: "2026-08-05",
    amount: 4200.0,
    status: "scheduled",
  },
  {
    id: "US06",
    template: "Consulting Retainer - ABC Corp",
    date: "2026-08-15",
    amount: 12000.0,
    status: "scheduled",
  },
];

const RECURRING_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/recurring",
    icon: Repeat,
    description: "Recurring transactions overview",
  },
  {
    id: "templates",
    label: "Templates",
    href: "/finance/recurring?tab=templates",
    icon: FileText,
    description: "Manage recurring invoice templates",
  },
  {
    id: "generated",
    label: "Generated Invoices",
    href: "/finance/recurring?tab=generated",
    icon: CalendarCheck,
    description: "Invoices generated from templates",
  },
  {
    id: "upcoming",
    label: "Upcoming Schedule",
    href: "/finance/recurring?tab=upcoming",
    icon: Calendar,
    description: "Upcoming recurring transactions",
  },
];

function RecurringOverview() {
  const totalMonthly = TEMPLATES.filter((t) => t.status === "active").reduce(
    (s, t) => {
      if (t.frequency === "Monthly") return s + t.amount;
      if (t.frequency === "Weekly") return s + t.amount * 4.33;
      if (t.frequency === "Quarterly") return s + t.amount / 3;
      if (t.frequency === "Yearly") return s + t.amount / 12;
      return s + t.amount;
    },
    0,
  );

  return (
    <div className="ui-stack-4">
      <PageHeader
        title="Recurring Transactions"
        description="Overview of all recurring invoices, expenses, and payments"
      />
      <div className="ui-grid-4">
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Active Templates</p>
          <p className="ui-heading-sm">
            {TEMPLATES.filter((t) => t.status === "active").length}
          </p>
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Monthly Run Rate</p>
          <p className="ui-heading-sm">
            $
            {totalMonthly.toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </p>
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Upcoming This Month</p>
          <p className="ui-heading-sm">
            $
            {UPCOMING_SCHEDULE.reduce((s, u) => s + u.amount, 0).toLocaleString(
              "en-US",
              { minimumFractionDigits: 2 },
            )}
          </p>
          <p className="ui-text-xs-muted">
            {UPCOMING_SCHEDULE.length} transactions
          </p>
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Paused Templates</p>
          <p className="ui-heading-sm">
            {TEMPLATES.filter((t) => t.status === "paused").length}
          </p>
        </Card>
      </div>
      <div className="ui-grid-2">
        <Card padding="lg" className="ui-stack-3">
          <h3 className="ui-heading-sm">Recent Generated Invoices</h3>
          {GENERATED_INVOICES.slice(0, 4).map((inv) => (
            <div
              key={inv.id}
              className="ui-hstack-3"
              style={{
                padding: "var(--space-2) 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500 }}>{inv.template}</p>
                <p className="ui-text-xs-muted">
                  {inv.invoiceNo} · {inv.date}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 600 }}>
                  ${inv.amount.toLocaleString()}
                </p>
                <Badge variant={inv.status === "paid" ? "success" : "warning"}>
                  {inv.status}
                </Badge>
              </div>
            </div>
          ))}
        </Card>
        <Card padding="lg" className="ui-stack-3">
          <h3 className="ui-heading-sm">Upcoming Schedule</h3>
          {UPCOMING_SCHEDULE.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="ui-hstack-3"
              style={{
                padding: "var(--space-2) 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500 }}>{item.template}</p>
                <p className="ui-text-xs-muted">{item.date}</p>
              </div>
              <p style={{ fontWeight: 600 }}>${item.amount.toLocaleString()}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function TemplatesPage() {
  return (
    <div className="ui-stack-4">
      <div
        className="ui-hstack-4"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <PageHeader
          title="Recurring Templates"
          description="Create and manage recurring invoice and payment templates"
        />
        <Button variant="primary">New Template</Button>
      </div>
      <div className="ui-grid-2">
        {TEMPLATES.map((tpl) => (
          <Card key={tpl.id} padding="lg" className="ui-stack-3">
            <div
              className="ui-hstack-3"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h3 className="ui-heading-sm">{tpl.title}</h3>
                <p
                  className="ui-text-xs-muted"
                  style={{ marginTop: "var(--space-1)" }}
                >
                  {tpl.type} · {tpl.customerOrVendor}
                </p>
              </div>
              <Badge
                variant={
                  tpl.status === "active"
                    ? "success"
                    : tpl.status === "paused"
                      ? "warning"
                      : "default"
                }
              >
                {tpl.status}
              </Badge>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-2)",
              }}
            >
              <div>
                <p className="ui-text-xs-muted">Frequency</p>
                <p className="ui-text-sm" style={{ fontWeight: 500 }}>
                  {tpl.frequency}
                </p>
              </div>
              <div>
                <p className="ui-text-xs-muted">Amount</p>
                <p className="ui-text-sm" style={{ fontWeight: 600 }}>
                  {tpl.currency === "EUR" ? "€" : "$"}
                  {tpl.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="ui-text-xs-muted">Next Date</p>
                <p className="ui-text-sm" style={{ fontWeight: 500 }}>
                  {tpl.nextDate}
                </p>
              </div>
              <div>
                <p className="ui-text-xs-muted">Last Generated</p>
                <p className="ui-text-sm" style={{ fontWeight: 500 }}>
                  {tpl.lastGenerated}
                </p>
              </div>
            </div>
            <div className="ui-hstack-2" style={{ justifyContent: "flex-end" }}>
              <Button variant="ghost" size="sm">
                {tpl.status === "paused" ? "Play" : "Pause"}
              </Button>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
              <Button variant="ghost" size="sm">
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GeneratedInvoicesPage() {
  return (
    <div className="ui-stack-4">
      <PageHeader
        title="Generated Invoices"
        description="Invoices automatically created from recurring templates"
      />
      <Card padding="lg">
        <div style={{ overflowX: "auto" }}>
          <table className="ui-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Template</th>
                <th>Invoice No</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {GENERATED_INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 500 }}>{inv.template}</td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: "var(--font-xs)",
                    }}
                  >
                    {inv.invoiceNo}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    $
                    {inv.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="ui-text-xs-muted">{inv.date}</td>
                  <td>
                    <Badge
                      variant={inv.status === "paid" ? "success" : "warning"}
                    >
                      {inv.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function UpcomingSchedulePage() {
  return (
    <div className="ui-stack-4">
      <PageHeader
        title="Upcoming Schedule"
        description="Scheduled recurring transactions for the coming months"
      />
      <Card padding="lg">
        <div style={{ overflowX: "auto" }}>
          <table className="ui-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Template</th>
                <th>Scheduled Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {UPCOMING_SCHEDULE.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.template}</td>
                  <td>{item.date}</td>
                  <td style={{ fontWeight: 600 }}>
                    $
                    {item.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <Badge variant="info">{item.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function FinanceRecurringPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  return (
    <FinanceTabLayout
      tabs={RECURRING_TABS}
      moduleId="recurring"
      moduleLabel="Recurring"
      moduleIcon={Repeat}
      moduleDescription="Recurring invoices, expenses, payments, and subscription management"
    >
      {activeTab === "overview" && <RecurringOverview />}
      {activeTab === "templates" && <TemplatesPage />}
      {activeTab === "generated" && <GeneratedInvoicesPage />}
      {activeTab === "upcoming" && <UpcomingSchedulePage />}
    </FinanceTabLayout>
  );
}
