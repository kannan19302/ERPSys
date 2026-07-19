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

/* ------------------------------------------------------------------ */
/*  Mock fallbacks                                                     */
/* ------------------------------------------------------------------ */

const MOCK_PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    currency: "USD",
    interval: "month",
    maxUsers: 5,
    maxStorageMb: 1024,
    maxApiCalls: 5000,
    features: ["Core Modules", "Email Support", "5 API Keys", "Basic Reports"],
    isCurrent: false,
    recommended: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 99,
    currency: "USD",
    interval: "month",
    maxUsers: 50,
    maxStorageMb: 10240,
    maxApiCalls: 100000,
    features: [
      "All Modules",
      "Priority Support",
      "Unlimited API Keys",
      "Advanced Reporting",
      "Workflow Engine",
      "Custom Integrations",
    ],
    isCurrent: true,
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    currency: "USD",
    interval: "month",
    maxUsers: 500,
    maxStorageMb: 102400,
    maxApiCalls: 1000000,
    features: [
      "Everything in Growth",
      "Dedicated Support",
      "SLA 99.9%",
      "Custom Branding",
      "SSO/SAML",
      "Audit Compliance",
      "Multi-Region",
    ],
    isCurrent: false,
    recommended: false,
  },
];

const MOCK_SUBSCRIPTION: Subscription = {
  id: "sub-mock",
  planId: "growth",
  planName: "Growth",
  status: "ACTIVE",
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
  trialEndsAt: null,
  price: 99,
  currency: "USD",
  interval: "month",
};

const MOCK_USAGE: UsageRecord[] = [
  { metric: "USERS_COUNT", currentValue: 12, limitValue: 50 },
  { metric: "STORAGE_MB", currentValue: 2048, limitValue: 10240 },
  { metric: "API_CALLS_COUNT", currentValue: 45000, limitValue: 100000 },
];

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
  // Read directly from the URL (no useSearchParams / Suspense boundary
  // needed) — set by the register page's post-signup redirect here.
  const [isOnboarding, setIsOnboarding] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnboarding(
      new URLSearchParams(window.location.search).get("onboarding") === "1",
    );
  }, []);
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [subscription, setSubscription] = useState<Subscription | null>(
    MOCK_SUBSCRIPTION,
  );
  const [usage, setUsage] = useState<UsageRecord[]>(MOCK_USAGE);
  const [loading, setLoading] = useState(true);
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
    try {
      const [plansRes, subRes, usageRes] = await Promise.all([
        client.get<Plan[]>("/saas/plans").catch(() => null),
        client.get<Subscription>("/saas/subscription").catch(() => null),
        client.get<UsageRecord[]>("/saas/usage").catch(() => null),
      ]);

      if (plansRes && plansRes.length > 0) {
        const mapped = plansRes.map((p: any) => ({
          ...p,
          isCurrent: subRes ? p.id === subRes.planId : false,
          recommended: subRes ? p.id === subRes.planId : false,
        }));
        setPlans(mapped);
      } else {
        setPlans(MOCK_PLANS);
      }

      if (subRes) {
        setSubscription(subRes);
      } else {
        setSubscription(MOCK_SUBSCRIPTION);
      }

      if (usageRes && usageRes.length > 0) {
        setUsage(usageRes);
      } else {
        setUsage(MOCK_USAGE);
      }
    } catch {
      setPlans(MOCK_PLANS);
      setSubscription(MOCK_SUBSCRIPTION);
      setUsage(MOCK_USAGE);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* Helpers */
  const formatStorage = (mb: number) =>
    mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
  const formatPrice = (p: number) => `$${p}`;

  const currentPlan = plans.find((p) => p.isCurrent) || plans[1];

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
        <Card className={styles.s1}>
          {loading ? (
            <span className={styles.s2}>
              <RefreshCw size={16} className={styles.s3} /> Loading subscription
              data…
            </span>
          ) : (
            "Could not load your subscription. Please refresh to try again."
          )}
        </Card>
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
                {subscription.status === "TRIAL" && (
                  <span className={styles.s11}>TRIAL</span>
                )}
              </div>
              <h2 className={styles.s12}>{subscription.planName} Plan</h2>
              <p className={styles.s13}>
                {formatPrice(subscription.price)}/{subscription.interval} ·
                Renews on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="ui-flex ui-gap-2">
              <button className={styles.s14}>Manage Billing</button>
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
