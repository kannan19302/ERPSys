import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "inventory",
  title: "Inventory & Stock",
  icon: "Package",
  routeSegment: "inventory",
  dashboardRoute: "/inventory",
  settingsRoute: undefined,
  nav: [
    { label: "Dashboard", href: "/inventory", icon: "Home" },
    { label: "Products Catalog", href: "/inventory/products", icon: "Package" },
    { label: "Stock Levels", href: "/inventory/stock-levels", icon: "Layers" },
    { label: "Warehouses", href: "/inventory/warehouses", icon: "Warehouse" },
    {
      label: "Material Transactions",
      href: "/inventory/stock-entries",
      icon: "FileText",
    },
    {
      label: "Quality & Traceability",
      href: "/inventory/qa-inspections",
      icon: "ShieldCheck",
    },
    {
      label: "Counting & Storage",
      href: "/inventory/cycle-counts",
      icon: "ClipboardList",
    },
    {
      label: "Warehouse Operations",
      href: "/inventory/warehouse-ops",
      icon: "Truck",
    },
    {
      label: "Transfers & Logistics",
      href: "/inventory/transfer-orders",
      icon: "ArrowLeftRight",
    },
    {
      label: "Analytics & Planning",
      href: "/inventory/inventory-analytics",
      icon: "BarChart3",
    },
    {
      label: "Returns & Movement",
      href: "/inventory/customer-returns",
      icon: "RotateCcw",
    },
    { label: "Settings", href: "/inventory/settings", icon: "Settings" },
  ],
});
