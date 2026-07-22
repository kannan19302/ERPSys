"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { GitFork, Zap, Mail, Play } from "lucide-react";
import TemplatesTab from "./TemplatesTab";
import DynamicRoutingTab from "./DynamicRoutingTab";
import EmailApprovalsTab from "./EmailApprovalsTab";
import SimulatorTab from "./SimulatorTab";

const TAB_KEYS = ["templates", "routing", "email", "simulator"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const SUB_TABS: SubTab[] = [
  {
    id: "templates",
    label: "Templates",
    href: "/settings/workflow-builder?subtab=templates",
    icon: GitFork,
  },
  {
    id: "routing",
    label: "Dynamic Routing",
    href: "/settings/workflow-builder?subtab=routing",
    icon: Zap,
  },
  {
    id: "email",
    label: "Email Approvals",
    href: "/settings/workflow-builder?subtab=email",
    icon: Mail,
  },
  {
    id: "simulator",
    label: "Simulator",
    href: "/settings/workflow-builder?subtab=simulator",
    icon: Play,
  },
];

function WorkflowBuilderHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("subtab"))
    ? (searchParams.get("subtab") as TabKey)
    : "templates";
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) =>
      prev.has(activeTab) ? prev : new Set(prev).add(activeTab),
    );
  }, [activeTab]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Workflow Builder"
        description="Author approval templates, routing rules, email actions, and dry-run simulations"
        breadcrumbs={[
          { label: "Administration", href: "/settings" },
          { label: "Workflow Builder" },
        ]}
      />

      <SubTabBar tabs={SUB_TABS} />

      <div style={{ display: activeTab === "templates" ? "block" : "none" }}>
        {visited.has("templates") && <TemplatesTab />}
      </div>
      <div style={{ display: activeTab === "routing" ? "block" : "none" }}>
        {visited.has("routing") && <DynamicRoutingTab />}
      </div>
      <div style={{ display: activeTab === "email" ? "block" : "none" }}>
        {visited.has("email") && <EmailApprovalsTab />}
      </div>
      <div style={{ display: activeTab === "simulator" ? "block" : "none" }}>
        {visited.has("simulator") && <SimulatorTab />}
      </div>
    </div>
  );
}

export default function WorkflowBuilderHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <WorkflowBuilderHubContent />
    </Suspense>
  );
}
