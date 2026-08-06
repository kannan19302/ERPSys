"use client";
import {
  BarChart3,
  FileText,
  Clock,
  Download,
  Activity,
  ShieldCheck,
  Bookmark,
  AlertTriangle,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui/layout";
export {
  ModuleTabLayout as ReportingTabLayout,
  type ModuleTab as ReportingTab,
  type ModuleTabLayoutProps as ReportingTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui/layout";

export const REPORTING_TABS: ModuleTab[] = [
  {
    id: "reports",
    label: "Reports",
    href: "/reporting",
    icon: BarChart3,
    description: "Report list",
  },
  {
    id: "templates",
    label: "Templates",
    href: "/reporting/templates",
    icon: FileText,
    description: "Report templates",
  },
  {
    id: "jobs",
    label: "Scheduled Jobs",
    href: "/reporting/jobs",
    icon: Clock,
    description: "Scheduled report jobs",
  },
  {
    id: "exports",
    label: "Exports",
    href: "/reporting/exports",
    icon: Download,
    description: "Export reports",
  },
  {
    id: "viewer",
    label: "Viewer",
    href: "/reporting/viewer",
    icon: Activity,
    description: "Interactive viewer",
  },
  {
    id: "drilldown",
    label: "Drilldown",
    href: "/reporting/drilldown",
    icon: Activity,
    description: "Data drilldown",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "compliance",
    label: "Compliance",
    href: "/reporting/compliance",
    icon: ShieldCheck,
    description: "Compliance sign-off",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "bookmarks",
    label: "Bookmarks",
    href: "/reporting/bookmarks",
    icon: Bookmark,
    description: "Report bookmarks",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "alerts",
    label: "Alerts",
    href: "/reporting/alerts",
    icon: AlertTriangle,
    description: "Alert rules",
    advanced: true,
    group: "Advanced",
  },
];
