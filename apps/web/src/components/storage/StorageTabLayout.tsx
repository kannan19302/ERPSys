"use client";
import { FolderOpen, Share2, HardDrive, FileText } from "lucide-react";
import type { ModuleTab } from "@unerp/ui/layout";
export {
  ModuleTabLayout as StorageTabLayout,
  type ModuleTab as StorageTab,
  type ModuleTabLayoutProps as StorageTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui/layout";

export const STORAGE_TABS: ModuleTab[] = [
  {
    id: "files",
    label: "File Browser",
    href: "/storage",
    icon: FolderOpen,
    description: "Browse and manage files",
  },
  {
    id: "shared",
    label: "Shared Files",
    href: "/storage/shared",
    icon: Share2,
    description: "Files shared via links",
  },
  {
    id: "quota",
    label: "Storage Quota",
    href: "/storage/quota",
    icon: HardDrive,
    description: "Usage and limits",
  },
];
