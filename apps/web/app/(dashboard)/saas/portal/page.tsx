"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader, DashboardKPICard, DashboardChart } from "@unerp/ui";
import {
  Users,
  HardDrive,
  Zap,
  CheckCircle,
  ArrowRight,
  Crown,
  X,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  UserPlus,
  Settings,
  Package,
  LayoutDashboard,
  ImageIcon,
  CreditCard,
  Building,
  LayoutGrid,
  FileText,
  Key,
  Shield,
  Headphones,
  Globe,
  Webhook,
  Download,
  BarChart3,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { InviteTeamSection } from "./InviteTeamSection";
import { OnboardingChecklist } from "../../../../src/components/OnboardingChecklist";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  maxUsers: number;
  maxStorageMb: number;
  maxApiCalls: number;
  features: string[];
  isCurrent: boolean;
  recommended: boolean;
}

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  price: number;
  currency: string;
  interval: string;
}

interface UsageRecord {
  metric: string;
  currentValue: number;
  limitValue: number;
}

/* ------------------------------------------------------------------ */
/*  Feature matrix for plan comparison                                 */
/* ------------------------------------------------------------------ */

const FEATURE_MATRIX = [
  { feature: "Core Modules", starter: true, growth: true, enterprise: true },
  { feature: "Email Support", starter: true, growth: true, enterprise: true },
  {
    feature: "Priority Support",
    starter: false,
    growth: true,
    enterprise: true,
  },
  {
    feature: "Dedicated Support",
    starter: false,
    growth: false,
    enterprise: true,
  },
  {
    feature: "API Keys",
    starter: "5",
    growth: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Advanced Reporting",
    starter: false,
    growth: true,
    enterprise: true,
  },
  {
    feature: "Workflow Engine",
    starter: false,
    growth: true,
    enterprise: true,
  },
  {
    feature: "Custom Integrations",
    starter: false,
    growth: true,
    enterprise: true,
  },
  { feature: "SLA 99.9%", starter: false, growth: false, enterprise: true },
  {
    feature: "Custom Branding",
    starter: false,
    growth: false,
    enterprise: true,
  },
  { feature: "SSO / SAML", starter: false, growth: false, enterprise: true },
  {
    feature: "Audit Compliance",
    starter: false,
    growth: false,
    enterprise: true,
  },
  { feature: "Multi-Region", starter: false, growth: false, enterprise: true },
];

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

const mapPlan = (p: any, currentPlanId?: string): Plan => ({
  id: p.id,
  name: p.name,
  price: p.price || 0,
  currency: p.currency || "USD",
  interval: p.interval || "month",
  maxUsers: p.maxUsers || 0,
  maxStorageMb: p.maxStorage || 0,
  maxApiCalls: p.maxApiCalls || 0,
  features: Array.isArray(p.features) ? p.features.map((f: any) => typeof f === "string" ? f : f.featureName || f.name || "") : [],
  isCurrent: p.id === currentPlanId,
  recommended: false,
});

