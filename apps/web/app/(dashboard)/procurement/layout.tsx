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
  ProcurementTabLayout,
  PROCUREMENT_TABS,
} from "@/components/procurement/ProcurementTabLayout";

export default function ProcurementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProcurementTabLayout
      tabs={PROCUREMENT_TABS}
      moduleId="procurement"
      moduleLabel="Procurement"
      moduleIcon={ShoppingBag}
      moduleDescription="Purchasing, RFQs, vendor management, and contracts"
    >
      {children}
    </ProcurementTabLayout>
  );
}
