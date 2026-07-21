import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "finance",
  title: "Finance & Accounting",
  icon: "CreditCard",
  routeSegment: "finance",
  dashboardRoute: "/finance",
  settingsRoute: "/finance/settings",
  nav: [
    { label: "Dashboard", href: "/finance", icon: "Home" },
    { label: "General Ledger", href: "/finance/gl", icon: "BookOpen" },
    { label: "Accounts Receivable", href: "/finance/ar", icon: "FileText" },
    { label: "Accounts Payable", href: "/finance/ap", icon: "Building2" },
    { label: "Banking", href: "/finance/banking", icon: "Wallet" },
    { label: "Assets", href: "/finance/assets", icon: "Building2" },
    { label: "Tax", href: "/finance/tax", icon: "Calculator" },
    {
      label: "Budget & Planning",
      href: "/finance/budget-planning",
      icon: "PieChart",
    },
    { label: "Reports", href: "/finance/reports", icon: "BarChart3" },
    { label: "Settings", href: "/finance/settings", icon: "Settings" },
  ],
});
