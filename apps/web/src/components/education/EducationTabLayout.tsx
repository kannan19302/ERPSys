"use client";

import {
  Home,
  Users,
  BookOpen,
  Calendar,
  Award,
  ClipboardCheck,
  DollarSign,
  Library,
  BarChart3,
  Settings,
} from "lucide-react";
import type { ModuleTab } from "@unerp/ui-layout";

export {
  ModuleTabLayout as EducationTabLayout,
  type ModuleTab as EducationTab,
  type ModuleTabLayoutProps as EducationTabLayoutProps,
  SubTabBar,
  type SubTab,
} from "@unerp/ui-layout";

export const EDUCATION_TABS: ModuleTab[] = [
  {
    id: "overview",
    label: "Dashboard",
    href: "/education",
    icon: Home,
    description: "Education overview",
  },
  {
    id: "students",
    label: "Student Registry",
    href: "/education/students",
    icon: Users,
    description: "Student enrollment records",
  },
  {
    id: "courses",
    label: "Course Catalog",
    href: "/education/courses",
    icon: BookOpen,
    description: "Academic course catalog",
  },
  {
    id: "timetable",
    label: "Timetable",
    href: "/education/timetable",
    icon: Calendar,
    description: "Class schedules",
  },
  {
    id: "grades",
    label: "Grade Book",
    href: "/education/grades",
    icon: Award,
    description: "Student grades and assessments",
  },
  {
    id: "attendance",
    label: "Attendance",
    href: "/education/attendance",
    icon: ClipboardCheck,
    description: "Student attendance tracking",
  },
  {
    id: "fees",
    label: "Fee Management",
    href: "/education/fees",
    icon: DollarSign,
    description: "Fee collection and management",
  },
  {
    id: "library",
    label: "Library",
    href: "/education/library",
    icon: Library,
    description: "Library circulation",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/education/reports",
    icon: BarChart3,
    description: "Academic reports",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/education/settings",
    icon: Settings,
    description: "Education module settings",
  },
];
