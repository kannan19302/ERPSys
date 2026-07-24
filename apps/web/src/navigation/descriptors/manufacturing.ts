import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "manufacturing",
  title: "Manufacturing",
  icon: "Hammer",
  routeSegment: "manufacturing",
  dashboardRoute: "/manufacturing",
  settingsRoute: undefined,
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
  ],
});
