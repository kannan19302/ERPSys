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
import { SaasTabLayout, SAAS_TABS } from "@/components/saas/SaasTabLayout";

export default function SaasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SaasTabLayout
      tabs={SAAS_TABS}
      moduleId="saas"
      moduleLabel="SaaS Control Center"
      moduleIcon={Cloud}
      moduleDescription="Tenant administration, subscriptions, and billing"
    >
      {children}
    </SaasTabLayout>
  );
}
