"use client";

import { Repeat } from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import RecurringInvoicesPage from "../advanced/recurring/page";

const RECURRING_TABS = [
  {
    id: "overview",
    label: "Recurring Invoices",
    href: "/finance/recurring",
    icon: Repeat,
    description: "Recurring invoice templates and generation",
  },
];

export default function FinanceRecurringPage() {
  return (
    <FinanceTabLayout
      tabs={RECURRING_TABS}
      moduleId="recurring"
      moduleLabel="Recurring"
      moduleIcon={Repeat}
      moduleDescription="Recurring invoices, templates, and generation schedule"
    >
      <RecurringInvoicesPage />
    </FinanceTabLayout>
  );
}
