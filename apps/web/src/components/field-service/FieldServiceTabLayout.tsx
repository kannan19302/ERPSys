"use client";

import {
  Home,
  ClipboardList,
  MapPin,
  ClipboardCheck,
  Wrench,
  Users,
  BarChart3,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as FieldServiceTabLayout,
  type ModuleTab as FieldServiceTab,
  type ModuleTabLayoutProps as FieldServiceTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const FIELD_SERVICE_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/field-service",
    icon: Home,
    description: "Field service overview",
  },
  {
    id: "tickets",
    label: "Service Tickets",
    href: "/field-service/tickets",
    icon: ClipboardList,
    description: "Customer service requests",
  },
  {
    id: "dispatch",
    label: "Dispatch Board",
    href: "/field-service/dispatch",
    icon: MapPin,
    description: "Technician dispatch scheduling",
  },
  {
    id: "checklists",
    label: "Checklists",
    href: "/field-service/checklists",
    icon: ClipboardCheck,
    description: "Service checklists",
  },
  {
    id: "preventive",
    label: "Preventive Maintenance",
    href: "/field-service/preventive",
    icon: Wrench,
    description: "Scheduled maintenance",
  },
  {
    id: "technicians",
    label: "Technicians",
    href: "/field-service/technicians",
    icon: Users,
    description: "Technician directory",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/field-service/reports",
    icon: BarChart3,
    description: "Field service reports",
  },
];
