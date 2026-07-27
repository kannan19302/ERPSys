"use client";
import { PackageOpen, TrendingDown, Trash2, BarChart3 } from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";
export {
  ModuleTabLayout as FixedAssetsTabLayout,
  type ModuleTab as FixedAssetsTab,
  type ModuleTabLayoutProps as FixedAssetsTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const FIXED_ASSETS_TABS: ModuleTab[] = [
  {
    id: "registry",
    label: "Asset Registry",
    href: "/fixed-assets",
    icon: PackageOpen,
    description: "Fixed asset registry",
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
    id: "reports",
    label: "Reports",
    href: "/fixed-assets/reports",
    icon: BarChart3,
    description: "Asset reports",
    advanced: true,
    group: "Advanced",
  },
];
