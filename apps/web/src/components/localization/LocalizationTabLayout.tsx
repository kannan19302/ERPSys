"use client";
import {
  Globe,
  Languages,
  BookOpen,
  GitBranch,
  Cpu,
  MapPin,
  Calendar,
  FileText,
} from "lucide-react";
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
  {
    id: "glossary",
    label: "Glossary",
    href: "/localization/glossary",
    icon: BookOpen,
    description: "Translation glossary",
  },
  {
    id: "context",
    label: "Context",
    href: "/localization/context",
    icon: GitBranch,
    description: "Translation context",
  },
  {
    id: "machine-translation",
    label: "Machine Translation",
    href: "/localization/machine-translation",
    icon: Cpu,
    description: "Machine translation",
  },
  {
    id: "regions",
    label: "Regions",
    href: "/localization/regions",
    icon: MapPin,
    description: "Regional settings",
  },
  {
    id: "content-schedule",
    label: "Content Schedule",
    href: "/localization/content-schedule",
    icon: Calendar,
    description: "Content scheduling",
    advanced: true,
    group: "Advanced",
  },
  {
    id: "fallback",
    label: "Fallback",
    href: "/localization/fallback",
    icon: FileText,
    description: "Fallback rules",
    advanced: true,
    group: "Advanced",
  },
];
