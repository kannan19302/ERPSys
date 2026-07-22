import React from "react";
import { SubTabBar } from "@unerp/ui-layout";
import { MANAGE_SUB_TABS } from "@/components/builder/manage-sub-tabs";

/**
 * Level-2 nav for the Manage & Governance hub. Wraps every route under
 * `/builder/manage/*` so the whole hub is tab-navigable instead of
 * sidebar-only. Only the tab bar gets layout padding here; each page keeps
 * its own inner padding.
 */
export default function ManageStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ padding: "var(--space-6) var(--space-6) 0" }}>
        <SubTabBar tabs={MANAGE_SUB_TABS} />
      </div>
      {children}
    </>
  );
}
