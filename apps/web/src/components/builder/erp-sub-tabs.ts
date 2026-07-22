import {
  Package,
  FileCode2,
  Workflow,
  BarChart3,
  Database,
  Zap,
  Sliders,
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
  { id: "forms", label: "Forms", href: "/builder/erp/forms", icon: FileCode2 },
  {
    id: "workflows",
    label: "Workflows",
    href: "/builder/erp/workflows",
    icon: Workflow,
  },
  {
    id: "dashboards",
    label: "Dashboards",
    href: "/builder/erp/dashboards",
    icon: BarChart3,
  },
  { id: "data", label: "Data", href: "/builder/erp/data", icon: Database },
  { id: "logic", label: "Logic", href: "/builder/erp/logic", icon: Zap },
  {
    id: "customize",
    label: "Customize",
    href: "/builder/erp/customize",
    icon: Sliders,
  },
];
