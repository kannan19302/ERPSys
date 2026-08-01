import React from "react";
import { SubTabBar } from "@unerp/ui-layout";
import { ERP_SUB_TABS } from "@/components/builder/erp-sub-tabs";

/**
 * Level-2 nav for the App Studio hub. Wraps every route under
 * `/builder/erp/*` (including `[id]` detail pages) so the whole hub is
 * tab-navigable instead of sidebar-only. SubTabBar highlights the most
 * specific matching route (see packages/ui-layout SubTabBar fix), so detail
 * pages like `forms/[id]` still show "Forms" active. Only the tab bar gets
 * layout padding here — each page below keeps managing its own inner
 * padding, so nothing gets doubled up.
 */
export default function ErpStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ padding: "var(--space-6) var(--space-6) 0" }}>
        <SubTabBar tabs={ERP_SUB_TABS} />
      </div>
      {children}
    </>
  );
}
