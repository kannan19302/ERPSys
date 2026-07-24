"use client";

import {
  Home,
  Users,
  MessageSquare,
  Video,
  Calendar,
  Bell,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as CommunicationTabLayout,
  type ModuleTab as CommunicationTab,
  type ModuleTabLayoutProps as CommunicationTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const COMMUNICATION_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/communication",
    icon: Home,
    description: "Communication overview",
  },
  {
    id: "spaces",
    label: "Spaces & Channels",
    href: "/communication/spaces",
    icon: Users,
    description: "Team spaces and channels",
  },
  {
    id: "dm",
    label: "Direct Messages",
    href: "/communication/dm",
    icon: MessageSquare,
    description: "Direct messaging",
  },
  {
    id: "meetings",
    label: "Meetings",
    href: "/communication/meetings",
    icon: Video,
    description: "Video meetings and scheduling",
  },
  {
    id: "calendar",
    label: "Calendar",
    href: "/communication/calendar",
    icon: Calendar,
    description: "Shared calendar",
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/communication/notifications",
    icon: Bell,
    description: "Notification preferences",
  },
];
