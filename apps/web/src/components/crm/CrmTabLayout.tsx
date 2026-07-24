"use client";

import { useEffect, useRef } from "react";

export {
  ModuleTabLayout as CrmTabLayout,
  type ModuleTab as CrmTab,
  type ModuleTabLayoutProps as CrmTabLayoutProps,
} from "@unerp/ui-layout";

import {
  BarChart3,
  UserPlus,
  Target,
  Building2,
  Users,
  PieChart,
  Activity,
  Handshake,
  Settings,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export const CRM_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/crm",
    icon: BarChart3,
    description: "CRM executive dashboard",
  },
  {
    id: "leads",
    label: "Leads",
    href: "/crm/leads",
    icon: UserPlus,
    description: "Lead management and qualification",
  },
  {
    id: "opportunities",
    label: "Opportunities",
    href: "/crm/opportunities",
    icon: Target,
    description: "Sales pipeline and deal tracking",
  },
  {
    id: "customers",
    label: "Customers",
    href: "/crm/customers",
    icon: Building2,
    description: "Customer accounts directory",
  },
  {
    id: "contacts",
    label: "Contacts",
    href: "/crm/contacts",
    icon: Users,
    description: "Contact directory and relationships",
  },
  {
    id: "marketing",
    label: "Marketing",
    href: "/crm/marketing-outreach",
    icon: PieChart,
    description: "Campaigns and marketing outreach",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "automation",
    label: "Automation",
    href: "/crm/automation",
    icon: Activity,
    description: "Sales automation and sequences",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "customer-success",
    label: "Customer Success",
    href: "/crm/customer-success",
    icon: Handshake,
    description: "Customer health and retention",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/crm/settings",
    icon: Settings,
    description: "CRM module settings",
    advanced: true,
    group: "Settings",
  },
];

const OLD_PREFIXES = [
  ["unerp:crm:pins", "unerp:tabs:pins"],
  ["unerp:crm:recent", "unerp:tabs:recent"],
  ["unerp:tab_order_crm", "unerp:tabs:order"],
] as const;

let migrated = false;

export function useCrmKeyMigration() {
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
