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
  EducationTabLayout,
  EDUCATION_TABS,
} from "@/components/education/EducationTabLayout";

export default function EducationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EducationTabLayout
      tabs={EDUCATION_TABS}
      moduleId="education"
      moduleLabel="Education"
      moduleIcon={GraduationCap}
      moduleDescription="Student records, courses, and academic management"
    >
      {children}
    </EducationTabLayout>
  );
}
