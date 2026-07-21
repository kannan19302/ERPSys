"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Receipt,
  Wallet,
  ListChecks,
  Clock,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  Filter,
  Search,
} from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { Card, PageHeader, Button, Badge, Spinner } from "@unerp/ui";

interface ExpenseEntry {
  id: string;
  employee: string;
  category: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected" | "reimbursed";
  description: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  icon: string;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "EC01", name: "Travel", budget: 50000, spent: 32450, icon: "✈️" },
  {
    id: "EC02",
    name: "Meals & Entertainment",
    budget: 25000,
    spent: 18200,
    icon: "🍽️",
  },
  {
    id: "EC03",
    name: "Office Supplies",
    budget: 15000,
    spent: 8900,
    icon: "📎",
  },
  {
    id: "EC04",
    name: "Software & Subscriptions",
    budget: 75000,
    spent: 62300,
    icon: "💻",
  },
  {
    id: "EC05",
    name: "Transportation",
    budget: 20000,
    spent: 14100,
    icon: "🚗",
  },
  { id: "EC06", name: "Utilities", budget: 30000, spent: 24100, icon: "💡" },
];

const EXPENSES: ExpenseEntry[] = [
  {
    id: "EXP001",
    employee: "Sarah Johnson",
    category: "Travel",
    amount: 1245.0,
    date: "2026-07-15",
    status: "approved",
    description: "NYC client meeting flights",
  },
  {
    id: "EXP002",
    employee: "Mike Chen",
    category: "Meals & Entertainment",
    amount: 340.0,
    date: "2026-07-14",
    status: "pending",
    description: "Client dinner - Ocean Prime",
  },
  {
    id: "EXP003",
    employee: "Emily Davis",
    category: "Office Supplies",
    amount: 89.5,
    date: "2026-07-13",
    status: "reimbursed",
    description: "Standing desk accessories",
  },
  {
    id: "EXP004",
    employee: "James Wilson",
    category: "Software & Subscriptions",
    amount: 299.0,
    date: "2026-07-12",
    status: "approved",
    description: "Figma annual license",
  },
  {
    id: "EXP005",
    employee: "Sarah Johnson",
    category: "Transportation",
    amount: 56.0,
    date: "2026-07-11",
    status: "reimbursed",
    description: "Uber to airport",
  },
  {
    id: "EXP006",
    employee: "Lisa Thompson",
    category: "Travel",
    amount: 2890.0,
    date: "2026-07-10",
    status: "pending",
    description: "Chicago conference + hotel",
  },
  {
    id: "EXP007",
    employee: "Mike Chen",
    category: "Meals & Entertainment",
    amount: 175.0,
    date: "2026-07-09",
    status: "rejected",
    description: "Team lunch - not in policy",
  },
  {
    id: "EXP008",
    employee: "Emily Davis",
    category: "Utilities",
    amount: 450.0,
    date: "2026-07-08",
    status: "approved",
    description: "Internet - HQ billing",
  },
  {
    id: "EXP009",
    employee: "James Wilson",
    category: "Travel",
    amount: 780.0,
    date: "2026-07-07",
    status: "pending",
    description: "SF office visit",
  },
  {
    id: "EXP010",
    employee: "Lisa Thompson",
    category: "Office Supplies",
    amount: 234.0,
    date: "2026-07-06",
    status: "reimbursed",
    description: "Monitor + cables",
  },
];

const STATUS_BADGE: Record<string, "info" | "success" | "danger" | "warning"> =
  {
    pending: "warning",
    approved: "info",
    reimbursed: "success",
    rejected: "danger",
  };

const EXPENSES_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/expenses",
    icon: Receipt,
    description: "Expense overview and summary",
  },
  {
    id: "my-expenses",
    label: "My Expenses",
    href: "/finance/expenses?tab=my-expenses",
    icon: Wallet,
    description: "My submitted expense reports",
  },
  {
    id: "categories",
    label: "Categories",
    href: "/finance/expenses?tab=categories",
    icon: ListChecks,
    description: "Expense category management",
  },
  {
    id: "pending-approval",
    label: "Pending Approval",
    href: "/finance/expenses?tab=pending-approval",
    icon: Clock,
    description: "Expenses awaiting approval",
  },
  {
    id: "reimbursement",
    label: "Reimbursement",
    href: "/finance/expenses?tab=reimbursement",
    icon: CheckCircle2,
    description: "Completed reimbursements",
  },
];

