"use client";

import {
  Store,
  ShoppingCart,
  Users,
  BarChart3,
  Activity,
  Clock,
  Percent,
  Settings,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as PosTabLayout,
  type ModuleTab as PosTab,
  type ModuleTabLayoutProps as PosTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const POS_TABS: ModuleTab[] = [
  {
    id: "terminal",
    label: "POS Terminal",
    href: "/pos",
    icon: Store,
    description: "Point of sale terminal",
  },
  {
    id: "orders",
    label: "POS Orders",
    href: "/pos/orders",
    icon: ShoppingCart,
    description: "POS order history",
  },
  {
    id: "customers",
    label: "Customers & Loyalty",
    href: "/pos/customers",
    icon: Users,
    description: "Customer management and loyalty",
  },
  {
    id: "reports",
    label: "Sales Analytics",
    href: "/pos/reports",
    icon: BarChart3,
    description: "POS sales analytics",
  },
  {
    id: "advanced",
    label: "Advanced Features",
    href: "/pos/advanced",
    icon: Activity,
    description: "Advanced POS configuration",
  },
  {
    id: "held-orders",
    label: "Held Orders",
    href: "/pos/held-orders",
    icon: Clock,
    advanced: true,
    group: "Retail Tools",
    description: "Parked and held carts",
  },
  {
    id: "promotions",
    label: "Promotions",
    href: "/pos/promotions",
    icon: Percent,
    advanced: true,
    group: "Retail Tools",
    description: "Promotions engine",
  },
  {
    id: "designer",
    label: "Receipt Designer",
    href: "/pos/designer",
    icon: Settings,
    advanced: true,
    group: "Customizer",
    description: "Receipt layout designer",
  },
];
