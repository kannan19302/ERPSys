"use client";

import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  Activity,
  Globe,
  BarChart3,
  Settings,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as HealthcareTabLayout,
  type ModuleTab as HealthcareTab,
  type ModuleTabLayoutProps as HealthcareTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const HEALTHCARE_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/healthcare",
    icon: Home,
    description: "Healthcare overview",
  },
  {
    id: "patients",
    label: "Patient Registry",
    href: "/healthcare/patients",
    icon: Users,
    description: "Patient records",
  },
  {
    id: "appointments",
    label: "Appointments",
    href: "/healthcare/appointments",
    icon: Calendar,
    description: "Appointment scheduling",
  },
  {
    id: "clinical",
    label: "Clinical Notes",
    href: "/healthcare/clinical",
    icon: ClipboardList,
    description: "Clinical documentation",
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    href: "/healthcare/prescriptions",
    icon: FileText,
    description: "E-prescriptions",
  },
  {
    id: "lab-results",
    label: "Lab Results",
    href: "/healthcare/lab-results",
    icon: Activity,
    description: "Lab order and results",
  },
  {
    id: "practitioners",
    label: "Practitioners",
    href: "/healthcare/practitioners",
    icon: Users,
    description: "Healthcare provider directory",
  },
  {
    id: "fhir",
    label: "FHIR / SMART",
    href: "/healthcare/fhir",
    icon: Globe,
    description: "FHIR integration",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/healthcare/reports",
    icon: BarChart3,
    description: "Healthcare reports",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/healthcare/settings",
    icon: Settings,
    description: "Healthcare settings",
  },
];
