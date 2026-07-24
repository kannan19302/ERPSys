import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "field-service",
  title: "Field Service",
  icon: "Wrench",
  routeSegment: "field-service",
  dashboardRoute: "/field-service",
  settingsRoute: undefined,
  nav: [
    { label: "Dashboard", href: "/field-service", icon: "Home" },
    {
      label: "Service Tickets",
      href: "/field-service/tickets",
      icon: "ClipboardList",
    },
    {
      label: "Dispatch Board",
      href: "/field-service/dispatch",
      icon: "MapPin",
    },
    {
      label: "Checklists",
      href: "/field-service/checklists",
      icon: "ClipboardCheck",
    },
    {
      label: "Preventive Maintenance",
      href: "/field-service/preventive",
      icon: "Wrench",
    },
    { label: "Technicians", href: "/field-service/technicians", icon: "Users" },
    {
      label: "Customer Directory",
      href: "/field-service/customers",
      icon: "Users",
    },
    { label: "Reports", href: "/field-service/reports", icon: "BarChart3" },
  ],
});
