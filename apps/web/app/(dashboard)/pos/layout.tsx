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
import { PosTabLayout, POS_TABS } from "@/components/pos/PosTabLayout";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <PosTabLayout
      tabs={POS_TABS}
      moduleId="pos"
      moduleLabel="Point of Sale"
      moduleIcon={Store}
      moduleDescription="Retail point of sale and register management"
    >
      {children}
    </PosTabLayout>
  );
}
