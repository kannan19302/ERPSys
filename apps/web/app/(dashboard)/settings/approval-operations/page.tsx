"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { Activity, CheckSquare, BarChart3, ShieldAlert } from "lucide-react";
import ActiveApprovalsTab from "./ActiveApprovalsTab";
import BulkApprovalsTab from "./BulkApprovalsTab";
import ApprovalAnalyticsTab from "./ApprovalAnalyticsTab";
import EscalationLogsTab from "./EscalationLogsTab";

const TAB_KEYS = ["active", "bulk", "analytics", "escalations"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const SUB_TABS: SubTab[] = [
  {
    id: "active",
    label: "Active Approvals",
    href: "/settings/approval-operations?subtab=active",
    icon: Activity,
  },
  {
    id: "bulk",
    label: "Bulk Approvals",
    href: "/settings/approval-operations?subtab=bulk",
    icon: CheckSquare,
  },
  {
    id: "analytics",
    label: "Approval Analytics",
    href: "/settings/approval-operations?subtab=analytics",
    icon: BarChart3,
  },
  {
    id: "escalations",
    label: "Escalation Logs",
    href: "/settings/approval-operations?subtab=escalations",
    icon: ShieldAlert,
  },
];

function ApprovalOperationsHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("subtab"))
    ? (searchParams.get("subtab") as TabKey)
    : "active";
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) =>
      prev.has(activeTab) ? prev : new Set(prev).add(activeTab),
    );
  }, [activeTab]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Approval Operations"
        description="Live monitoring of in-flight approvals, bulk actions, analytics, and escalations"
        breadcrumbs={[
          { label: "Administration", href: "/settings" },
          { label: "Approval Operations" },
        ]}
      />

      <SubTabBar tabs={SUB_TABS} />

      <div style={{ display: activeTab === "active" ? "block" : "none" }}>
        {visited.has("active") && <ActiveApprovalsTab />}
      </div>
      <div style={{ display: activeTab === "bulk" ? "block" : "none" }}>
        {visited.has("bulk") && <BulkApprovalsTab />}
      </div>
      <div style={{ display: activeTab === "analytics" ? "block" : "none" }}>
        {visited.has("analytics") && <ApprovalAnalyticsTab />}
      </div>
      <div style={{ display: activeTab === "escalations" ? "block" : "none" }}>
        {visited.has("escalations") && <EscalationLogsTab />}
      </div>
    </div>
  );
}

export default function ApprovalOperationsHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <ApprovalOperationsHubContent />
    </Suspense>
  );
}
