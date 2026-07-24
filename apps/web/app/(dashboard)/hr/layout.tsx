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
import { HrTabLayout, HR_TABS } from "@/components/hr/HrTabLayout";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <HrTabLayout
      tabs={HR_TABS}
      moduleId="hr"
      moduleLabel="Human Resources"
      moduleIcon={Users}
      moduleDescription="HR, payroll, attendance, benefits, and talent"
    >
      {children}
    </HrTabLayout>
  );
}
