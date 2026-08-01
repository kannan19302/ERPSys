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
  SettingsTabLayout,
  SETTINGS_TABS,
} from "@/components/settings/SettingsTabLayout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsTabLayout
      tabs={SETTINGS_TABS}
      moduleId="settings"
      moduleLabel="System Settings"
      moduleIcon={Settings}
      moduleDescription="Global system administration, security, and settings"
    >
      {children}
    </SettingsTabLayout>
  );
}