const mapUsageFromSummary = (summary: any): UsageRecord[] => {
  if (!summary) return [];
  const records: UsageRecord[] = [];
  if (summary.users) {
    records.push({ metric: "USERS_COUNT", currentValue: summary.users.current || 0, limitValue: summary.users.limit || 1 });
  }
  if (summary.storage) {
    records.push({ metric: "STORAGE_MB", currentValue: summary.storage.current || 0, limitValue: summary.storage.limit || 1 });
  }
  if (summary.apiCalls) {
    records.push({ metric: "API_CALLS_COUNT", currentValue: summary.apiCalls.current || 0, limitValue: summary.apiCalls.limit || 1 });
  }
  return records;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const USAGE_META: Record<
  string,
  { label: string; icon: React.ComponentType<any>; color: string }
> = {
  USERS_COUNT: {
    label: "Active Users",
    icon: Users,
    color: "var(--color-primary)",
  },
  STORAGE_MB: {
    label: "Storage Used",
    icon: HardDrive,
    color: "var(--color-warning)",
  },
  API_CALLS_COUNT: {
    label: "API Calls (Month)",
    icon: Zap,
    color: "var(--color-success)",
  },
};

export default function SaasPortalPage() {
  const client = useApiClient();
  const router = useRouter();
  const [isOnboarding, setIsOnboarding] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnboarding(
      new URLSearchParams(window.location.search).get("onboarding") === "1",
    );
  }, []);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [appUsage, setAppUsage] = useState<
    Array<{ appSlug: string; rowCount: number; estimatedMb: number }>
  >([]);
  // Read-only status count for the "Installed Apps" card below — actual
  // install/uninstall/enable-disable management lives in the App Store
  // (/apps/store), not here (Phase 4 of the settings-to-SaaS-Portal migration).
  const [installedAppCount, setInstalledAppCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showComparison, setShowComparison] = useState(true);
  const [upgradeTarget, setUpgradeTarget] = useState<Plan | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month",
  );

  /* Fetch real data on mount */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [plansRes, subRes, usageRes, storageRes, installedRes] = await Promise.all([
        client.get<any[]>("/saas/plans").catch(() => null),
        client.get<any>("/saas/subscription").catch(() => null),
        client.get<any>("/saas/usage/current").catch(() => null),
        client
          .get<
            Array<{ appSlug: string; rowCount: number; estimatedBytes: string }>
          >("/saas/storage-usage")
          .catch(() => null),
        client.get<string[]>("/saas/installed-apps").catch(() => null),
      ]);

      if (installedRes) {
        setInstalledAppCount(installedRes.length);
      }

      if (storageRes && storageRes.length > 0) {
        setAppUsage(
          storageRes.map((a: any) => ({
            appSlug: a.appSlug,
            rowCount: a.rowCount,
            estimatedMb: Math.round(
              Number(a.estimatedBytes) / (1024 * 1024),
            ),
          })),
        );
      }

      if (subRes) {
        const mappedSub: Subscription = {
          id: subRes.id,
          planId: subRes.planId || subRes.plan?.id || "",
          planName: subRes.planName || subRes.plan?.name || "Unknown",
          status: subRes.status || "ACTIVE",
          currentPeriodStart: subRes.currentPeriodStart || new Date().toISOString(),
          currentPeriodEnd: subRes.currentPeriodEnd || new Date(Date.now() + 30 * 86400000).toISOString(),
          trialEndsAt: subRes.trialEndsAt || null,
          price: subRes.price || subRes.plan?.price || 0,
          currency: subRes.currency || "USD",
          interval: subRes.interval || "month",
        };
        setSubscription(mappedSub);

        if (plansRes && plansRes.length > 0) {
          setPlans(plansRes.map((p: any) => mapPlan(p, mappedSub.planId)));
        }
      } else if (plansRes && plansRes.length > 0) {
        setPlans(plansRes.map((p: any) => mapPlan(p)));
      }

      if (usageRes) {
        setUsage(mapUsageFromSummary(usageRes));
      }
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* Auto-refresh every 60s */
  useEffect(() => {
    if (upgradeTarget) return;
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData, upgradeTarget]);

  /* Helpers */
  const formatStorage = (mb: number) =>
    mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
  const formatPrice = (p: number) => `$${p}`;

  const currentPlan = plans.find((p) => p.isCurrent) || plans[0] || null;

  const handleUpgrade = async () => {
    if (!upgradeTarget) return;
    setUpgrading(true);
    try {
      const res = await client.post<{ url: string }>("/billing/checkout", {
        planId: upgradeTarget.id,
        successUrl: window.location.origin + "/saas/portal?success=true",
        couponCode: couponCode || undefined,
      });
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        await loadData();
      }
    } catch {
      // Local state update fallback
      setSubscription((prev) =>
        prev
          ? {
              ...prev,
              planId: upgradeTarget.id,
              planName: upgradeTarget.name,
              price: upgradeTarget.price,
            }
          : null,
      );
      setPlans((prev) =>
        prev.map((p) => ({
          ...p,
          isCurrent: p.id === upgradeTarget.id,
        })),
      );
    } finally {
      setUpgrading(false);
      setUpgradeTarget(null);
    }
  };

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.trialEndsAt).getTime() - Date.now()) /
            86400000,
        ),
      )
    : 0;

  // Compute charts
  const usageChartData = useMemo(() => {
    return usage.map((u) => {
      const meta = USAGE_META[u.metric];
      const pct =
        u.limitValue > 0
          ? Math.round((u.currentValue / u.limitValue) * 100)
          : 0;
      return {
        name: meta?.label || u.metric,
        Used: pct,
        Remaining: Math.max(0, 100 - pct),
      };
    });
  }, [usage]);

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      ACTIVE: { label: "Active", cls: "ui-badge-success" },
      TRIAL: { label: "Trial", cls: "ui-badge-warning" },
      PAST_DUE: { label: "Past Due", cls: "ui-badge-danger" },
      CANCELLED: { label: "Cancelled", cls: "ui-badge-neutral" },
    };
    const s = map[status] || { label: status, cls: "ui-badge-neutral" };
    return <span className={`ui-badge ${s.cls}`}>{s.label}</span>;
  };

  if (!subscription) {
    return (
      <div className="ui-stack-6">
        <PageHeader
          title="SaaS Portal & Subscription"
          description="Manage your subscription plan, monitor resource usage, and configure billing preferences."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Portal" },
          ]}
        />
        {loading ? (
          <Card padding="lg">
            <div className="ui-stack-4">
              <div className="ui-skeleton" style={{ height: 24, width: "60%", borderRadius: "var(--radius-md)" }} />
              <div className="ui-skeleton" style={{ height: 16, width: "40%", borderRadius: "var(--radius-md)" }} />
              <div className="ui-grid-3" style={{ marginTop: "var(--space-4)" }}>
                <div className="ui-skeleton" style={{ height: 100, borderRadius: "var(--radius-lg)" }} />
                <div className="ui-skeleton" style={{ height: 100, borderRadius: "var(--radius-lg)" }} />
                <div className="ui-skeleton" style={{ height: 100, borderRadius: "var(--radius-lg)" }} />
              </div>
            </div>
          </Card>
        ) : (
          <Card padding="lg" className={styles.s1}>
            <div className="ui-stack-4" style={{ alignItems: "center", padding: "var(--space-8) 0" }}>
              <AlertTriangle size={32} className="ui-text-warning" />
              <p>Could not load subscription data.</p>
              <button className="ui-btn ui-btn-primary" onClick={loadData}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <RouteGuard permission="saas.portal.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="SaaS Portal & Subscription"
          description="Manage your subscription plan, monitor resource usage, and configure billing preferences."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Portal" },
          ]}
        />

        {/* Portal Navigation */}
        <div className={styles.portalNav}>
          <Link href="/saas/billing" className={styles.portalNavCard}>
            <CreditCard size={20} />
            <span>Billing</span>
          </Link>
          <Link href="/saas/usage" className={styles.portalNavCard}>
            <BarChart3 size={20} />
            <span>Usage</span>
          </Link>
          <Link href="/saas/team" className={styles.portalNavCard}>
            <Users size={20} />
            <span>Team</span>
          </Link>
          <Link href="/saas/api-keys" className={styles.portalNavCard}>
            <Key size={20} />
            <span>API Keys</span>
          </Link>
          <Link href="/saas/audit-log" className={styles.portalNavCard}>
            <Shield size={20} />
            <span>Audit Log</span>
          </Link>
          <Link href="/saas/support" className={styles.portalNavCard}>
            <Headphones size={20} />
            <span>Support</span>
          </Link>
          <Link href="/saas/settings" className={styles.portalNavCard}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <Link href="/saas/webhooks" className={styles.portalNavCard}>
            <Webhook size={20} />
            <span>Webhooks</span>
          </Link>
          <Link href="/saas/exports" className={styles.portalNavCard}>
            <Download size={20} />
            <span>Exports</span>
          </Link>
          <Link href="/saas/addons" className={styles.portalNavCard}>
            <Package size={20} />
            <span>Add-ons</span>
          </Link>
          <Link href="/saas/admin" className={styles.portalNavCard}>
            <Building size={20} />
            <span>Admin</span>
          </Link>
        </div>

        {isOnboarding && (
          <Card padding="lg">
            <div className={styles.onboardingHeader}>
              <div className="ui-hstack-3">
                <div className={styles.onboardingIcon}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className={styles.onboardingTitle}>
                    Welcome! Your 30-day free trial has started.
                  </h3>
                  <p className="ui-text-xs-muted">
                    Complete these steps to get the most out of UniERP. Every
                    feature is unlocked during your trial.
                  </p>
                </div>
              </div>
              <button
                className="ui-btn ui-btn-secondary"
                onClick={() => router.push("/apps")}
              >
                Go to Dashboard <ArrowRight size={14} />
              </button>
            </div>

            <OnboardingChecklist variant="full" onDemoDataSeeded={loadData} />

        {/* Last Updated */}
        {lastUpdated && (
          <div className="ui-flex-end">
            <span className="ui-text-xs-muted">
              Last updated: {lastUpdated.toLocaleTimeString()}{" "}
              <button onClick={loadData} className="ui-btn-icon" title="Refresh now" style={{ verticalAlign: "middle" }}>
                <RefreshCw size={12} />
              </button>
            </span>
          </div>
        )}

        {isOnboarding && (
              <div className="mt-6 pt-6 border-t border-border flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm text-muted-foreground mb-4">
                  All set? Start using your ERP system now.
                </p>
                <Link
                  href="/apps"
                  className="ui-btn ui-btn-primary w-full md:w-auto shadow-md"
                >
                  <LayoutGrid size={16} className="mr-2" />
                  Go to Apps Dashboard
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>
            )}
          </Card>
        )}

        {/* Trial Banner */}
        {subscription.status === "TRIAL" && (
          <div className={styles.s4}>
            <div className="ui-hstack-3">
              <Clock size={20} className="ui-text-warning" />
              <div>
                <div className="ui-heading-sm">
                  Trial Period — {trialDaysLeft} day
                  {trialDaysLeft !== 1 ? "s" : ""} remaining
                </div>
                <div className="ui-text-xs-muted">
                  Your trial expires on{" "}
                  {new Date(subscription.trialEndsAt!).toLocaleDateString()}.
                  Upgrade to keep your data.
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                setUpgradeTarget(
                  plans.find(
                    (p) => !p.isCurrent && p.price > (currentPlan?.price || 0),
                  ) || null,
                )
              }
              className={styles.s5}
            >
              Upgrade Now
            </button>
          </div>
        )}

        {/* Current Plan Banner */}
        <div className={styles.s6}>
          <div className={styles.s7} />
          <div className={styles.s8}>
            <div>
              <div className={styles.s9}>
                <Crown size={18} />
                <span className={styles.s10}>Current Plan</span>
                {statusBadge(subscription.status)}
                {subscription.status === "TRIAL" && (
                  <span className={styles.s11}>{trialDaysLeft}d left</span>
                )}
              </div>
              <h2 className={styles.s12}>{subscription.planName} Plan</h2>
              <p className={styles.s13}>
                {formatPrice(subscription.price)}/{subscription.interval} ·
                {subscription.status === "TRIAL" && subscription.trialEndsAt
                  ? ` Trial ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}`
                  : ` Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                }
              </p>
            </div>
            <div className="ui-flex ui-gap-2">
              <Link href="/saas/billing" className={styles.s14}>Manage Billing</Link>
              <button
                onClick={() =>
                  setUpgradeTarget(
                    plans.find(
                      (p) =>
                        !p.isCurrent && p.price > (currentPlan?.price || 0),
                    ) || null,
                  )
                }
                className={styles.s15}
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <Link href="/saas/billing" className={styles.quickActionCard}>
            <CreditCard size={18} />
            <div>
              <span className={styles.quickActionLabel}>Billing & Invoices</span>
              <span className={styles.quickActionDesc}>View payment history</span>
            </div>
          </Link>
          <Link href="/saas/team" className={styles.quickActionCard}>
            <UserPlus size={18} />
            <div>
              <span className={styles.quickActionLabel}>Invite Team</span>
              <span className={styles.quickActionDesc}>Add team members</span>
            </div>
          </Link>
          <Link href="/saas/support" className={styles.quickActionCard}>
            <Headphones size={18} />
            <div>
              <span className={styles.quickActionLabel}>Get Support</span>
              <span className={styles.quickActionDesc}>Open a ticket</span>
            </div>
          </Link>
          <Link href="/saas/api-keys" className={styles.quickActionCard}>
            <Key size={18} />
            <div>
              <span className={styles.quickActionLabel}>API Keys</span>
              <span className={styles.quickActionDesc}>Manage integrations</span>
            </div>
          </Link>
          <Link href="/saas/settings" className={styles.quickActionCard}>
            <Settings size={18} />
            <div>
              <span className={styles.quickActionLabel}>Settings</span>
              <span className={styles.quickActionDesc}>Branding & domains</span>
            </div>
          </Link>
          <Link href="/saas/webhooks" className={styles.quickActionCard}>
            <Webhook size={18} />
            <div>
              <span className={styles.quickActionLabel}>Webhooks</span>
              <span className={styles.quickActionDesc}>Event notifications</span>
            </div>
          </Link>
        </div>

        {/* Installed Apps — read-only status; manage installs/uninstalls in the App Store */}
        <Card padding="lg" className={styles.s1}>
          <div className="ui-flex-between">
            <div className="ui-hstack-3">
              <ShoppingBag size={18} className="ui-text-muted" />
              <div>
                <h4 className="ui-heading-md m-0">Installed Apps</h4>
                <p className="ui-text-xs-muted m-0">
                  {installedAppCount === null
                    ? "Loading installed app count…"
                    : `${installedAppCount} app${installedAppCount === 1 ? "" : "s"} installed on this workspace`}
                </p>
              </div>
            </div>
            <Link href="/apps/store" className="ui-btn ui-btn-secondary ui-text-sm">
              Manage in App Store <ChevronRight size={14} />
            </Link>
          </div>
        </Card>

        {/* Resource Usage Grid */}
        <h3 className={styles.s16}>Resource Usage Analysis</h3>
        <div className={styles.s17}>
          {usage.map((u) => {
            const meta = USAGE_META[u.metric];
            if (!meta) return null;
            const pct =
              u.limitValue > 0 ? (u.currentValue / u.limitValue) * 100 : 0;
            const displayCurrent =
              u.metric === "STORAGE_MB"
                ? formatStorage(u.currentValue)
                : u.currentValue.toLocaleString();
            const displayLimit =
              u.metric === "STORAGE_MB"
                ? formatStorage(u.limitValue)
                : u.limitValue.toLocaleString();
            const Icon = meta.icon;

            return (
              <DashboardKPICard
                key={u.metric}
                title={meta.label}
                value={`${displayCurrent} / ${displayLimit}`}
                icon={<Icon size={18} style={{ color: meta.color }} />}
                color={meta.color}
                progress={pct}
                changeLabel={
                  pct > 85 ? "Warning: High usage" : "Healthy status"
                }
              />
            );
          })}
        </div>

        {/* Per-App Storage Breakdown */}
        {appUsage.length > 0 && (
          <Card padding="lg" className={styles.s1}>
            <h4 className="ui-heading-md">Storage by App</h4>
            <p className="ui-text-xs-muted mb-4">
              Estimated storage per installed app. Uninstalling an app preserves
              its data — delete or export records to free space.
            </p>
            <div className="ui-stack-2">
              {appUsage.map((a) => (
                <div
                  key={a.appSlug}
                  className="ui-flex-between ui-py-2 ui-border-b ui-border-border/30"
                >
                  <div className="ui-hstack-2">
                    <HardDrive size={14} className="ui-text-muted" />
                    <span className="capitalize font-medium">
                      {a.appSlug}
                    </span>
                  </div>
                  <div className="ui-hstack-3">
                    <span className="text-xs text-muted-foreground">
                      {a.rowCount.toLocaleString()} rows
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {a.estimatedMb >= 1024
                        ? `${(a.estimatedMb / 1024).toFixed(1)} GB`
                        : `${a.estimatedMb} MB`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className={styles.s18}>
          <DashboardChart
            title="Tenant Resource Limits Allocation (%)"
            subtitle="Proportion of resources allocated vs remaining limits"
            data={usageChartData}
            config={{
              xAxisKey: "name",
              series: [
                {
                  dataKey: "Used",
                  name: "Used %",
                  color: "var(--color-primary)",
                },
                {
                  dataKey: "Remaining",
                  name: "Remaining %",
                  color: "var(--color-border)",
                },
              ],
            }}
            defaultChartType="stacked-bar"
            allowedChartTypes={["stacked-bar", "bar"]}
            height={260}
          />
        </div>

        {/* Invite Team Section */}
        <div id="invite-section">
          <InviteTeamSection maxSeats={currentPlan?.maxUsers || 5} />
        </div>

        {/* Plans */}
        <div id="plans-section" className={styles.s19}>
          <h3 className={styles.s16}>Available Plans</h3>
          <div className={styles.billingToggle}>
            <button
              className={`${styles.billingToggleBtn} ${billingInterval === "month" ? styles.billingToggleBtnActive : ""}`}
              onClick={() => setBillingInterval("month")}
            >
              Monthly
            </button>
            <button
              className={`${styles.billingToggleBtn} ${billingInterval === "year" ? styles.billingToggleBtnActive : ""}`}
              onClick={() => setBillingInterval("year")}
            >
              Annual <span className={styles.discountBadge}>Save 20%</span>
            </button>
          </div>
        </div>

        <div className={styles.s21}>
          {plans.map((plan) => (
            <Card
              key={plan.id}
              padding="lg"
              style={{
                border: plan.isCurrent
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
              }}
              className={styles.s22}
            >
              {plan.isCurrent && <div className={styles.s23}>Current</div>}
              <h4 className={styles.s24}>{plan.name}</h4>
              <div className={styles.s25}>
                <span className="text-2xl">
                  {formatPrice(
                    billingInterval === "year"
                      ? Math.round(plan.price * 12 * 0.8)
                      : plan.price,
                  )}
                </span>
                <span className="ui-text-xs-muted">
                  /{billingInterval === "year" ? "year" : plan.interval}
                </span>
                {billingInterval === "year" && plan.price > 0 && (
                  <span className={styles.annualNote}>
                    (${plan.price * 12}/yr → save $
                    {Math.round(plan.price * 12 * 0.2)})
                  </span>
                )}
              </div>

              <ul className={styles.s26}>
                <li>Up to {plan.maxUsers} Users</li>
                <li>{formatStorage(plan.maxStorageMb)} Storage</li>
                <li>{plan.maxApiCalls.toLocaleString()} API Calls</li>
                {plan.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>

              <button
                onClick={() => setUpgradeTarget(plan)}
                disabled={plan.isCurrent}
                style={{
                  background: plan.isCurrent
                    ? "var(--color-bg-sunken)"
                    : "var(--color-primary)",
                  color: plan.isCurrent
                    ? "var(--color-text-tertiary)"
                    : "var(--color-bg-elevated)",
                  cursor: plan.isCurrent ? "default" : "pointer",
                }}
                className={styles.s27}
              >
                {plan.isCurrent ? "Active Subscription" : `Choose ${plan.name}`}
              </button>
            </Card>
          ))}
        </div>

        {/* Modal Confirm upgrade */}
        {upgradeTarget && (
          <div className={styles.s28}>
            <div className={styles.s29}>
              <div className={styles.s30}>
                <h3 className={styles.s31}>Confirm Plan Upgrade</h3>
                <button
                  onClick={() => setUpgradeTarget(null)}
                  className="ui-btn-icon ui-text-muted"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 ui-stack-4">
                <p className={styles.s32}>
                  You are upgrading to the <strong>{upgradeTarget.name}</strong>{" "}
                  plan at{" "}
                  <strong>
                    {formatPrice(upgradeTarget.price)}/{upgradeTarget.interval}
                  </strong>
                  . Your credit card on file will be charged immediately,
                  prorated for the rest of this billing period.
                </p>

                <div
                  style={{
                    marginTop: "var(--space-2)",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  <label
                    className="ui-text-sm ui-text-muted"
                    style={{ display: "block", marginBottom: "var(--space-1)" }}
                  >
                    Promo/Coupon Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUMMER20"
                    className="ui-input"
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                    }}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>

                <div className="ui-flex-end ui-gap-2">
                  <button
                    onClick={() => setUpgradeTarget(null)}
                    className={styles.s33}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className={styles.s34}
                  >
                    {upgrading ? "Processing..." : "Confirm Upgrade"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Comparison matrix — always visible */}
        <div className={styles.s35}>
          <h3 className={styles.s16} style={{ marginBottom: "var(--space-3)" }}>
            Feature Comparison
          </h3>
          <table className={styles.s36}>
            <thead>
              <tr className={styles.s37}>
                <th className={styles.s38}>Features</th>
                <th className={styles.s38}>Starter</th>
                <th className={styles.s38}>Growth</th>
                <th className={styles.s38}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className={styles.s39}>{row.feature}</td>
                  <td className={styles.s40}>
                    {typeof row.starter === "boolean" ? (
                      row.starter ? (
                        <CheckCircle size={16} className="ui-text-success" />
                      ) : (
                        "-"
                      )
                    ) : (
                      row.starter
                    )}
                  </td>
                  <td className={styles.s40}>
                    {typeof row.growth === "boolean" ? (
                      row.growth ? (
                        <CheckCircle size={16} className="ui-text-success" />
                      ) : (
                        "-"
                      )
                    ) : (
                      row.growth
                    )}
                  </td>
                  <td className={styles.s40}>
                    {typeof row.enterprise === "boolean" ? (
                      row.enterprise ? (
                        <CheckCircle size={16} className="ui-text-success" />
                      ) : (
                        "-"
                      )
                    ) : (
                      row.enterprise
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Go to Dashboard CTA */}
        <Card>
          <div className={styles.dashboardCta}>
            <div>
              <h3 className="ui-heading-sm">Ready to get started?</h3>
              <p className="ui-text-xs-muted">
                Your workspace is fully set up. Jump into your apps and start
                working.
              </p>
            </div>
            <Link href="/apps" className={styles.dashboardCtaBtn}>
              <LayoutDashboard size={16} />
              Go to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    </RouteGuard>
  );
}
