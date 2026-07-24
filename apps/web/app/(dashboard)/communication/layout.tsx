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
  CommunicationTabLayout,
  COMMUNICATION_TABS,
} from "@/components/communication/CommunicationTabLayout";

export default function CommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommunicationTabLayout
      tabs={COMMUNICATION_TABS}
      moduleId="communication"
      moduleLabel="Communication"
      moduleIcon={MessageSquare}
      moduleDescription="Messaging, team spaces, and collaboration"
    >
      {children}
    </CommunicationTabLayout>
  );
}
