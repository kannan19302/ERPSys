"use client";

import { Settings, Layers, Package } from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as EcommerceTabLayout,
  type ModuleTab as EcommerceTab,
  type ModuleTabLayoutProps as EcommerceTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const ECOMMERCE_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Storefront Settings",
    href: "/ecommerce",
    icon: Settings,
    description: "E-commerce store configuration",
  },
  {
    id: "categories",
    label: "Categories",
    href: "/ecommerce/categories",
    icon: Layers,
    description: "Product category management",
  },
  {
    id: "listings",
    label: "Product Listings",
    href: "/ecommerce/listings",
    icon: Package,
    description: "Product listing management",
  },
];
