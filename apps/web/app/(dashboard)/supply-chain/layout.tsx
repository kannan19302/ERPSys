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
  SupplyChainTabLayout,
  SUPPLY_CHAIN_TABS,
} from "@/components/supply-chain/SupplyChainTabLayout";

export default function SupplyChainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupplyChainTabLayout
      tabs={SUPPLY_CHAIN_TABS}
      moduleId="supply-chain"
      moduleLabel="Supply Chain"
      moduleIcon={Truck}
      moduleDescription="Logistics, shipments, carriers, and control tower"
    >
      {children}
    </SupplyChainTabLayout>
  );
}
