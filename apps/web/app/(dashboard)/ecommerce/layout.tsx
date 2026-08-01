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
  EcommerceTabLayout,
  ECOMMERCE_TABS,
} from "@/components/ecommerce/EcommerceTabLayout";

export default function EcommerceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EcommerceTabLayout
      tabs={ECOMMERCE_TABS}
      moduleId="ecommerce"
      moduleLabel="E-Commerce"
      moduleIcon={ShoppingBag}
      moduleDescription="Online store, catalog, and order management"
    >
      {children}
    </EcommerceTabLayout>
  );
}
