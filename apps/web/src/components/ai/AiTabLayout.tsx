"use client";

import {
  Zap,
  MessageSquare,
  FileText,
  Mail,
  LayoutGrid,
  GitBranch,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as AiTabLayout,
  type ModuleTab as AiTab,
  type ModuleTabLayoutProps as AiTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const AI_TABS: ModuleTab[] = [
  {
    id: "copilot",
    label: "AI Copilot",
    href: "/ai",
    icon: Zap,
    description: "AI assistant and copilot",
  },
  {
    id: "ask-data",
    label: "Ask Data",
    href: "/ai?tab=ask-data",
    icon: MessageSquare,
    description: "Natural language data queries",
  },
  {
    id: "invoice-scanner",
    label: "Invoice Scanner",
    href: "/ai?tab=invoice-scanner",
    icon: FileText,
    description: "AI-powered invoice scanning",
  },
  {
    id: "email-drafter",
    label: "Email Drafter",
    href: "/ai?tab=email-drafter",
    icon: Mail,
    description: "AI email drafting",
  },
  {
    id: "form-generator",
    label: "Form Generator",
    href: "/ai?tab=form-generator",
    icon: LayoutGrid,
    description: "AI form generation",
  },
  {
    id: "workflow-generator",
    label: "Workflow Generator",
    href: "/ai?tab=workflow-generator",
    icon: GitBranch,
    description: "AI workflow generation",
  },
];
