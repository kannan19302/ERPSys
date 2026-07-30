"use client";
import { BarChart3 } from "lucide-react";
import {
  ReportingTabLayout,
  REPORTING_TABS,
} from "@/components/reporting/ReportingTabLayout";

export default function ReportingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReportingTabLayout
      tabs={REPORTING_TABS}
      moduleId="reporting"
      moduleLabel="Reporting"
      moduleIcon={BarChart3}
      moduleDescription="Report management, templates, scheduling, and exports"
    >
      {children}
    </ReportingTabLayout>
  );
}
