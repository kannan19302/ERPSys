"use client";

/**
 * Backward-compatible re-export. The canonical implementation now lives in
 * @unerp/ui-layout as ModuleTabLayout.
 *
 * On first load this wrapper migrates old localStorage keys so existing
 * users' pinned tabs and custom orders carry over.
 */

import { useEffect, useRef } from "react";

export {
  ModuleTabLayout as FinanceTabLayout,
  type ModuleTab as FinanceTab,
  type ModuleTabLayoutProps as FinanceTabLayoutProps,
} from "@unerp/ui-layout";

import {
  BarChart3,
  BookOpen,
  DollarSign,
  Receipt,
  Building2,
  Wallet,
  Calculator,
  PieChart,
  FileText,
  Activity,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export const FINANCE_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/finance",
    icon: BarChart3,
    description: "Executive financial dashboard and KPIs",
  },
  {
    id: "gl",
    label: "General Ledger",
    href: "/finance/gl",
    icon: BookOpen,
    description: "General ledger & chart of accounts",
  },
  {
    id: "ar",
    label: "Accounts Receivable",
    href: "/finance/ar",
    icon: DollarSign,
    description: "Invoicing, dunning & customer payments",
  },
  {
    id: "ap",
    label: "Accounts Payable",
    href: "/finance/ap",
    icon: Receipt,
    description: "Bills, vendor payments & 3-way matching",
  },
  {
    id: "banking",
    label: "Banking & Cash",
    href: "/finance/banking",
    icon: Building2,
    description: "Bank accounts & cash reconciliations",
  },
  {
    id: "assets",
    label: "Fixed Assets",
    href: "/finance/assets",
    icon: Wallet,
    description: "Asset tracking, depreciation & maintenance",
  },
  {
    id: "tax",
    label: "Tax Management",
    href: "/finance/tax",
    icon: Calculator,
    description: "Sales tax, nexus lookup & filing calendars",
  },
  {
    id: "budget",
    label: "Budget & Planning",
    href: "/finance/budget-planning",
    icon: PieChart,
    description: "Budgeting & financial forecasting",
  },
  {
    id: "reports",
    label: "Financial Reports",
    href: "/finance/reports",
    icon: FileText,
    description: "Balance sheet, P&L & cash flow statements",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/finance/settings",
    icon: Activity,
    description: "Finance module configuration",
    advanced: true,
    group: "Settings",
  },
];

const OLD_PREFIXES = [
  ["unerp:finance:pins", "unerp:tabs:pins"],
  ["unerp:finance:recent", "unerp:tabs:recent"],
  ["unerp:tab_order", "unerp:tabs:order"],
] as const;

let migrated = false;

export function useFinanceKeyMigration() {
  const ran = useRef(false);
  useEffect(() => {
    if (migrated || ran.current || typeof window === "undefined") return;
    ran.current = true;
    migrated = true;
    for (const [oldPrefix, newPrefix] of OLD_PREFIXES) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(oldPrefix)) {
          const suffix = key.slice(oldPrefix.length);
          const newKey = `${newPrefix}${suffix}`;
          if (!localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, localStorage.getItem(key)!);
          }
        }
      }
    }
  }, []);
}
