// @ts-nocheck
"use client";
import {
  CreditCard,
  Layers,
  TicketPercent,
  AlertTriangle,
  FileText,
  BarChart3,
  Activity,
  ArrowUpDown,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";
export {
  ModuleTabLayout as SubscriptionsTabLayout,
  type ModuleTab as SubscriptionsTab,
  type ModuleTabLayoutProps as SubscriptionsTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const SUBSCRIPTIONS_TABS: ModuleTab[] = [
  {
    id: "subscriptions",
    label: "Subscriptions",
    href: "/finance/advanced/subscriptions",
    icon: CreditCard,
    description: "Manage subscriptions",
  },
  {
    id: "plans",
    label: "Plans",
    href: "/subscriptions/plans",
    icon: Layers,
    description: "Plan management",
  },
  {
    id: "tiers",
    label: "Tiers",
    href: "/subscriptions/tiers",
    icon: BarChart3,
    description: "Pricing tiers",
  },
  {
    id: "coupons",
    label: "Coupons",
    href: "/subscriptions/coupons",
    icon: TicketPercent,
    description: "Coupon management",
  },
  {
    id: "dunning",
    label: "Dunning",
    href: "/subscriptions/dunning",
    icon: AlertTriangle,
    description: "Dunning processes",
  },
  {
    id: "credit-notes",
    label: "Credit Notes",
    href: "/subscriptions/credit-notes",
    icon: FileText,
    description: "Credit note management",
  },
  {
    id: "usage",
    label: "Usage",
    href: "/subscriptions/usage",
    icon: Activity,
    description: "Usage tracking",
  },
  {
    id: "migrations",
    label: "Migrations",
    href: "/subscriptions/migrations",
    icon: ArrowUpDown,
    description: "Plan migrations",
    advanced: true,
    group: "Advanced",
  },
];
