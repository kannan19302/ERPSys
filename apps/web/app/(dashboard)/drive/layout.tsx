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
import { DriveTabLayout, DRIVE_TABS } from "@/components/drive/DriveTabLayout";

export default function DriveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DriveTabLayout
      tabs={DRIVE_TABS}
      moduleId="drive"
      moduleLabel="Drive"
      moduleIcon={Folder}
      moduleDescription="Enterprise document management and cloud storage"
    >
      {children}
    </DriveTabLayout>
  );
}
