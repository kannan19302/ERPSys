// @ts-nocheck
"use client";

import {
  Home,
  Users,
  MessageSquare,
  Video,
  Calendar,
  Bell,
  BookOpen,
  HeadphonesIcon,
  Radio,
  Phone,
  Search,
  FileText,
  ClipboardList,
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
  {
    id: "knowledge",
    label: "Knowledge Base",
    href: "/communication/knowledge",
    icon: BookOpen,
    description: "Wiki and knowledge base",
  },
  {
    id: "helpdesk",
    label: "Help Desk",
    href: "/communication/helpdesk",
    icon: HeadphonesIcon,
    description: "Contact center and ticketing",
  },
  {
    id: "omnichannel",
    label: "Omnichannel",
    href: "/communication/omnichannel",
    icon: Radio,
    description: "Unified inbox across channels",
  },
  {
    id: "video",
    label: "Video Deep",
    href: "/communication/video",
    icon: Video,
    description: "Advanced video conferencing",
  },
  {
    id: "voip",
    label: "VoIP & Telephony",
    href: "/communication/voip",
    icon: Phone,
    description: "Voice calls and telephony",
  },
  {
    id: "enterprise-search",
    label: "Enterprise Search",
    href: "/communication/enterprise-search",
    icon: Search,
    description: "Full-text search across communication",
  },
  {
    id: "real-time-collab",
    label: "Real-Time Collab",
    href: "/communication/real-time-collab",
    icon: FileText,
    description: "Collaborative documents and whiteboards",
  },
  {
    id: "survey",
    label: "Surveys",
    href: "/communication/survey",
    icon: ClipboardList,
    description: "Surveys and feedback collection",
  },
];
