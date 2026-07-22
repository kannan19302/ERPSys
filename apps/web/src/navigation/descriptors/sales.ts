import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "sales",
  title: "Sales & Orders",
  icon: "ClipboardList",
  routeSegment: "sales",
  dashboardRoute: "/sales",
  settingsRoute: undefined,
  nav: [
    { label: "Sales Dashboard", href: "/sales", icon: "Home" },
    {
      label: "Customer Quotations",
      href: "/sales/quotations",
      icon: "FileText",
    },
    { label: "Sales Orders", href: "/sales/orders", icon: "ClipboardList" },
    { label: "CPQ Pricing", href: "/sales/cpq", icon: "Calculator" },
    { label: "Fulfillment & SLAs", href: "/sales/fulfillment", icon: "Truck" },
    { label: "Delivery Notes", href: "/sales/delivery-notes", icon: "Truck" },
    { label: "Customer Returns", href: "/sales/returns", icon: "History" },
    {
      label: "Sales Contracts",
      href: "/sales/contracts",
      icon: "FileSignature",
    },
    {
      label: "Promotions & Coupons",
      href: "/sales/promotions",
      icon: "Percent",
    },
    { label: "Sales Partners", href: "/sales/partners", icon: "Handshake" },
    {
      label: "Commissions",
      href: "/sales/commissions",
      icon: "BadgeDollarSign",
    },
    { label: "Sales Analytics", href: "/sales/analytics", icon: "BarChart3" },
    { label: "Forecasting", href: "/sales/forecasting", icon: "TrendingUp" },
  ],
});
