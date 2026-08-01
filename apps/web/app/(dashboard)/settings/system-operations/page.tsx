"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  Activity,
  Layers,
  CalendarDays,
  AlertCircle,
  Bell,
  Trash2,
} from "lucide-react";
import SystemHealthTab from "./SystemHealthTab";
import BackgroundJobsTab from "./BackgroundJobsTab";
import ScheduledTasksTab from "./ScheduledTasksTab";
import ErrorLogsTab from "./ErrorLogsTab";
import AdminAlertsTab from "./AdminAlertsTab";
import RecycleBinTab from "./RecycleBinTab";

const TAB_KEYS = [
  "health",
  "jobs",
  "tasks",
  "error-logs",
  "alerts",
  "recycle-bin",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const SUB_TABS: SubTab[] = [
  {
    id: "health",
    label: "System Health",
    href: "/settings/system-operations?subtab=health",
    icon: Activity,
  },
  {
    id: "jobs",
    label: "Background Jobs",
    href: "/settings/system-operations?subtab=jobs",
    icon: Layers,
  },
  {
    id: "tasks",
    label: "Scheduled Tasks",
    href: "/settings/system-operations?subtab=tasks",
    icon: CalendarDays,
  },
  {
    id: "error-logs",
    label: "Error Logs",
    href: "/settings/system-operations?subtab=error-logs",
    icon: AlertCircle,
  },
  {
    id: "alerts",
    label: "Admin Alerts",
    href: "/settings/system-operations?subtab=alerts",
    icon: Bell,
  },
  {
    id: "recycle-bin",
    label: "Recycle Bin",
    href: "/settings/system-operations?subtab=recycle-bin",
    icon: Trash2,
  },
];

function SystemOperationsHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("subtab"))
    ? (searchParams.get("subtab") as TabKey)
    : "health";
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) =>
      prev.has(activeTab) ? prev : new Set(prev).add(activeTab),
    );
  }, [activeTab]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="System Operations"
        description="Health, background jobs, scheduled tasks, error logs, alerts, and recycle bin"
        breadcrumbs={[
          { label: "Administration", href: "/settings" },
          { label: "System Operations" },
        ]}
      />

      <SubTabBar tabs={SUB_TABS} />

      <div style={{ display: activeTab === "health" ? "block" : "none" }}>
        {visited.has("health") && <SystemHealthTab />}
      </div>
      <div style={{ display: activeTab === "jobs" ? "block" : "none" }}>
        {visited.has("jobs") && <BackgroundJobsTab />}
      </div>
      <div style={{ display: activeTab === "tasks" ? "block" : "none" }}>
        {visited.has("tasks") && <ScheduledTasksTab />}
      </div>
      <div style={{ display: activeTab === "error-logs" ? "block" : "none" }}>
        {visited.has("error-logs") && <ErrorLogsTab />}
      </div>
      <div style={{ display: activeTab === "alerts" ? "block" : "none" }}>
        {visited.has("alerts") && <AdminAlertsTab />}
      </div>
      <div style={{ display: activeTab === "recycle-bin" ? "block" : "none" }}>
        {visited.has("recycle-bin") && <RecycleBinTab />}
      </div>
    </div>
  );
}

export default function SystemOperationsHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <SystemOperationsHubContent />
    </Suspense>
  );
}
