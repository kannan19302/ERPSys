"use client";

import { useSearchParams } from "next/navigation";
import { Receipt } from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import ExpenseManagementPage from "../advanced/expense-reports/page";
import ExpensePoliciesPage from "../advanced/expense-policies/page";

const EXPENSES_TABS = [
  {
    id: "reports",
    label: "Expense Reports",
    href: "/finance/expenses",
    icon: Receipt,
    description: "Submit, review, and approve expense reports",
  },
  {
    id: "policies",
    label: "Policies & Rates",
    href: "/finance/expenses?tab=policies",
    icon: Receipt,
    description: "Expense policies, mileage, and per-diem rates",
  },
];

export default function FinanceExpensesPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "reports";

  return (
    <FinanceTabLayout
      tabs={EXPENSES_TABS}
      moduleId="expenses"
      moduleLabel="Expenses"
      moduleIcon={Receipt}
      moduleDescription="Expense reporting, approval workflows, and reimbursement"
    >
      {activeTab === "policies" ? (
        <ExpensePoliciesPage />
      ) : (
        <ExpenseManagementPage />
      )}
    </FinanceTabLayout>
  );
}
