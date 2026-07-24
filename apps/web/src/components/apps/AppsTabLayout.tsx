"use client";

import { ShoppingBag, Store, Heart, Code2, Sparkles } from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as AppsTabLayout,
  type ModuleTab as AppsTab,
  type ModuleTabLayoutProps as AppsTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const APPS_TABS: ModuleTab[] = [
  {
    id: "store",
    label: "App Store",
    href: "/apps/store",
    icon: Store,
    description: "Browse and install marketplace apps",
  },
  {
    id: "collections",
    label: "Collections",
    href: "/apps/store/collections",
    icon: Sparkles,
    description: "Curated app bundles",
  },
  {
    id: "favorites",
    label: "Favorites",
    href: "/apps/store/favorites",
    icon: Heart,
    description: "Your saved apps",
  },
  {
    id: "developer",
    label: "Developer Portal",
    href: "/apps/developer",
    icon: Code2,
    description: "Publish your own apps",
  },
];
