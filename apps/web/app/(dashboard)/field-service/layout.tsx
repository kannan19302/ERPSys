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
  FieldServiceTabLayout,
  FIELD_SERVICE_TABS,
} from "@/components/field-service/FieldServiceTabLayout";

export default function FieldServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FieldServiceTabLayout
      tabs={FIELD_SERVICE_TABS}
      moduleId="field-service"
      moduleLabel="Field Service"
      moduleIcon={Wrench}
      moduleDescription="Field tickets, service dispatch, and technician management"
    >
      {children}
    </FieldServiceTabLayout>
  );
}
