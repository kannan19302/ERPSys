// @ts-nocheck
"use client";

import {
  ShoppingBag,
  Store,
  Heart,
  Code2,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import React, { type FC } from "react";
import {
  ModuleTabLayout,
  type ModuleTab,
  type ModuleTabLayoutProps,
} from "@unerp/ui-layout";

export {
  type ModuleTab as AppsTab,
  type ModuleTabLayoutProps as AppsTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const AppsTabLayout: FC<ModuleTabLayoutProps> = (props) => {
  return <ModuleTabLayout variant="card" {...props} />;
};

export const APPS_TABS: ModuleTab[] = [
  {
    id: "desk",
    label: "Desk",
    href: "/apps",
    icon: LayoutGrid,
    description: "Your installed workspace apps and modules",
  },
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
