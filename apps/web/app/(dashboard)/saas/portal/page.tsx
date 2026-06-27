'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, PageHeader, DashboardKPICard, DashboardChart } from '@unerp/ui';
import { Users, HardDrive, Zap, CheckCircle, ArrowRight, Crown, X, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

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
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED';
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
  { feature: 'Core Modules', starter: true, growth: true, enterprise: true },
  { feature: 'Email Support', starter: true, growth: true, enterprise: true },
  { feature: 'Priority Support', starter: false, growth: true, enterprise: true },
  { feature: 'Dedicated Support', starter: false, growth: false, enterprise: true },
  { feature: 'API Keys', starter: '5', growth: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Advanced Reporting', starter: false, growth: true, enterprise: true },
  { feature: 'Workflow Engine', starter: false, growth: true, enterprise: true },
  { feature: 'Custom Integrations', starter: false, growth: true, enterprise: true },
  { feature: 'SLA 99.9%', starter: false, growth: false, enterprise: true },
  { feature: 'Custom Branding', starter: false, growth: false, enterprise: true },
  { feature: 'SSO / SAML', starter: false, growth: false, enterprise: true },
  { feature: 'Audit Compliance', starter: false, growth: false, enterprise: true },
  { feature: 'Multi-Region', starter: false, growth: false, enterprise: true },
];

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

const API_BASE = '/api/v1/saas';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Mock fallbacks                                                     */
/* ------------------------------------------------------------------ */

const MOCK_PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', price: 29, currency: 'USD', interval: 'month', maxUsers: 5, maxStorageMb: 1024, maxApiCalls: 5000, features: ['Core Modules', 'Email Support', '5 API Keys', 'Basic Reports'], isCurrent: false, recommended: false },
  { id: 'growth', name: 'Growth', price: 99, currency: 'USD', interval: 'month', maxUsers: 50, maxStorageMb: 10240, maxApiCalls: 100000, features: ['All Modules', 'Priority Support', 'Unlimited API Keys', 'Advanced Reporting', 'Workflow Engine', 'Custom Integrations'], isCurrent: true, recommended: true },
  { id: 'enterprise', name: 'Enterprise', price: 299, currency: 'USD', interval: 'month', maxUsers: 500, maxStorageMb: 102400, maxApiCalls: 1000000, features: ['Everything in Growth', 'Dedicated Support', 'SLA 99.9%', 'Custom Branding', 'SSO/SAML', 'Audit Compliance', 'Multi-Region'], isCurrent: false, recommended: false },
];

const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub-mock', planId: 'growth', planName: 'Growth', status: 'ACTIVE',
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
  trialEndsAt: null, price: 99, currency: 'USD', interval: 'month',
};

const MOCK_USAGE: UsageRecord[] = [
  { metric: 'USERS_COUNT', currentValue: 12, limitValue: 50 },
  { metric: 'STORAGE_MB', currentValue: 2048, limitValue: 10240 },
  { metric: 'API_CALLS_COUNT', currentValue: 45000, limitValue: 100000 },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const USAGE_META: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  USERS_COUNT: { label: 'Active Users', icon: Users, color: 'var(--color-primary)' },
  STORAGE_MB: { label: 'Storage Used', icon: HardDrive, color: 'var(--color-warning)' },
  API_CALLS_COUNT: { label: 'API Calls (Month)', icon: Zap, color: 'var(--color-success)' },
};

