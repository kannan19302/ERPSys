"use client";

/**
 * Thin re-export wrapper around @unerp/ui-layout's ModuleTabLayout, following
 * the Finance/CRM convention (see FinanceTabLayout.tsx). Renders the three
 * Studio pillars (App Studio / Web Studio / Manage) as Level-1 module tabs on
 * the Studio home page. Each pillar's own pages then nest Level-2 SubTabBar
 * navigation — see erp-sub-tabs.ts, web-sub-tabs.ts, manage-sub-tabs.ts.
 */

import { Wrench, Cpu, Globe, Server } from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as BuilderTabLayout,
  type ModuleTab as BuilderTab,
  type ModuleTabLayoutProps as BuilderTabLayoutProps,
} from "@unerp/ui-layout";

export const BUILDER_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Studio Home",
    href: "/builder",
    icon: Wrench,
    description: "Studio overview, quick create, and recent activity",
  },
  {
    id: "erp",
    label: "App Studio",
    href: "/builder/erp",
    icon: Cpu,
    description:
      "Custom ERP apps, forms, workflows, dashboards, data and logic",
  },
  {
    id: "web",
    label: "Web Studio",
    href: "/builder/web",
    icon: Globe,
    description: "Sites, pages, collections, blog, assets and commerce CMS",
  },
  {
    id: "manage",
    label: "Manage",
    href: "/builder/manage",
    icon: Server,
    description:
      "Releases, environments, run logs, access control and governance",
  },
];
