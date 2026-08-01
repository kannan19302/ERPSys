"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { Users, ShieldCheck, Package } from "lucide-react";
import UsersTab from "./UsersTab";
import GroupsTab from "./GroupsTab";
import RolesTab from "./RolesTab";
import PackagesTab from "./PackagesTab";

const TAB_KEYS = ["users", "groups", "roles", "packages"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const SUB_TABS: SubTab[] = [
  {
    id: "users",
    label: "Users",
    href: "/settings/identity-access?subtab=users",
    icon: Users,
  },
  {
    id: "groups",
    label: "Groups & Teams",
    href: "/settings/identity-access?subtab=groups",
    icon: Users,
  },
  {
    id: "roles",
    label: "Roles",
    href: "/settings/identity-access?subtab=roles",
    icon: ShieldCheck,
  },
  {
    id: "packages",
    label: "Access Packages",
    href: "/settings/identity-access?subtab=packages",
    icon: Package,
  },
];

function IdentityAccessHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("subtab"))
    ? (searchParams.get("subtab") as TabKey)
    : "users";
  // Track which tabs have ever been activated so each tab lazy-loads its data
  // on first activation only, not all four on page mount.
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) =>
      prev.has(activeTab) ? prev : new Set(prev).add(activeTab),
    );
  }, [activeTab]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Identity & Access"
        description="Manage users, groups, roles, and access packages across your organization"
        breadcrumbs={[
          { label: "Administration", href: "/settings" },
          { label: "Identity & Access" },
        ]}
      />

      <SubTabBar tabs={SUB_TABS} />

      {/* Each tab keeps fully independent fetch/loading/error/pagination state.
          Tabs that have never been activated are not mounted at all, so their
          API calls do not fire until the user switches to them. Once visited,
          a tab stays mounted (hidden via CSS) so its state isn't lost when
          switching away and back. */}
      <div style={{ display: activeTab === "users" ? "block" : "none" }}>
        {visited.has("users") && <UsersTab />}
      </div>
      <div style={{ display: activeTab === "groups" ? "block" : "none" }}>
        {visited.has("groups") && <GroupsTab />}
      </div>
      <div style={{ display: activeTab === "roles" ? "block" : "none" }}>
        {visited.has("roles") && <RolesTab />}
      </div>
      <div style={{ display: activeTab === "packages" ? "block" : "none" }}>
        {visited.has("packages") && <PackagesTab />}
      </div>
    </div>
  );
}

export default function IdentityAccessHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <IdentityAccessHubContent />
    </Suspense>
  );
}
