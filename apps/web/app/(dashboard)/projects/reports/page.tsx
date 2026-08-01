"use client";

import { PageHeader, Card } from "@unerp/ui";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  Activity,
  LineChart,
} from "lucide-react";
import { RouteGuard } from "@unerp/framework";
import Link from "next/link";
import styles from "./page.module.css";

interface ReportLink {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const reports: ReportLink[] = [
  {
    href: "/projects/wip-reports",
    icon: <TrendingUp size={20} />,
    title: "WIP & Job Costing",
    description:
      "Work-in-progress valuation and job costing reports using POC revenue recognition.",
  },
  {
    href: "/projects/revenue-recognition",
    icon: <DollarSign size={20} />,
    title: "Revenue Recognition",
    description:
      "Recognized revenue, remaining revenue, and budget performance by project.",
  },
  {
    href: "/projects/health",
    icon: <Activity size={20} />,
    title: "Project Health",
    description:
      "CPM and project health metrics including schedule performance and variance analysis.",
  },
  {
    href: "/projects/budgets",
    icon: <Receipt size={20} />,
    title: "Budget Reports",
    description:
      "Budget vs actuals, committed costs, and remaining allocations across projects.",
  },
  {
    href: "/projects/workloads",
    icon: <BarChart3 size={20} />,
    title: "Resource Workloads",
    description:
      "Resource allocation heatmaps and capacity utilization reports.",
  },
  {
    href: "/projects/portfolios",
    icon: <LineChart size={20} />,
    title: "Portfolio Analytics",
    description:
      "Cross-project portfolio performance, risk aggregation, and strategic alignment.",
  },
];

export default function ReportsPage() {
  return (
    <RouteGuard permission="projects.reports.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Reports"
          description="Project performance and financial reports"
          breadcrumbs={[
            { label: "Projects", href: "/projects" },
            { label: "Reports" },
          ]}
        />
        <Card padding="lg">
          <div className={styles.grid}>
            {reports.map((r) => (
              <Link key={r.href} href={r.href} className={styles.cardLink}>
                <div className={styles.iconWrap}>{r.icon}</div>
                <div className={styles.cardContent}>
                  <p className={styles.cardTitle}>{r.title}</p>
                  <p className={styles.cardDesc}>{r.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </RouteGuard>
  );
}
