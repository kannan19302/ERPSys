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
  FinanceTabLayout,
  FINANCE_TABS,
} from "@/components/finance/FinanceTabLayout";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinanceTabLayout
      tabs={FINANCE_TABS}
      moduleId="finance"
      moduleLabel="Finance & Accounting"
      moduleIcon={BarChart3}
      moduleDescription="Executive financial management, GL, AR, AP & treasury"
    >
      {children}
    </FinanceTabLayout>
  );
}
