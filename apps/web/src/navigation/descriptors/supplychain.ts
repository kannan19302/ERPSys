import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "supply-chain",
  title: "Supply Chain",
  icon: "Truck",
  routeSegment: "supply-chain",
  dashboardRoute: "/supply-chain",
  settingsRoute: undefined,
  nav: [
    { label: "Dashboard", href: "/supply-chain", icon: "Home" },
    {
      label: "Control Tower",
      href: "/supply-chain/control-tower",
      icon: "Activity",
    },
    {
      label: "Operations Hub",
      href: "/supply-chain/operations",
      icon: "Package",
    },
    {
      label: "Demand Forecast",
      href: "/supply-chain/demand-forecast",
      icon: "TrendingUp",
    },
    {
      label: "Supply Planning",
      href: "/supply-chain/supply-planning",
      icon: "TrendingUp",
    },
    {
      label: "Supplier Risk",
      href: "/supply-chain/supplier-risk",
      icon: "AlertTriangle",
    },
    {
      label: "Global Trade",
      href: "/supply-chain/global-trade",
      icon: "Globe",
    },
    { label: "Logistics", href: "/supply-chain/logistics", icon: "Truck" },
    {
      label: "GPS Tracking",
      href: "/supply-chain/tracking",
      icon: "Navigation",
    },
    { label: "Analytics", href: "/supply-chain/analytics", icon: "BarChart3" },
    {
      label: "Shipments",
      href: "/supply-chain/shipments",
      icon: "Truck",
    },
    { label: "Carriers", href: "/supply-chain/carriers", icon: "Truck" },
    { label: "Containers", href: "/supply-chain/containers", icon: "Package" },
    {
      label: "Customs Declarations",
      href: "/supply-chain/customs",
      icon: "FileText",
    },
    { label: "Shipping Routes", href: "/supply-chain/routes", icon: "MapPin" },
    {
      label: "Lane Rates",
      href: "/supply-chain/lane-rates",
      icon: "DollarSign",
    },
    {
      label: "Logistics Contracts",
      href: "/supply-chain/contracts",
      icon: "FileText",
    },
    {
      label: "Supplier Performance",
      href: "/supply-chain/supplier-performance",
      icon: "Award",
    },
    {
      label: "Supplier Assessments",
      href: "/supply-chain/supplier-assessments",
      icon: "CheckSquare",
    },
    {
      label: "Freight Budgets",
      href: "/supply-chain/budgets",
      icon: "PieChart",
    },
    {
      label: "Module Settings",
      href: "/supply-chain/settings",
      icon: "Settings",
    },
  ],
});
