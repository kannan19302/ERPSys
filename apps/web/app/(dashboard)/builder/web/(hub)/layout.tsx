import React from "react";
import { SubTabBar } from "@unerp/ui-layout";
import { WEB_SUB_TABS } from "@/components/builder/web-sub-tabs";

/**
 * Level-2 nav for the Web Studio hub. Wraps every route under
 * `/builder/web/*` (including `sites/[id]`) except `web/canvas`, which is an
 * embedded iframe target rather than a nav destination — see
 * web-sub-tabs.ts for why it's excluded from the tab list. Only the tab bar
 * gets layout padding here; each page keeps its own inner padding.
 */
export default function WebStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ padding: "var(--space-6) var(--space-6) 0" }}>
        <SubTabBar tabs={WEB_SUB_TABS} />
      </div>
      {children}
    </>
  );
}
