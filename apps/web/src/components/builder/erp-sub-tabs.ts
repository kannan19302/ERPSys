// @ts-nocheck
import {
  Package,
  LayoutGrid,
  FileCode2,
  Workflow,
  BarChart3,
  Database,
  Zap,
  Sliders,
  Layers,
  GitBranch,
  Code2,
  Table2,
  Smartphone,
} from "lucide-react";
import type { SubTab } from "@unerp/ui-layout";

/**
 * Level-2 SubTabBar entries for the App Studio hub (`/builder/erp/*`).
 * Rendered from `builder/erp/layout.tsx` so every real route under the hub
 * (including [id] detail pages) is reachable without falling back to the
 * sidebar. `apps/[id]` intentionally has no direct tab of its own — it is
 * reached by clicking a card on the "Apps" (hub root) tab, and the longest
 * matching path in SubTabBar still highlights "Apps" while viewing it.
 */
export const ERP_SUB_TABS: SubTab[] = [
  { id: "apps", label: "Apps", href: "/builder/erp", icon: Package },
  {
    id: "modules",
    label: "Custom Apps",
    href: "/builder/erp/modules",
    icon: LayoutGrid,
  },
  { id: "forms", label: "Forms", href: "/builder/erp/forms", icon: FileCode2 },
  {
    id: "advanced-forms",
    label: "Advanced Forms",
    href: "/builder/erp/advanced-forms",
    icon: Layers,
  },
  {
    id: "workflows",
    label: "Workflows",
    href: "/builder/erp/workflows",
    icon: Workflow,
  },
  {
    id: "bpmn",
    label: "BPMN",
    href: "/builder/erp/bpmn",
    icon: GitBranch,
  },
  {
    id: "dashboards",
    label: "Dashboards",
    href: "/builder/erp/dashboards",
    icon: BarChart3,
  },
  {
    id: "api-builder",
    label: "API Builder",
    href: "/builder/erp/api-builder",
    icon: Code2,
  },
  {
    id: "rules-engine",
    label: "Rules Engine",
    href: "/builder/erp/rules-engine",
    icon: Table2,
  },
  { id: "data", label: "Data", href: "/builder/erp/data", icon: Database },
  { id: "logic", label: "Logic", href: "/builder/erp/logic", icon: Zap },
  {
    id: "customize",
    label: "Customize",
    href: "/builder/erp/customize",
    icon: Sliders,
  },
  {
    id: "mobile-builder",
    label: "Mobile Apps",
    href: "/builder/erp/mobile-builder",
    icon: Smartphone,
  },
];
