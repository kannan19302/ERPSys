"use client";

import {
  BarChart3,
  BookOpen,
  DollarSign,
  Users,
  Package,
  Factory,
  Truck,
  Briefcase,
  Folder,
  ShoppingBag,
  GraduationCap,
  Stethoscope,
  Wrench,
  Building2,
  Store,
  LineChart,
  Sparkles,
  Grid,
  MessageSquare,
  Settings,
  Cloud,
  TrendingUp,
} from "lucide-react";
import {
  InventoryTabLayout,
  INVENTORY_TABS,
} from "@/components/inventory/InventoryTabLayout";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventoryTabLayout
      tabs={INVENTORY_TABS}
      moduleId="inventory"
      moduleLabel="Inventory Management"
      moduleIcon={Package}
      moduleDescription="Stock control, warehouses, and item catalog"
    >
      {children}
    </InventoryTabLayout>
  );
}
