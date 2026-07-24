import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "real-estate",
  title: "Real Estate",
  icon: "Building2",
  routeSegment: "real-estate",
  dashboardRoute: "/real-estate",
  settingsRoute: "/real-estate/settings",
  nav: [
    { label: "Dashboard", href: "/real-estate", icon: "Home" },
    { label: "Properties", href: "/real-estate/properties", icon: "Building2" },
    { label: "Leases", href: "/real-estate/leases", icon: "FileText" },
    { label: "Tenants", href: "/real-estate/tenants", icon: "Users" },
    { label: "Maintenance", href: "/real-estate/maintenance", icon: "Wrench" },
    {
      label: "Agent Commissions",
      href: "/real-estate/commissions",
      icon: "DollarSign",
    },
    { label: "Reports", href: "/real-estate/reports", icon: "BarChart3" },
    { label: "Settings", href: "/real-estate/settings", icon: "Settings" },
  ],
});
