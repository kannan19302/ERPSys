import {
  LayoutDashboard,
  History,
  GitFork,
  Activity,
  Shield,
  Cpu,
  Link as LinkIcon,
  Store,
  Database,
  Settings,
  GitBranch,
  Smartphone,
} from "lucide-react";
import type { SubTab } from "@unerp/ui-layout";

/**
 * Level-2 SubTabBar entries for the Manage & Governance hub
 * (`/builder/manage/*`). Rendered from `builder/manage/layout.tsx`.
 */
export const MANAGE_SUB_TABS: SubTab[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/builder/manage",
    icon: LayoutDashboard,
  },
  {
    id: "releases",
    label: "Releases",
    href: "/builder/manage/releases",
    icon: History,
  },
  {
    id: "environments",
    label: "Environments",
    href: "/builder/manage/environments",
    icon: GitFork,
  },
  {
    id: "logs",
    label: "Run Logs",
    href: "/builder/manage/logs",
    icon: Activity,
  },
  {
    id: "access",
    label: "Access Control",
    href: "/builder/manage/access",
    icon: Shield,
  },
  {
    id: "components",
    label: "Components",
    href: "/builder/manage/components",
    icon: Cpu,
  },
  {
    id: "connectors",
    label: "Connectors",
    href: "/builder/manage/connectors",
    icon: LinkIcon,
  },
  {
    id: "marketplace",
    label: "Marketplace",
    href: "/builder/manage/marketplace",
    icon: Store,
  },
  {
    id: "query-builder",
    label: "Query Builder",
    href: "/builder/manage/query-builder",
    icon: Database,
  },
  {
    id: "widgets",
    label: "Widgets",
    href: "/builder/manage/widgets",
    icon: Settings,
  },
  {
    id: "git",
    label: "Git Control",
    href: "/builder/manage/git",
    icon: GitBranch,
  },
  {
    id: "mobile-export",
    label: "Mobile & Export",
    href: "/builder/manage/mobile-export",
    icon: Smartphone,
  },
];
