"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  Key,
  Shield,
  Box,
  BarChart3,
  Webhook,
  ExternalLink,
} from "lucide-react";
import ApiKeysTab from "./ApiKeysTab";
import OAuthClientsTab from "./OAuthClientsTab";
import SandboxesTab from "./SandboxesTab";
import ApiMetricsTab from "./ApiMetricsTab";
import WebhooksConfigTab from "./WebhooksConfigTab";
import WebhookLogsTab from "./WebhookLogsTab";

const TAB_KEYS = [
  "api-keys",
  "oauth",
  "sandbox",
  "analytics",
  "webhooks",
  "webhook-logs",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const SUB_TABS: SubTab[] = [
  {
    id: "api-keys",
    label: "API Keys",
    href: "/settings/api-platform?subtab=api-keys",
    icon: Key,
  },
  {
    id: "oauth",
    label: "SSO & OAuth Clients",
    href: "/settings/api-platform?subtab=oauth",
    icon: Shield,
  },
  {
    id: "sandbox",
    label: "Developer Sandboxes",
    href: "/settings/api-platform?subtab=sandbox",
    icon: Box,
  },
  {
    id: "analytics",
    label: "API Metrics & Analytics",
    href: "/settings/api-platform?subtab=analytics",
    icon: BarChart3,
  },
  {
    id: "webhooks",
    label: "Webhooks Config",
    href: "/settings/api-platform?subtab=webhooks",
    icon: Webhook,
  },
  {
    id: "webhook-logs",
    label: "Webhook Logs",
    href: "/settings/api-platform?subtab=webhook-logs",
    icon: ExternalLink,
  },
];

function ApiPlatformHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("subtab"))
    ? (searchParams.get("subtab") as TabKey)
    : "api-keys";
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) =>
      prev.has(activeTab) ? prev : new Set(prev).add(activeTab),
    );
  }, [activeTab]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="API Platform"
        description="Manage programmatic access to this tenant — keys, OAuth clients, sandboxes, and webhooks"
        breadcrumbs={[
          { label: "Administration", href: "/settings" },
          { label: "API Platform" },
        ]}
      />

      <SubTabBar tabs={SUB_TABS} />

      <div style={{ display: activeTab === "api-keys" ? "block" : "none" }}>
        {visited.has("api-keys") && <ApiKeysTab />}
      </div>
      <div style={{ display: activeTab === "oauth" ? "block" : "none" }}>
        {visited.has("oauth") && <OAuthClientsTab />}
      </div>
      <div style={{ display: activeTab === "sandbox" ? "block" : "none" }}>
        {visited.has("sandbox") && <SandboxesTab />}
      </div>
      <div style={{ display: activeTab === "analytics" ? "block" : "none" }}>
        {visited.has("analytics") && <ApiMetricsTab />}
      </div>
      <div style={{ display: activeTab === "webhooks" ? "block" : "none" }}>
        {visited.has("webhooks") && <WebhooksConfigTab />}
      </div>
      <div style={{ display: activeTab === "webhook-logs" ? "block" : "none" }}>
        {visited.has("webhook-logs") && <WebhookLogsTab />}
      </div>
    </div>
  );
}

export default function ApiPlatformHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <ApiPlatformHubContent />
    </Suspense>
  );
}
