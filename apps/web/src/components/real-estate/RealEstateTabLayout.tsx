"use client";

import {
  Home,
  Building2,
  FileText,
  Users,
  Wrench,
  BarChart3,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as RealEstateTabLayout,
  type ModuleTab as RealEstateTab,
  type ModuleTabLayoutProps as RealEstateTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const REAL_ESTATE_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/real-estate",
    icon: Home,
    description: "Real estate portfolio overview",
  },
  {
    id: "properties",
    label: "Properties",
    href: "/real-estate/properties",
    icon: Building2,
    description: "Property registry",
  },
  {
    id: "leases",
    label: "Leases",
    href: "/real-estate/leases",
    icon: FileText,
    description: "Lease management",
  },
  {
    id: "tenants",
    label: "Tenants",
    href: "/real-estate/tenants",
    icon: Users,
    description: "Tenant directory",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    href: "/real-estate/maintenance",
    icon: Wrench,
    description: "Maintenance work orders",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/real-estate/reports",
    icon: BarChart3,
    description: "Real estate reports",
  },
];
