"use client";
import { GitBranch, PlayCircle, CheckSquare, BarChart3 } from "lucide-react";
import type { ModuleTab } from "@unerp/ui/layout";
export {
  ModuleTabLayout as WorkflowTabLayout,
  type ModuleTab as WorkflowTab,
  type ModuleTabLayoutProps as WorkflowTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui/layout";

export const WORKFLOW_TABS: ModuleTab[] = [
  {
    id: "definitions",
    label: "Definitions",
    href: "/workflow",
    icon: GitBranch,
    description: "Workflow definitions",
  },
  {
    id: "instances",
    label: "Instances",
    href: "/workflow/instances",
    icon: PlayCircle,
    description: "Running workflows",
  },
  {
    id: "tasks",
    label: "My Tasks",
    href: "/workflow/tasks",
    icon: CheckSquare,
    description: "Pending tasks",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/workflow/analytics",
    icon: BarChart3,
    description: "Workflow metrics",
    advanced: true,
    group: "Advanced",
  },
];