export default function SaasPortalPage() {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [subscription, setSubscription] = useState<Subscription | null>(MOCK_SUBSCRIPTION);
  const [usage, setUsage] = useState<UsageRecord[]>(MOCK_USAGE);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<Plan | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  /* Fetch real data on mount */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subRes, usageRes] = await Promise.all([
        apiFetch<any[]>('/plans').catch(() => null),
        apiFetch<Subscription>('/subscription').catch(() => null),
        apiFetch<UsageRecord[]>('/usage').catch(() => null),
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
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* Helpers */
  const formatStorage = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`);
  const formatPrice = (p: number) => `$${p}`;

  const currentPlan = plans.find((p) => p.isCurrent) || plans[1];

  const handleUpgrade = async () => {
    if (!upgradeTarget) return;
    setUpgrading(true);
    try {
      await apiFetch('/subscribe', { method: 'POST', body: JSON.stringify({ planId: upgradeTarget.id }) });
      await loadData();
    } catch {
      // Local state update fallback
      setSubscription(prev => prev ? {
        ...prev,
        planId: upgradeTarget.id,
        planName: upgradeTarget.name,
        price: upgradeTarget.price
      } : null);
      setPlans(prev => prev.map(p => ({
        ...p,
        isCurrent: p.id === upgradeTarget.id
      })));
    } finally {
      setUpgrading(false);
      setUpgradeTarget(null);
    }
  };

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  // Compute charts
  const usageChartData = useMemo(() => {
    return usage.map(u => {
      const meta = USAGE_META[u.metric];
      const pct = u.limitValue > 0 ? Math.round((u.currentValue / u.limitValue) * 100) : 0;
      return {
        name: meta?.label || u.metric,
        Used: pct,
        Remaining: Math.max(0, 100 - pct)
      };
    });
  }, [usage]);

  if (!subscription) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <PageHeader
          title="SaaS Portal & Subscription"
          description="Manage your subscription plan, monitor resource usage, and configure billing preferences."
          breadcrumbs={[{ label: 'SaaS', href: '/saas/portal' }, { label: 'Portal' }]}
        />
        <Card style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading subscription data…
            </span>
          ) : (
            'Could not load your subscription. Please refresh to try again.'
          )}
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="SaaS Portal & Subscription"
        description="Manage your subscription plan, monitor resource usage, and configure billing preferences."
        breadcrumbs={[{ label: 'SaaS', href: '/saas/portal' }, { label: 'Portal' }]}
      />

      {/* Trial Banner */}
      {subscription.status === 'TRIAL' && (
        <div style={{
          background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-6)',
          display: 'flex', alignItems: 'center', justifyItems: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Clock size={20} style={{ color: 'var(--color-warning)' }} />
            <div>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                Trial Period — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Your trial expires on {new Date(subscription.trialEndsAt!).toLocaleDateString()}. Upgrade to keep your data.
              </div>
            </div>
          </div>
          <button
            onClick={() => setUpgradeTarget(plans.find((p) => !p.isCurrent && p.price > (currentPlan?.price || 0)) || null)}
            style={{
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none',
              background: 'var(--color-warning)', color: '#fff', fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)', cursor: 'pointer',
            }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Current Plan Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #312e81, #4338ca, #6366f1)',
        borderRadius: 'var(--radius-xl)', padding: 'var(--space-6) var(--space-8)',
        color: 'var(--color-bg-elevated)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Crown size={18} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Current Plan</span>
              {subscription.status === 'TRIAL' && (
                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>TRIAL</span>
              )}
            </div>
            <h2 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
              {subscription.planName} Plan
            </h2>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', opacity: 0.8 }}>
              {formatPrice(subscription.price)}/{subscription.interval} · Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'var(--color-bg-elevated)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', cursor: 'pointer' }}>
              Manage Billing
            </button>
            <button
              onClick={() => setUpgradeTarget(plans.find((p) => !p.isCurrent && p.price > (currentPlan?.price || 0)) || null)}
              style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-bg-elevated)', color: '#4338ca', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Resource Usage Grid */}
      <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Resource Usage Analysis</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        {usage.map((u) => {
          const meta = USAGE_META[u.metric];
          if (!meta) return null;
          const pct = u.limitValue > 0 ? (u.currentValue / u.limitValue) * 100 : 0;
          const displayCurrent = u.metric === 'STORAGE_MB' ? formatStorage(u.currentValue) : u.currentValue.toLocaleString();
          const displayLimit = u.metric === 'STORAGE_MB' ? formatStorage(u.limitValue) : u.limitValue.toLocaleString();
          const Icon = meta.icon;

          return (
            <DashboardKPICard
              key={u.metric}
              title={meta.label}
              value={`${displayCurrent} / ${displayLimit}`}
              icon={<Icon size={18} style={{ color: meta.color }} />}
              color={meta.color}
              progress={pct}
              changeLabel={pct > 85 ? 'Warning: High usage' : 'Healthy status'}
            />
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
        <DashboardChart
          title="Tenant Resource Limits Allocation (%)"
          subtitle="Proportion of resources allocated vs remaining limits"
          data={usageChartData}
          config={{
            xAxisKey: 'name',
            series: [
              { dataKey: 'Used', name: 'Used %', color: 'var(--color-primary)' },
              { dataKey: 'Remaining', name: 'Remaining %', color: 'var(--color-border)' }
            ]
          }}
          defaultChartType="stacked-bar"
          allowedChartTypes={['stacked-bar', 'bar']}
          height={260}
        />
      </div>

      {/* Plans */}
      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Available Plans</h3>
        <button
          onClick={() => setShowComparison(!showComparison)}
          style={{
            background: 'none', border: '1px solid var(--color-border)', padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer',
            color: 'var(--color-primary)', fontWeight: 'var(--weight-semibold)', marginLeft: 'auto'
          }}
        >
          {showComparison ? 'Hide' : 'Show'} Feature Comparison
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {plans.map((plan) => (
          <Card key={plan.id} padding="lg" style={{
            border: plan.isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            position: 'relative', display: 'flex', flexDirection: 'column',
          }}>
            {plan.isCurrent && (
              <div style={{ position: 'absolute', top: '-1px', right: 'var(--space-4)', background: 'var(--color-primary)', color: 'var(--color-bg-elevated)', fontSize: '10px', fontWeight: 'var(--weight-bold)', padding: '2px 10px', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current
              </div>
            )}
            <h4 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{plan.name}</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-1)', margin: 'var(--space-3) 0 var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{formatPrice(plan.price)}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>/{plan.interval}</span>
            </div>

            <ul style={{ paddingLeft: 'var(--space-4)', margin: '0 0 var(--space-6) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              <li>Up to {plan.maxUsers} Users</li>
              <li>{formatStorage(plan.maxStorageMb)} Storage</li>
              <li>{plan.maxApiCalls.toLocaleString()} API Calls</li>
              {plan.features.map((f, idx) => <li key={idx}>{f}</li>)}
            </ul>

            <button
              onClick={() => setUpgradeTarget(plan)}
              disabled={plan.isCurrent}
              style={{
                marginTop: 'auto', width: '100%', padding: 'var(--space-2.5)', borderRadius: 'var(--radius-md)',
                border: 'none', background: plan.isCurrent ? 'var(--color-bg-sunken)' : 'var(--color-primary)',
                color: plan.isCurrent ? 'var(--color-text-tertiary)' : 'var(--color-bg-elevated)',
                fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)', cursor: plan.isCurrent ? 'default' : 'pointer',
              }}
            >
              {plan.isCurrent ? 'Active Subscription' : `Choose ${plan.name}`}
            </button>
          </Card>
        ))}
      </div>

      {/* Modal Confirm upgrade */}
      {upgradeTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Confirm Plan Upgrade</h3>
              <button onClick={() => setUpgradeTarget(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                You are upgrading to the <strong>{upgradeTarget.name}</strong> plan at <strong>{formatPrice(upgradeTarget.price)}/{upgradeTarget.interval}</strong>.
                Your credit card on file will be charged immediately, prorated for the rest of this billing period.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button onClick={() => setUpgradeTarget(null)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>Cancel</button>
                <button onClick={handleUpgrade} disabled={upgrading} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>
                  {upgrading ? 'Processing...' : 'Confirm Upgrade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Comparison matrix */}
      {showComparison && (
        <div style={{ overflowX: 'auto', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', animation: 'fadeInUp 0.3s ease-out' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Features</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Starter</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Growth</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3.5) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>{row.feature}</td>
                  <td style={{ padding: 'var(--space-3.5) var(--space-5)' }}>
                    {typeof row.starter === 'boolean' ? (row.starter ? <CheckCircle size={16} style={{ color: 'var(--color-success)' }} /> : '-') : row.starter}
                  </td>
                  <td style={{ padding: 'var(--space-3.5) var(--space-5)' }}>
                    {typeof row.growth === 'boolean' ? (row.growth ? <CheckCircle size={16} style={{ color: 'var(--color-success)' }} /> : '-') : row.growth}
                  </td>
                  <td style={{ padding: 'var(--space-3.5) var(--space-5)' }}>
                    {typeof row.enterprise === 'boolean' ? (row.enterprise ? <CheckCircle size={16} style={{ color: 'var(--color-success)' }} /> : '-') : row.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
