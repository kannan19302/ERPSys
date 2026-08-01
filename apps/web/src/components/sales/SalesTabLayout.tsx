"use client";

import {
  Home,
  FileText,
  ClipboardList,
  Calculator,
  Truck,
  History,
  FileSignature,
  Percent,
  Handshake,
  BadgeDollarSign,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as SalesTabLayout,
  type ModuleTab as SalesTab,
  type ModuleTabLayoutProps as SalesTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const SALES_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/sales",
    icon: Home,
    description: "Sales overview",
  },
  {
    id: "quotations",
    label: "Quotations",
    href: "/sales/quotations",
    icon: FileText,
    description: "Customer quotations",
  },
  {
    id: "orders",
    label: "Sales Orders",
    href: "/sales/orders",
    icon: ClipboardList,
    description: "Sales order management",
  },
  {
    id: "cpq",
    label: "CPQ Pricing",
    href: "/sales/cpq",
    icon: Calculator,
    description: "Configure-price-quote",
  },
  {
    id: "delivery-notes",
    label: "Delivery Notes",
    href: "/sales/delivery-notes",
    icon: Truck,
    description: "Delivery note management",
  },
  {
    id: "returns",
    label: "Returns",
    href: "/sales/returns",
    icon: History,
    description: "Customer returns and credit notes",
  },
  {
    id: "contracts",
    label: "Contracts",
    href: "/sales/contracts",
    icon: FileSignature,
    description: "Sales contracts",
  },
  {
    id: "promotions",
    label: "Promotions",
    href: "/sales/promotions",
    icon: Percent,
    description: "Promotions and coupons",
  },
  {
    id: "partners",
    label: "Partners",
    href: "/sales/partners",
    icon: Handshake,
    description: "Sales partners",
  },
  {
    id: "commissions",
    label: "Commissions",
    href: "/sales/commissions",
    icon: BadgeDollarSign,
    description: "Commission tracking",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/sales/analytics",
    icon: BarChart3,
    description: "Sales analytics",
  },
  {
    id: "forecasting",
    label: "Forecasting",
    href: "/sales/forecasting",
    icon: TrendingUp,
    description: "Sales forecasting",
  },
];