function ExpensesOverview() {
  const totalPending = EXPENSES.filter((e) => e.status === "pending").reduce(
    (s, e) => s + e.amount,
    0,
  );
  const totalApproved = EXPENSES.filter((e) => e.status === "approved").reduce(
    (s, e) => s + e.amount,
    0,
  );
  const totalReimbursed = EXPENSES.filter(
    (e) => e.status === "reimbursed",
  ).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="ui-stack-4">
      <PageHeader
        title="Expense Overview"
        description="Summary of all expense activity"
      />
      <div className="ui-grid-4">
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Total Expenses</p>
          <p className="ui-heading-sm">
            $
            {EXPENSES.reduce((s, e) => s + e.amount, 0).toLocaleString(
              "en-US",
              { minimumFractionDigits: 2 },
            )}
          </p>
          <p className="ui-text-xs-muted">{EXPENSES.length} entries</p>
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Pending Approval</p>
          <p className="ui-heading-sm ui-text-warning">
            $
            {totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="ui-text-xs-muted">
            {EXPENSES.filter((e) => e.status === "pending").length} items
          </p>
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Approved</p>
          <p className="ui-heading-sm">
            $
            {totalApproved.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="ui-text-xs-muted">
            {EXPENSES.filter((e) => e.status === "approved").length} items
          </p>
        </Card>
        <Card padding="lg" className="ui-stack-2">
          <p className="ui-text-xs-muted">Reimbursed</p>
          <p className="ui-heading-sm ui-text-success">
            $
            {totalReimbursed.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="ui-text-xs-muted">
            {EXPENSES.filter((e) => e.status === "reimbursed").length} items
          </p>
        </Card>
      </div>
      <Card padding="lg">
        <h3
          className="ui-heading-sm"
          style={{ marginBottom: "var(--space-3)" }}
        >
          Recent Expenses
        </h3>
        <ExpenseTable expenses={EXPENSES.slice(0, 6)} />
      </Card>
    </div>
  );
}

function ExpenseTable({ expenses }: { expenses: ExpenseEntry[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="ui-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id}>
              <td
                style={{
                  fontWeight: 600,
                  fontFamily: "monospace",
                  fontSize: "var(--font-xs)",
                }}
              >
                {exp.id}
              </td>
              <td>{exp.employee}</td>
              <td>
                <Badge variant="info">{exp.category}</Badge>
              </td>
              <td className="ui-text-xs-muted">{exp.description}</td>
              <td style={{ fontWeight: 600 }}>${exp.amount.toFixed(2)}</td>
              <td className="ui-text-xs-muted">{exp.date}</td>
              <td>
                <Badge variant={STATUS_BADGE[exp.status]}>{exp.status}</Badge>
              </td>
              <td>
                <div className="ui-hstack-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MyExpensesPage() {
  return (
    <div className="ui-stack-4">
      <div
        className="ui-hstack-4"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <PageHeader
          title="My Expenses"
          description="Submit and track your expense reports"
        />
        <Button variant="primary">New Expense</Button>
      </div>
      <div className="ui-hstack-3" style={{ gap: "var(--space-2)" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "var(--space-2)",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-tertiary)",
            }}
          />
          <input
            className="ui-input"
            placeholder="Search expenses..."
            style={{ paddingLeft: "var(--space-6)", width: "100%" }}
          />
        </div>
        <Button variant="ghost">Filter</Button>
      </div>
      <Card padding="lg">
        <ExpenseTable expenses={EXPENSES} />
      </Card>
    </div>
  );
}

function CategoriesPage() {
  return (
    <div className="ui-stack-4">
      <div
        className="ui-hstack-4"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <PageHeader
          title="Expense Categories"
          description="Manage expense categories and budgets"
        />
        <Button variant="primary">Add Category</Button>
      </div>
      <div className="ui-grid-3">
        {EXPENSE_CATEGORIES.map((cat) => {
          const pct = Math.round((cat.spent / cat.budget) * 100);
          const overBudget = pct > 100;
          return (
            <Card key={cat.id} padding="lg" className="ui-stack-3">
              <div className="ui-hstack-3" style={{ alignItems: "center" }}>
                <span style={{ fontSize: "var(--font-xl)" }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 className="ui-heading-sm">{cat.name}</h3>
                  <p className="ui-text-xs-muted">
                    Budget: ${cat.budget.toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <div
                  className="ui-hstack-2"
                  style={{
                    justifyContent: "space-between",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  <span className="ui-text-xs-muted">
                    Spent: ${cat.spent.toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "var(--font-xs)",
                      color: overBudget
                        ? "var(--color-danger)"
                        : "var(--color-text)",
                    }}
                  >
                    {pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "var(--color-surface-2)",
                    borderRadius: "var(--radius-full)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      height: "100%",
                      background: overBudget
                        ? "var(--color-danger)"
                        : "var(--color-primary)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PendingApprovalPage() {
  const pending = EXPENSES.filter((e) => e.status === "pending");
  return (
    <div className="ui-stack-4">
      <div
        className="ui-hstack-4"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <PageHeader
          title="Pending Approval"
          description={`${pending.length} expenses awaiting your review`}
        />
        <Button variant="primary">Approve Selected</Button>
      </div>
      <Card padding="lg">
        {pending.length === 0 ? (
          <p className="ui-text-xs-muted">No pending expenses to review.</p>
        ) : (
          <ExpenseTable expenses={pending} />
        )}
      </Card>
    </div>
  );
}

function ReimbursementPage() {
  const reimbursed = EXPENSES.filter((e) => e.status === "reimbursed");
  return (
    <div className="ui-stack-4">
      <PageHeader
        title="Reimbursement"
        description="Completed expense reimbursements"
      />
      <Card padding="lg">
        {reimbursed.length === 0 ? (
          <p className="ui-text-xs-muted">No reimbursements yet.</p>
        ) : (
          <ExpenseTable expenses={reimbursed} />
        )}
      </Card>
    </div>
  );
}

export default function FinanceExpensesPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  return (
    <FinanceTabLayout
      tabs={EXPENSES_TABS}
      moduleId="expenses"
      moduleLabel="Expenses"
      moduleIcon={Receipt}
      moduleDescription="Expense reporting, approval workflows, and reimbursement"
    >
      {activeTab === "overview" && <ExpensesOverview />}
      {activeTab === "my-expenses" && <MyExpensesPage />}
      {activeTab === "categories" && <CategoriesPage />}
      {activeTab === "pending-approval" && <PendingApprovalPage />}
      {activeTab === "reimbursement" && <ReimbursementPage />}
    </FinanceTabLayout>
  );
}
