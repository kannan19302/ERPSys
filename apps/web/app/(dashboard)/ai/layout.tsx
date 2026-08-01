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
import { AiTabLayout, AI_TABS } from "@/components/ai/AiTabLayout";

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <AiTabLayout
      tabs={AI_TABS}
      moduleId="ai"
      moduleLabel="AI Studio"
      moduleIcon={Sparkles}
      moduleDescription="AI tools, copilot, and intelligent automation"
    >
      {children}
    </AiTabLayout>
  );
}
