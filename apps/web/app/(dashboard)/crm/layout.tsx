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
import { CrmTabLayout, CRM_TABS } from "@/components/crm/CrmTabLayout";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmTabLayout
      tabs={CRM_TABS}
      moduleId="crm"
      moduleLabel="CRM & Sales"
      moduleIcon={BarChart3}
      moduleDescription="Customer relationship management and sales operations"
    >
      {children}
    </CrmTabLayout>
  );
}
