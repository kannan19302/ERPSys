"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  Laptop,
  Calendar,
  ShieldAlert,
  HelpCircle,
  CheckSquare,
} from "lucide-react";
import AssetsTab from "./AssetsTab";
import HolidaysTab from "./HolidaysTab";
import ComplianceTab from "./ComplianceTab";
import HelpdeskTab from "./HelpdeskTab";
import SurveysTab from "./SurveysTab";

const TAB_KEYS = [
  "assets",
  "holidays",
  "compliance",
  "helpdesk",
  "surveys",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const OPERATIONS_SERVICE_TABS: SubTab[] = [
  {
    id: "assets",
    label: "Asset Management",
    href: "/hr/advanced/operations-service?tab=assets",
    icon: Laptop,
  },
  {
    id: "holidays",
    label: "Public Holidays",
    href: "/hr/advanced/operations-service?tab=holidays",
    icon: Calendar,
  },
  {
    id: "compliance",
    label: "Labor Compliance",
    href: "/hr/advanced/operations-service?tab=compliance",
    icon: ShieldAlert,
  },
  {
    id: "helpdesk",
    label: "HR Helpdesk",
    href: "/hr/advanced/operations-service?tab=helpdesk",
    icon: HelpCircle,
  },
  {
    id: "surveys",
    label: "Engagement Surveys",
    href: "/hr/advanced/operations-service?tab=surveys",
    icon: CheckSquare,
  },
];

function OperationsServiceHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("tab"))
    ? (searchParams.get("tab") as TabKey)
    : "assets";
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Operations & Service"
        description="Asset assignment, holiday calendars, labor compliance audits, employee helpdesk, and engagement surveys"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "HR", href: "/hr" },
          { label: "Advanced", href: "/hr/advanced" },
          { label: "Operations & Service" },
        ]}
      />

      <SubTabBar tabs={OPERATIONS_SERVICE_TABS} />

      <div style={{ display: activeTab === "assets" ? "block" : "none" }}>
        {visited.has("assets") && <AssetsTab />}
      </div>
      <div style={{ display: activeTab === "holidays" ? "block" : "none" }}>
        {visited.has("holidays") && <HolidaysTab />}
      </div>
      <div style={{ display: activeTab === "compliance" ? "block" : "none" }}>
        {visited.has("compliance") && <ComplianceTab />}
      </div>
      <div style={{ display: activeTab === "helpdesk" ? "block" : "none" }}>
        {visited.has("helpdesk") && <HelpdeskTab />}
      </div>
      <div style={{ display: activeTab === "surveys" ? "block" : "none" }}>
        {visited.has("surveys") && <SurveysTab />}
      </div>
    </div>
  );
}

export default function OperationsServiceHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <OperationsServiceHubContent />
    </Suspense>
  );
}
