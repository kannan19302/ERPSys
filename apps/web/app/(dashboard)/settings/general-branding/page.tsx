"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import {
  Settings,
  Image as ImageIcon,
  Smartphone,
  Flame,
  Settings2,
} from "lucide-react";
import GeneralSettingsTab from "./GeneralSettingsTab";
import BrandingTab from "./BrandingTab";
import WhiteLabelTab from "./WhiteLabelTab";
import FeatureFlagsTab from "./FeatureFlagsTab";
import CustomFieldsTab from "./CustomFieldsTab";

const TAB_KEYS = [
  "general",
  "branding",
  "white-label",
  "feature-flags",
  "custom-fields",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const SUB_TABS: SubTab[] = [
  {
    id: "general",
    label: "General Settings",
    href: "/settings/general-branding?subtab=general",
    icon: Settings,
  },
  {
    id: "branding",
    label: "Branding",
    href: "/settings/general-branding?subtab=branding",
    icon: ImageIcon,
  },
  {
    id: "white-label",
    label: "White-Label & PWA",
    href: "/settings/general-branding?subtab=white-label",
    icon: Smartphone,
  },
  {
    id: "feature-flags",
    label: "Feature Flags",
    href: "/settings/general-branding?subtab=feature-flags",
    icon: Flame,
  },
  {
    id: "custom-fields",
    label: "Custom Fields",
    href: "/settings/general-branding?subtab=custom-fields",
    icon: Settings2,
  },
];

function GeneralBrandingHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("subtab"))
    ? (searchParams.get("subtab") as TabKey)
    : "general";
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) =>
      prev.has(activeTab) ? prev : new Set(prev).add(activeTab),
    );
  }, [activeTab]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="General & Branding"
        description="Organization profile, visual identity, PWA, feature flags, and custom fields"
        breadcrumbs={[
          { label: "Administration", href: "/settings" },
          { label: "General & Branding" },
        ]}
      />

      <SubTabBar tabs={SUB_TABS} />

      <div style={{ display: activeTab === "general" ? "block" : "none" }}>
        {visited.has("general") && <GeneralSettingsTab />}
      </div>
      <div style={{ display: activeTab === "branding" ? "block" : "none" }}>
        {visited.has("branding") && <BrandingTab />}
      </div>
      <div style={{ display: activeTab === "white-label" ? "block" : "none" }}>
        {visited.has("white-label") && <WhiteLabelTab />}
      </div>
      <div
        style={{ display: activeTab === "feature-flags" ? "block" : "none" }}
      >
        {visited.has("feature-flags") && <FeatureFlagsTab />}
      </div>
      <div
        style={{ display: activeTab === "custom-fields" ? "block" : "none" }}
      >
        {visited.has("custom-fields") && <CustomFieldsTab />}
      </div>
    </div>
  );
}

export default function GeneralBrandingHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <GeneralBrandingHubContent />
    </Suspense>
  );
}
