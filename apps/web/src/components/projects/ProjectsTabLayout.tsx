"use client";

import {
  Briefcase,
  Target,
  Home,
  Clock,
  Activity,
  DollarSign,
  BarChart3,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as ProjectsTabLayout,
  type ModuleTab as ProjectTab,
  type ModuleTabLayoutProps as ProjectsTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const PROJECTS_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Gantt & Tasks",
    href: "/projects",
    icon: Briefcase,
    description: "Project Gantt charts and task management",
  },
  {
    id: "portfolios",
    label: "Portfolio Hub",
    href: "/projects/portfolios",
    icon: Target,
    description: "Project portfolio overview",
  },
  {
    id: "client-portal",
    label: "Client Portal",
    href: "/projects/client-portal",
    icon: Home,
    description: "Client-facing project portal",
  },
  {
    id: "workloads",
    label: "Resource Workloads",
    href: "/projects/workloads",
    icon: Clock,
    description: "Resource allocation and workloads",
  },
  {
    id: "health",
    label: "Project Health",
    href: "/projects/health",
    icon: Activity,
    description: "CPM and project health metrics",
  },
  {
    id: "revenue",
    label: "Revenue Recognition",
    href: "/projects/revenue-recognition",
    icon: DollarSign,
    description: "Revenue recognition and WIP",
  },
  {
    id: "timesheets",
    label: "Timesheets",
    href: "/projects/timesheets",
    icon: Clock,
    description: "Timesheet entry and approval",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/projects/reports",
    icon: BarChart3,
    advanced: true,
    group: "Analytics",
    description: "Project reports and dashboards",
  },
];
