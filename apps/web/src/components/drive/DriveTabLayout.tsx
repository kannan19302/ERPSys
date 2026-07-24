"use client";

import {
  FolderOpen,
  Users,
  Clock,
  Star,
  Trash2,
  FileText,
  Settings,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as DriveTabLayout,
  type ModuleTab as DriveTab,
  type ModuleTabLayoutProps as DriveTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const DRIVE_TABS: ModuleTab[] = [
  {
    id: "my-drive",
    label: "My Drive",
    href: "/drive",
    icon: FolderOpen,
    description: "Personal file storage",
  },
  {
    id: "shared",
    label: "Shared with me",
    href: "/drive?view=shared",
    icon: Users,
    description: "Files shared with you",
  },
  {
    id: "recent",
    label: "Recent",
    href: "/drive?view=recent",
    icon: Clock,
    description: "Recently accessed files",
  },
  {
    id: "starred",
    label: "Starred",
    href: "/drive?view=starred",
    icon: Star,
    description: "Starred/favorited files",
  },
  {
    id: "trash",
    label: "Trash",
    href: "/drive?view=trash",
    icon: Trash2,
    description: "Deleted files",
  },
  {
    id: "templates",
    label: "Generated Documents",
    href: "/drive/templates",
    icon: FileText,
    description: "Generated document templates",
  },
  {
    id: "designer",
    label: "Template Designer",
    href: "/drive/designer",
    icon: Settings,
    description: "Document template designer",
  },
  {
    id: "advanced",
    label: "E-Signatures & OCR",
    href: "/drive/advanced",
    icon: FileText,
    advanced: true,
    group: "Advanced",
    description: "E-signatures, OCR, and advanced tools",
  },
];
