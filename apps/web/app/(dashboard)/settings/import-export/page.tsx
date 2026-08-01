"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Spinner } from "@unerp/ui";
import { SubTabBar, type SubTab } from "@unerp/ui-layout";
import { Upload, Download, Smartphone } from "lucide-react";
import ImportDataTab from "./ImportDataTab";
import ExportDataTab from "./ExportDataTab";
import SyncMonitorTab from "./SyncMonitorTab";

const TAB_KEYS = ["import", "export", "sync"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

const SUB_TABS: SubTab[] = [
  {
    id: "import",
    label: "Import Data",
    href: "/settings/import-export?subtab=import",
    icon: Upload,
  },
  {
    id: "export",
    label: "Export Data",
    href: "/settings/import-export?subtab=export",
    icon: Download,
  },
  {
    id: "sync",
    label: "Sync Monitor",
    href: "/settings/import-export?subtab=sync",
    icon: Smartphone,
  },
];

function ImportExportHubContent() {
  const searchParams = useSearchParams();
  const activeTab: TabKey = isTabKey(searchParams.get("subtab"))
    ? (searchParams.get("subtab") as TabKey)
    : "import";
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) =>
      prev.has(activeTab) ? prev : new Set(prev).add(activeTab),
    );
  }, [activeTab]);

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Import / Export"
        description="Move data in and out of this tenant, and monitor offline PWA sync"
        breadcrumbs={[
          { label: "Administration", href: "/settings" },
          { label: "Import / Export" },
        ]}
      />

      <SubTabBar tabs={SUB_TABS} />

      <div style={{ display: activeTab === "import" ? "block" : "none" }}>
        {visited.has("import") && <ImportDataTab />}
      </div>
      <div style={{ display: activeTab === "export" ? "block" : "none" }}>
        {visited.has("export") && <ExportDataTab />}
      </div>
      <div style={{ display: activeTab === "sync" ? "block" : "none" }}>
        {visited.has("sync") && <SyncMonitorTab />}
      </div>
    </div>
  );
}

export default function ImportExportHubPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <ImportExportHubContent />
    </Suspense>
  );
}
