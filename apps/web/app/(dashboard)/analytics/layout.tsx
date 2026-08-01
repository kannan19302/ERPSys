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
  AnalyticsTabLayout,
  ANALYTICS_TABS,
} from "@/components/analytics/AnalyticsTabLayout";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnalyticsTabLayout
      tabs={ANALYTICS_TABS}
      moduleId="analytics"
      moduleLabel="Analytics"
      moduleIcon={LineChart}
      moduleDescription="Business intelligence and reporting studio"
    >
      {children}
    </AnalyticsTabLayout>
  );
}
