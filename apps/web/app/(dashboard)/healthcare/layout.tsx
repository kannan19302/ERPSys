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
  HealthcareTabLayout,
  HEALTHCARE_TABS,
} from "@/components/healthcare/HealthcareTabLayout";

export default function HealthcareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HealthcareTabLayout
      tabs={HEALTHCARE_TABS}
      moduleId="healthcare"
      moduleLabel="Healthcare"
      moduleIcon={Stethoscope}
      moduleDescription="Patient records, appointments, and EHR management"
    >
      {children}
    </HealthcareTabLayout>
  );
}
