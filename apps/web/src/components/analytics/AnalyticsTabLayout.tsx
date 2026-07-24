"use client";

import {
  PieChart,
  LayoutDashboard,
  ShieldAlert,
  GitFork,
  Layers,
  TrendingUp,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as AnalyticsTabLayout,
  type ModuleTab as AnalyticsTab,
  type ModuleTabLayoutProps as AnalyticsTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const ANALYTICS_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/analytics",
    icon: PieChart,
    description: "BI analytics dashboard",
  },
  {
    id: "builder",
    label: "Dashboard Builder",
    href: "/analytics/builder",
    icon: LayoutDashboard,
    description: "Custom dashboard builder",
  },
  {
    id: "insights",
    label: "Smart Insights",
    href: "/analytics/insights",
    icon: ShieldAlert,
    description: "AI-powered insights",
  },
  {
    id: "query",
    label: "Visual Query Builder",
    href: "/analytics/query",
    icon: GitFork,
    description: "Visual query building",
  },
  {
    id: "pivot",
    label: "Pivot Matrix",
    href: "/analytics/pivot",
    icon: Layers,
    description: "Pivot table aggregator",
  },
  {
    id: "predictive",
    label: "Predictive Analytics",
    href: "/analytics/predictive",
    icon: TrendingUp,
    description: "Predictive analytics",
  },
];
