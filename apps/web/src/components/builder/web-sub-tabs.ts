import {
  LayoutDashboard,
  Globe,
  Monitor,
  Database,
  FileText,
  Image,
  Code2,
  Layers,
  SearchCheck,
  ShoppingCart,
  Inbox,
  Settings,
} from "lucide-react";
import type { SubTab } from "@unerp/ui-layout";

/**
 * Level-2 SubTabBar entries for the Web Studio hub (`/builder/web/*`).
 * Rendered from `builder/web/layout.tsx`.
 *
 * `web/canvas` is deliberately excluded — it is not a user-facing
 * destination, it's the iframe target embedded by the Pages visual editor
 * (see web/pages/page.tsx `src="/builder/web/canvas?pageId=..."`). Adding it
 * as a nav tab would let users navigate to a bare, chrome-less canvas render.
 */
export const WEB_SUB_TABS: SubTab[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/builder/web",
    icon: LayoutDashboard,
  },
  { id: "sites", label: "Sites", href: "/builder/web/sites", icon: Globe },
  { id: "pages", label: "Pages", href: "/builder/web/pages", icon: Monitor },
  {
    id: "collections",
    label: "Collections",
    href: "/builder/web/collections",
    icon: Database,
  },
  { id: "blog", label: "Blog", href: "/builder/web/blog", icon: FileText },
  { id: "assets", label: "Assets", href: "/builder/web/assets", icon: Image },
  {
    id: "templates",
    label: "Templates",
    href: "/builder/web/templates",
    icon: Code2,
  },
  { id: "menus", label: "Menus", href: "/builder/web/menus", icon: Layers },
  { id: "seo", label: "SEO", href: "/builder/web/seo", icon: SearchCheck },
  {
    id: "orders",
    label: "Orders",
    href: "/builder/web/orders",
    icon: ShoppingCart,
  },
  {
    id: "submissions",
    label: "Submissions",
    href: "/builder/web/submissions",
    icon: Inbox,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/builder/web/settings",
    icon: Settings,
  },
];
