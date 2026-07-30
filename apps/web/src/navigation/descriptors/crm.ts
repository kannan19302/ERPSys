// @ts-nocheck
import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "crm",
  title: "CRM & Sales",
  icon: "BarChart3",
  routeSegment: "crm",
  dashboardRoute: "/crm",
  settingsRoute: undefined,
  nav: [
    { label: "Dashboard", href: "/crm", icon: "Home" },
    { label: "Leads", href: "/crm/leads", icon: "TrendingUp" },
    { label: "Opportunities", href: "/crm/opportunities", icon: "BarChart3" },
    { label: "Customers", href: "/crm/customers", icon: "Users" },
    { label: "Contacts", href: "/crm/contacts", icon: "Users" },
    { label: "Sales Pipeline", href: "/crm/quotations", icon: "Package" },
    { label: "Marketing", href: "/crm/marketing-outreach", icon: "Target" },
    { label: "Automation", href: "/crm/automation", icon: "Zap" },
    {
      label: "Customer Success",
      href: "/crm/customer-success",
      icon: "Handshake",
    },
    { label: "Intelligence & AI", href: "/crm/intelligence", icon: "Brain" },
    { label: "Reports & Analytics", href: "/crm/reports", icon: "PieChart" },
    {
      label: "Settings",
      href: "/crm/settings/custom-fields",
      icon: "Settings",
    },
  ],
});
