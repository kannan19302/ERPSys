"use client";

import { Repeat } from "lucide-react";

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
  return <RecurringInvoicesPage />;
}
