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
  RealEstateTabLayout,
  REAL_ESTATE_TABS,
} from "@/components/real-estate/RealEstateTabLayout";

export default function RealEstateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealEstateTabLayout
      tabs={REAL_ESTATE_TABS}
      moduleId="real-estate"
      moduleLabel="Real Estate"
      moduleIcon={Building2}
      moduleDescription="Property management, leasing, and tenant tracking"
    >
      {children}
    </RealEstateTabLayout>
  );
}
