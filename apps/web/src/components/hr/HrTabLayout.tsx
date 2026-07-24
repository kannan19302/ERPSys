"use client";

import {
  Users,
  UserIcon,
  Briefcase,
  UserPlus,
  Award,
  Clock,
  DollarSign,
  Coffee,
  GraduationCap,
  CreditCard,
  BarChart3,
  FileText,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as HrTabLayout,
  type ModuleTab as HrTab,
  type ModuleTabLayoutProps as HrTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const HR_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/hr",
    icon: Users,
    description: "Employee directory and HR overview",
  },
  {
    id: "self-service",
    label: "Self-Service",
    href: "/hr/advanced/self-service",
    icon: UserIcon,
    description: "Employee self-service portal",
  },
  {
    id: "recruitment",
    label: "Recruitment",
    href: "/hr/advanced/recruitment",
    icon: Briefcase,
    description: "Job postings and candidate tracking",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    href: "/hr/advanced/onboarding",
    icon: UserPlus,
    description: "New hire onboarding checklists",
  },
  {
    id: "performance",
    label: "Performance",
    href: "/hr/advanced/appraisals",
    icon: Award,
    description: "Goals, appraisals, and 360 feedback",
  },
  {
    id: "attendance",
    label: "Attendance",
    href: "/hr/advanced/attendance",
    icon: Clock,
    description: "Attendance records and shift scheduling",
  },
  {
    id: "payroll",
    label: "Payroll",
    href: "/hr/advanced/payroll",
    icon: DollarSign,
    description: "Payroll and salary management",
  },
  {
    id: "leaves",
    label: "Leaves",
    href: "/hr/advanced/leaves",
    icon: Coffee,
    description: "Leave requests and accruals",
  },
  {
    id: "training",
    label: "Training",
    href: "/hr/advanced/trainings",
    icon: GraduationCap,
    description: "Training and certifications",
  },
  {
    id: "benefits",
    label: "Benefits",
    href: "/hr/advanced/benefits",
    icon: CreditCard,
    description: "Benefits administration",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/hr/advanced/analytics",
    icon: BarChart3,
    description: "Workforce analytics",
  },
  {
    id: "documents",
    label: "Documents",
    href: "/hr/advanced/documents",
    icon: FileText,
    advanced: true,
    group: "Admin",
    description: "HR document manager",
  },
];
