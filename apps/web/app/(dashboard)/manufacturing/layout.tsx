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
  ManufacturingTabLayout,
  MANUFACTURING_TABS,
} from "@/components/manufacturing/ManufacturingTabLayout";

export default function ManufacturingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ManufacturingTabLayout
      tabs={MANUFACTURING_TABS}
      moduleId="manufacturing"
      moduleLabel="Manufacturing"
      moduleIcon={Factory}
      moduleDescription="Production planning, BOMs, MRP, and shop floor"
    >
      {children}
    </ManufacturingTabLayout>
  );
}
