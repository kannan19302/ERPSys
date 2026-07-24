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
import { SalesTabLayout, SALES_TABS } from "@/components/sales/SalesTabLayout";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SalesTabLayout
      tabs={SALES_TABS}
      moduleId="sales"
      moduleLabel="Sales Management"
      moduleIcon={TrendingUp}
      moduleDescription="Sales orders, quotations, CPQ, and commissions"
    >
      {children}
    </SalesTabLayout>
  );
}
