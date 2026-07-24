import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "ai",
  title: "AI Copilot",
  icon: "Zap",
  routeSegment: "ai",
  dashboardRoute: "/ai",
  settingsRoute: "/ai/settings",
  nav: [
    { label: "AI Copilot", href: "/ai", icon: "Zap" },
    {
      label: "Ask Data (NL Query)",
      href: "/ai?tab=ask-data",
      icon: "MessageSquare",
    },
    {
      label: "Invoice Scanner",
      href: "/ai?tab=invoice-scanner",
      icon: "FileText",
    },
    { label: "Email Drafter", href: "/ai?tab=email-drafter", icon: "Mail" },
    {
      label: "Form Generator",
      href: "/ai?tab=form-generator",
      icon: "LayoutGrid",
    },
    {
      label: "Workflow Generator",
      href: "/ai?tab=workflow-generator",
      icon: "GitBranch",
    },
    { label: "Settings", href: "/ai/settings", icon: "Settings" },
  ],
});
