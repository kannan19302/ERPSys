"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  Image as ImageIcon,
  Mail,
  FileText,
  Megaphone,
  ShieldAlert,
} from "lucide-react";
import LoginPageTab from "./LoginPageTab";
import EmailServerTab from "./EmailServerTab";
import EmailTemplatesTab from "./EmailTemplatesTab";
import AnnouncementsTab from "./AnnouncementsTab";
import MaintenanceModeTab from "./MaintenanceModeTab";

const TAB_KEYS = [
  "login-page",
  "email-server",
  "email-templates",
  "announcements",
  "maintenance",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const SUB_TABS: SubTab[] = [
  {
    id: "login-page",
    label: "Login Page",
    href: "/settings/branding-communication?subtab=login-page",
    icon: ImageIcon,
  },
  {
    id: "email-server",
    label: "Email Server (SMTP)",
    href: "/settings/branding-communication?subtab=email-server",
    icon: Mail,
  },
  {
    id: "email-templates",
    label: "Email Templates",
    href: "/settings/branding-communication?subtab=email-templates",
    icon: FileText,
  },
  {
    id: "announcements",
    label: "Announcements",
    href: "/settings/branding-communication?subtab=announcements",
    icon: Megaphone,
  },
  {
    id: "maintenance",
    label: "Maintenance Mode",
    href: "/settings/branding-communication?subtab=maintenance",
    icon: ShieldAlert,
  },
];

function BrandingCommunicationHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("subtab"))
    ? (searchParams.get("subtab") as TabKey)
    : "login-page";
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) =>
      prev.has(activeTab) ? prev : new Set(prev).add(activeTab),
    );
  }, [activeTab]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Branding & Communication"
        description="Customize the login experience and manage outbound tenant communications"
        breadcrumbs={[
          { label: "Administration", href: "/settings" },
          { label: "Branding & Communication" },
        ]}
      />

      <SubTabBar tabs={SUB_TABS} />

      <div style={{ display: activeTab === "login-page" ? "block" : "none" }}>
        {visited.has("login-page") && <LoginPageTab />}
      </div>
      <div style={{ display: activeTab === "email-server" ? "block" : "none" }}>
        {visited.has("email-server") && <EmailServerTab />}
      </div>
      <div
        style={{ display: activeTab === "email-templates" ? "block" : "none" }}
      >
        {visited.has("email-templates") && <EmailTemplatesTab />}
      </div>
      <div
        style={{ display: activeTab === "announcements" ? "block" : "none" }}
      >
        {visited.has("announcements") && <AnnouncementsTab />}
      </div>
      <div style={{ display: activeTab === "maintenance" ? "block" : "none" }}>
        {visited.has("maintenance") && <MaintenanceModeTab />}
      </div>
    </div>
  );
}

export default function BrandingCommunicationHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <BrandingCommunicationHubContent />
    </Suspense>
  );
}
