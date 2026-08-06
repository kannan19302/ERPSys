"use client";
import {
  PackageOpen,
  TrendingDown,
  Trash2,
  BarChart3,
  Wrench,
  Shield,
  Folders,
  GanttChartSquare,
  ClipboardCheck,
  Repeat,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui/layout";
export {
  ModuleTabLayout as FixedAssetsTabLayout,
  type ModuleTab as FixedAssetsTab,
  type ModuleTabLayoutProps as FixedAssetsTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui/layout";

export const FIXED_ASSETS_TABS: ModuleTab[] = [
  {
    id: "registry",
    label: "Asset Registry",
    href: "/fixed-assets",
    icon: PackageOpen,
    description: "Fixed asset registry",
  },
  {
    id: "categories",
    label: "Categories",
    href: "/fixed-assets/categories",
    icon: Folders,
    description: "Asset categories",
  },
  {
    id: "depreciation",
    label: "Depreciation",
    href: "/fixed-assets/depreciation",
    icon: TrendingDown,
    description: "Depreciation schedule",
  },
  {
    id: "disposals",
    label: "Disposals",
    href: "/fixed-assets/disposals",
    icon: Trash2,
    description: "Asset disposals",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    href: "/fixed-assets/maintenance",
    icon: Wrench,
    description: "Asset maintenance",
  },
  {
    id: "insurance",
    label: "Insurance",
    href: "/fixed-assets/insurance",
    icon: Shield,
    description: "Asset insurance",
  },
  {
    id: "groups",
    label: "Groups",
    href: "/fixed-assets/groups",
    icon: GanttChartSquare,
    description: "Asset groups",
  },
  {
    id: "audits",
    label: "Audits",
    href: "/fixed-assets/audits",
    icon: ClipboardCheck,
    description: "Physical audits",
  },
  {
    id: "transfers",
    label: "Transfers",
    href: "/fixed-assets/transfers",
    icon: Repeat,
    description: "Asset transfers",
    advanced: true,
    group: "Operations",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/fixed-assets/reports",
    icon: BarChart3,
    description: "Asset reports",
    advanced: true,
    group: "Advanced",
  },
];
