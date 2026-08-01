"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, PageHeader, DataTable, Spinner } from "@unerp/ui";
import {
  Package,
  ShoppingCart,
  X,
  Check,
  RefreshCw,
  DollarSign,
  Star,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { SubTabBar } from "@/components/saas/SubTabBar";

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: "month" | "year" | "one-time";
  category: string;
  features: string[];
  isPurchased: boolean;
}

function SaasAddonsPageContent() {
  const searchParams = useSearchParams();
  const activeTab: "available" | "purchased" =
    searchParams.get("subtab") === "purchased" ? "purchased" : "available";
  const client = useApiClient();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await client.get<Addon[]>("/saas/addons").catch(() => []);
      setAddons(res || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePurchase = async (addonId: string) => {
    setActionInProgress(addonId);
    try {
      await client.post(`/saas/addons/${addonId}/purchase`);
      loadData();
    } catch {
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRemove = async (addonId: string) => {
    setActionInProgress(addonId);
    try {
      await client.post(`/saas/addons/${addonId}/remove`);
      loadData();
    } catch {
    } finally {
      setActionInProgress(null);
    }
  };

  const formatPrice = (p: number, currency: string, period: string) => {
    const symbol =
      currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
    const periodLabel = period === "one-time" ? "one-time" : `/${period}`;
    return `${symbol}${p.toFixed(2)}${periodLabel}`;
  };

  const availableAddons = addons.filter((a) => !a.isPurchased);
  const purchasedAddons = addons.filter((a) => a.isPurchased);

  return (
    <RouteGuard permission="saas.addons.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Add-ons Marketplace"
          description="Browse and purchase additional features for your workspace."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Add-ons" },
          ]}
        />

        <SubTabBar
          tabs={[
            {
              id: "available",
              label: `Available (${availableAddons.length})`,
              href: "/saas/addons?subtab=available",
              icon: Package,
            },
            {
              id: "purchased",
              label: `Purchased (${purchasedAddons.length})`,
              href: "/saas/addons?subtab=purchased",
              icon: Check,
            },
          ]}
        />

        <div className="ui-tab-content">
          {activeTab === "available" && (
            <div className="ui-grid-auto-lg">
              {availableAddons.length === 0 && !loading && (
                <Card padding="lg" style={{ gridColumn: "1 / -1" }}>
                  <div className="ui-empty-state">
                    <Package size={32} className="ui-empty-state-icon" />
                    <h4 className="ui-empty-state-title">
                      No add-ons available
                    </h4>
                    <p className="ui-empty-state-text">
                      All add-ons have been purchased or none are currently
                      available.
                    </p>
                  </div>
                </Card>
              )}
              {availableAddons.map((addon) => (
                <Card
                  key={addon.id}
                  className="ui-card-clickable"
                  padding="lg"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <div className="ui-flex-between ui-mb-2">
                    <span className="ui-badge ui-badge-info">
                      {addon.category}
                    </span>
                    <span className="font-semibold text-sm">
                      {formatPrice(
                        addon.price,
                        addon.currency,
                        addon.billingPeriod,
                      )}
                    </span>
                  </div>
                  <h4 className="ui-heading-base ui-mb-1">{addon.name}</h4>
                  <p className="ui-text-xs-muted ui-mb-3" style={{ flex: 1 }}>
                    {addon.description}
                  </p>
                  <ul className="ui-stack-1 ui-mb-4">
                    {addon.features.map((f, idx) => (
                      <li key={idx} className="ui-hstack-2 text-xs">
                        <Check size={12} className="ui-text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="ui-btn ui-btn-primary"
                    onClick={() => handlePurchase(addon.id)}
                    disabled={actionInProgress === addon.id}
                  >
                    {actionInProgress === addon.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={14} />
                    )}
                    {actionInProgress === addon.id
                      ? "Processing..."
                      : `Purchase - ${formatPrice(addon.price, addon.currency, addon.billingPeriod)}`}
                  </button>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "purchased" && (
            <>
              {purchasedAddons.length === 0 && !loading && (
                <Card padding="lg">
                  <div className="ui-empty-state">
                    <Package size={32} className="ui-empty-state-icon" />
                    <h4 className="ui-empty-state-title">
                      No purchased add-ons
                    </h4>
                    <p className="ui-empty-state-text">
                      Browse the marketplace and purchase add-ons to extend your
                      workspace.
                    </p>
                  </div>
                </Card>
              )}
              <div className="ui-grid-auto-lg">
                {purchasedAddons.map((addon) => (
                  <Card
                    key={addon.id}
                    padding="lg"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <div className="ui-flex-between ui-mb-2">
                      <span className="ui-badge ui-badge-success">
                        Purchased
                      </span>
                      <span className="font-semibold text-sm">
                        {formatPrice(
                          addon.price,
                          addon.currency,
                          addon.billingPeriod,
                        )}
                      </span>
                    </div>
                    <h4 className="ui-heading-base ui-mb-1">{addon.name}</h4>
                    <p className="ui-text-xs-muted ui-mb-3" style={{ flex: 1 }}>
                      {addon.description}
                    </p>
                    <ul className="ui-stack-1 ui-mb-4">
                      {addon.features.map((f, idx) => (
                        <li key={idx} className="ui-hstack-2 text-xs">
                          <Star size={12} className="ui-text-warning" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="ui-btn ui-btn-danger"
                      onClick={() => handleRemove(addon.id)}
                      disabled={actionInProgress === addon.id}
                    >
                      {actionInProgress === addon.id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                      {actionInProgress === addon.id ? "Removing..." : "Remove"}
                    </button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}

export default function SaasAddonsPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <SaasAddonsPageContent />
    </Suspense>
  );
}
