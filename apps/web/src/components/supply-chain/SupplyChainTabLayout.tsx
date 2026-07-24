"use client";

import { Home, Package, TrendingUp, BarChart3, Truck } from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as SupplyChainTabLayout,
  type ModuleTab as SupplyChainTab,
  type ModuleTabLayoutProps as SupplyChainTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const SUPPLY_CHAIN_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/supply-chain",
    icon: Home,
    description: "Supply chain overview",
  },
  {
    id: "operations",
    label: "Operations Hub",
    href: "/supply-chain/operations",
    icon: Package,
    description: "Supply chain operations",
  },
  {
    id: "demand-forecast",
    label: "Demand Forecast",
    href: "/supply-chain/demand-forecast",
    icon: TrendingUp,
    description: "Demand forecasting",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/supply-chain/analytics",
    icon: BarChart3,
    description: "Supply chain analytics",
  },
  {
    id: "shipments",
    label: "Shipment Tracking",
    href: "/supply-chain/shipments",
    icon: Truck,
    description: "Shipment tracking and carrier management",
  },
];
