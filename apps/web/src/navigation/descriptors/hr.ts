import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "hr",
  title: "Human Resources",
  icon: "Users",
  routeSegment: "hr",
  dashboardRoute: "/hr",
  settingsRoute: undefined,
  nav: [
    { label: "Dashboard", href: "/hr", icon: "Users" },
    {
      label: "Self-Service",
      href: "/hr/advanced/self-service",
      icon: "UserIcon",
    },
    {
      label: "Recruitment",
      href: "/hr/advanced/recruitment",
      icon: "Briefcase",
    },
    { label: "Onboarding", href: "/hr/advanced/onboarding", icon: "UserPlus" },
    { label: "Performance", href: "/hr/advanced/appraisals", icon: "Award" },
    { label: "Attendance", href: "/hr/advanced/attendance", icon: "Clock" },
    { label: "Payroll", href: "/hr/advanced/payroll", icon: "DollarSign" },
    { label: "Leaves", href: "/hr/advanced/leaves", icon: "Coffee" },
    {
      label: "Training",
      href: "/hr/advanced/trainings",
      icon: "GraduationCap",
    },
    { label: "Benefits", href: "/hr/advanced/benefits", icon: "CreditCard" },
    { label: "Analytics", href: "/hr/advanced/analytics", icon: "BarChart3" },
    { label: "Documents", href: "/hr/advanced/documents", icon: "FileText" },
  ],
});
