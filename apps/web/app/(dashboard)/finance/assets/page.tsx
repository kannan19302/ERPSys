"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  FileText,
  TrendingDown,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { RouteGuard } from "@unerp/framework";
import { Card, useToast } from "@unerp/ui";
import { apiGet } from "@/lib/api";

import FixedAssetsPage from "../advanced/fixed-assets/page";
import LeasesPage from "../advanced/leases/page";

interface AssetsSummary {
  totalValue: number;
  assetCount: number;
  monthlyDepreciation: number;
  activeLeases: number;
}

const EMPTY_ASSETS_SUMMARY: AssetsSummary = {
  totalValue: 0,
  assetCount: 0,
  monthlyDepreciation: 0,
  activeLeases: 0,
};

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
  const { error: notifyError } = useToast();
  const [summary, setSummary] = useState<AssetsSummary>(EMPTY_ASSETS_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "overview") return;
    let cancelled = false;
    Promise.all([
      apiGet<
        Array<{ currentValue: number; usefulLifeYears: number; status: string }>
      >("/fixed-assets"),
      apiGet<{ activeLeases: number }>("/finance/leases/summary").catch(() => ({
        activeLeases: 0,
      })),
    ])
      .then(([assets, leaseSummary]) => {
        if (cancelled) return;
        const activeAssets = assets.filter((a) => a.status === "ACTIVE");
        const totalValue = assets.reduce(
          (s, a) => s + Number(a.currentValue || 0),
          0,
        );
        const monthlyDepreciation = activeAssets.reduce((s, a) => {
          const value = Number(a.currentValue || 0);
          const life = Number(a.usefulLifeYears || 0);
          return s + (life > 0 ? value / life / 12 : 0);
        }, 0);
        setSummary({
          totalValue,
          assetCount: assets.length,
          monthlyDepreciation,
          activeLeases: leaseSummary?.activeLeases ?? 0,
        });
        setSummaryError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load assets summary";
        setSummaryError(message);
        notifyError("Failed to load Assets summary", message);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, notifyError]);

  return (
    <RouteGuard permission="finance.assets.read">
      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          {summaryError && (
            <div className="ui-alert ui-alert-danger">
              <AlertTriangle size={16} />
              Failed to load assets summary — figures below may be stale.{" "}
              {summaryError}
            </div>
          )}
          <div className="ui-grid-3">
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Total Asset Value</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-primary)" }}
                >
                  {summary.totalValue.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  {summary.assetCount} assets registered
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Monthly Depreciation</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-warning)" }}
                >
                  {summary.monthlyDepreciation.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
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
                  {summary.activeLeases}
                </p>
                <p className="ui-text-xs-muted">ASC 842 / IFRS 16</p>
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
    </RouteGuard>
  );
}
