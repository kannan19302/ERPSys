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
import { AppsTabLayout, APPS_TABS } from "@/components/apps/AppsTabLayout";

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppsTabLayout
      tabs={APPS_TABS}
      moduleId="apps"
      moduleLabel="App Marketplace"
      moduleIcon={Grid}
      moduleDescription="Enterprise applications and integrations marketplace"
    >
      {children}
    </AppsTabLayout>
  );
}
