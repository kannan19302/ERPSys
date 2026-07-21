"use client";

import { useSearchParams } from "next/navigation";
import { Building2, FileText, TrendingDown, Trash2 } from "lucide-react";
import { FinanceTabLayout } from "@/components/finance/FinanceTabLayout";
import { RouteGuard } from "@unerp/framework";
import { Card } from "@unerp/ui";

import FixedAssetsPage from "../advanced/fixed-assets/page";
import LeasesPage from "../advanced/leases/page";

const ASSETS_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/assets",
    icon: Building2,
    description: "Asset management summary",
  },
  {
    id: "fixed-assets",
    label: "Fixed Assets",
    href: "/finance/assets?tab=fixed-assets",
    icon: Building2,
    description: "Fixed asset register",
  },
  {
    id: "lease-accounting",
    label: "Lease Accounting",
    href: "/finance/assets?tab=lease-accounting",
    icon: FileText,
    description: "ASC 842 / IFRS 16 lease management",
  },
  {
    id: "depreciation",
    label: "Depreciation",
    href: "/finance/assets?tab=depreciation",
    icon: TrendingDown,
    description: "Depreciation schedules and runs",
  },
  {
    id: "disposals",
    label: "Disposals",
    href: "/finance/assets?tab=disposals",
    icon: Trash2,
    description: "Asset disposal and retirement",
  },
];

export default function AssetsPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  return (
    <RouteGuard permission="finance.assets.read">
      <FinanceTabLayout
        tabs={ASSETS_TABS}
        moduleId="assets"
        moduleLabel="Assets"
        moduleIcon={Building2}
        moduleDescription="Fixed assets, lease accounting, depreciation, and disposals"
      >
        {activeTab === "overview" && (
          <div className="ui-stack-4 ui-animate-in">
            <div className="ui-grid-3">
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Total Asset Value</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-primary)" }}
                  >
                    $4.2M
                  </p>
                  <p className="ui-text-xs-muted">245 assets registered</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Monthly Depreciation</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-warning)" }}
                  >
                    $38,400
                  </p>
                  <p className="ui-text-xs-muted">Straight-line method</p>
                </div>
              </Card>
              <Card padding="md">
                <div className="ui-stack-2">
                  <p className="ui-text-xs-muted">Active Leases</p>
                  <p
                    className="ui-heading-sm"
                    style={{ color: "var(--color-success)" }}
                  >
                    12
                  </p>
                  <p className="ui-text-xs-muted">2 expiring this quarter</p>
                </div>
              </Card>
            </div>
            <FixedAssetsPage />
          </div>
        )}
        {activeTab === "fixed-assets" && (
          <div className="ui-stack-4 ui-animate-in">
            <FixedAssetsPage />
          </div>
        )}
        {activeTab === "lease-accounting" && (
          <div className="ui-stack-4 ui-animate-in">
            <LeasesPage />
          </div>
        )}
        {activeTab === "depreciation" && (
          <div className="ui-stack-4 ui-animate-in">
            <FixedAssetsPage />
          </div>
        )}
        {activeTab === "disposals" && (
          <div className="ui-stack-4 ui-animate-in">
            <FixedAssetsPage />
          </div>
        )}
      </FinanceTabLayout>
    </RouteGuard>
  );
}
