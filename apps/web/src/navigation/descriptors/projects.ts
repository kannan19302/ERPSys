// @ts-nocheck
import { registerModule } from "@unerp/shared/module-registry";

registerModule({
  slug: "projects",
  title: "Project Management",
  icon: "Briefcase",
  routeSegment: "projects",
  dashboardRoute: "/projects",
  settingsRoute: undefined,
  nav: [
    { label: "Gantt & Tasks", href: "/projects", icon: "Briefcase" },
    { label: "Portfolio Hub", href: "/projects/portfolios", icon: "Target" },
    { label: "Client Portal", href: "/projects/client-portal", icon: "Home" },
    { label: "Resource Workloads", href: "/projects/workloads", icon: "Clock" },
    { label: "Project Health", href: "/projects/health", icon: "Activity" },
    {
      label: "Revenue Recognition",
      href: "/projects/revenue-recognition",
      icon: "DollarSign",
    },
    { label: "Timesheets", href: "/projects/timesheets", icon: "Clock" },
  ],
});
