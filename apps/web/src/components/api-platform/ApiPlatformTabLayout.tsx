"use client";
import { KeyRound, Webhook, BarChart3 } from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";
export {
  ModuleTabLayout as ApiPlatformTabLayout,
  type ModuleTab as ApiPlatformTab,
  type ModuleTabLayoutProps as ApiPlatformTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const API_PLATFORM_TABS: ModuleTab[] = [
  {
    id: "keys",
    label: "API Keys",
    href: "/api-platform",
    icon: KeyRound,
    description: "Manage API keys",
  },
  {
    id: "webhooks",
    label: "Webhooks",
    href: "/api-platform/webhooks",
    icon: Webhook,
    description: "Webhook subscriptions",
  },
  {
    id: "usage",
    label: "Usage",
    href: "/api-platform/usage",
    icon: BarChart3,
    description: "API usage metrics",
  },
];
