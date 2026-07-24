"use client";

/**
 * Thin re-export. The canonical implementation lives in @unerp/ui-layout as
 * ModuleTabLayout — follows the same convention as
 * @/components/finance/FinanceTabLayout and CrmTabLayout.
 */

export {
  ModuleTabLayout as SaasTabLayout,
  type ModuleTab as SaasTab,
  type ModuleTabLayoutProps as SaasTabLayoutProps,
} from "@unerp/ui-layout";

import {
  Cloud,
  Users,
  CreditCard,
  Key,
  ShieldCheck,
  LifeBuoy,
  Settings,
  Activity,
  Layers,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export const SAAS_TABS: ModuleTab[] = [
  {
    id: "portal",
    label: "Overview",
    href: "/saas/portal",
    icon: Cloud,
    description: "SaaS Control Center overview",
  },
  {
    id: "tenants",
    label: "Tenants",
    href: "/saas/admin",
    icon: Users,
    description: "Tenant management and provision",
  },
  {
    id: "plans",
    label: "Plans & Billing",
    href: "/saas/plans",
    icon: CreditCard,
    description: "Plans, pricing, and billing",
  },
  {
    id: "api-keys",
    label: "API Keys & Webhooks",
    href: "/saas/api-keys",
    icon: Key,
    description: "Developer API keys and webhooks",
  },
  {
    id: "security",
    label: "Security & Compliance",
    href: "/saas/security",
    icon: ShieldCheck,
    description: "Security policies and compliance",
  },
  {
    id: "support",
    label: "Support",
    href: "/saas/support",
    icon: LifeBuoy,
    description: "Support tickets and help center",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/saas/settings",
    icon: Settings,
    description: "SaaS platform configuration",
    advanced: true,
    group: "Settings",
  },
];
