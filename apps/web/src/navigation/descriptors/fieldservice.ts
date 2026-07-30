// @ts-nocheck
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
      label: "Mobile Dispatch",
      href: "/field-service/mobile-dispatch",
      icon: "Smartphone",
    },
    {
      label: "Scheduling",
      href: "/field-service/scheduling",
      icon: "Calendar",
    },
    {
      label: "Parts Requests",
      href: "/field-service/parts",
      icon: "Package",
    },
    {
      label: "Van Stock",
      href: "/field-service/van-stock",
      icon: "Truck",
    },
    {
      label: "Reports",
      href: "/field-service/reports",
      icon: "BarChart3",
    },
  ],
});
