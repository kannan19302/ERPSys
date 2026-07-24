"use client";

import {
  Hammer,
  ClipboardList,
  Layers,
  Cpu,
  ShieldCheck,
  Clock,
  Settings,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as ManufacturingTabLayout,
  type ModuleTab as ManufacturingTab,
  type ModuleTabLayoutProps as ManufacturingTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const MANUFACTURING_TABS: ModuleTab[] = [
  {
    id: "work-orders",
    label: "Work Orders",
    href: "/manufacturing",
    icon: Hammer,
    description: "Production work orders",
  },
  {
    id: "boms",
    label: "Bills of Materials",
    href: "/manufacturing/boms",
    icon: ClipboardList,
    description: "BOM definitions",
  },
  {
    id: "mrp",
    label: "MRP Replenishment",
    href: "/manufacturing/mrp",
    icon: Layers,
    description: "Material requirements planning",
  },
  {
    id: "shop-floor",
    label: "Shop Floor",
    href: "/manufacturing/shop-floor",
    icon: Cpu,
    description: "Operator shop floor view",
  },
  {
    id: "quality",
    label: "Quality Control",
    href: "/manufacturing/quality",
    icon: ShieldCheck,
    description: "Quality control and NCR",
  },
  {
    id: "scheduling",
    label: "Scheduling",
    href: "/manufacturing/scheduling",
    icon: Clock,
    description: "Finite capacity scheduling",
  },
  {
    id: "configurator",
    label: "Product Configurator",
    href: "/manufacturing/configurator",
    icon: Settings,
    description: "Product configuration",
  },
  {
    id: "mes",
    label: "MES Diagnostics",
    href: "/manufacturing/diagnostics",
    icon: Cpu,
    advanced: true,
    group: "Execution & MES",
    description: "Manufacturing execution system diagnostics",
  },
];
