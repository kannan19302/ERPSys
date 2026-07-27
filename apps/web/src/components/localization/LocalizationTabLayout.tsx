"use client";
import { Globe, Languages, FileText } from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";
export {
  ModuleTabLayout as LocalizationTabLayout,
  type ModuleTab as LocalizationTab,
  type ModuleTabLayoutProps as LocalizationTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const LOCALIZATION_TABS: ModuleTab[] = [
  {
    id: "locales",
    label: "Locales",
    href: "/localization",
    icon: Globe,
    description: "Manage locales",
  },
  {
    id: "translations",
    label: "Translations",
    href: "/localization/translations",
    icon: Languages,
    description: "Translation editor",
  },
];
