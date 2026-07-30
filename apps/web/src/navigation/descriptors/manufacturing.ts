// @ts-nocheck
import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "manufacturing",
  title: "Manufacturing",
  icon: "Hammer",
  routeSegment: "manufacturing",
  dashboardRoute: "/manufacturing",
  settingsRoute: "/manufacturing/settings",
  nav: [
    { label: "Work Orders", href: "/manufacturing", icon: "Hammer" },
    {
      label: "Bills of Materials",
      href: "/manufacturing/boms",
      icon: "ClipboardList",
    },
    { label: "MRP Replenishment", href: "/manufacturing/mrp", icon: "Layers" },
    { label: "Shop Floor", href: "/manufacturing/shop-floor", icon: "Cpu" },
    {
      label: "Quality Control",
      href: "/manufacturing/quality",
      icon: "ShieldCheck",
    },
    { label: "Scheduling", href: "/manufacturing/scheduling", icon: "Clock" },
    {
      label: "Product Configurator",
      href: "/manufacturing/configurator",
      icon: "Settings",
    },
    {
      label: "MES Diagnostics",
      href: "/manufacturing/diagnostics",
      icon: "Cpu",
    },
    { label: "Work Centers", href: "/manufacturing/work-centers", icon: "Cpu" },
    { label: "Routing", href: "/manufacturing/routing", icon: "Map" },
    { label: "Scrap Records", href: "/manufacturing/scrap", icon: "Trash2" },
    {
      label: "Quality Checks",
      href: "/manufacturing/quality-checks",
      icon: "ShieldCheck",
    },
    { label: "Settings", href: "/manufacturing/settings", icon: "Settings" },
  ],
});
