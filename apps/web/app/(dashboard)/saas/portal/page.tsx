'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader } from '@unerp/ui';
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
  { metric: 'API_CALLS_COUNT', currentValue: 450, limitValue: 10000 },
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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
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

      if (plansRes) {
        const mapped = plansRes.map((p: any) => ({
          ...p,
          isCurrent: subRes ? p.id === subRes.planId : false,
          recommended: subRes ? p.id === subRes.planId : false,
        }));
        setPlans(mapped);
      }
      if (subRes) setSubscription(subRes);
      if (usageRes) setUsage(usageRes);
    } catch {
      // no data — UI shows an empty/loading state rather than fabricated plans
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
      // silent
    } finally {
      setUpgrading(false);
      setUpgradeTarget(null);
    }
  };

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  // No subscription loaded yet (or the request failed) — show an honest state instead of a fabricated plan.
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

      {/* Loading indicator */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading subscription data...
        </div>
      )}

      {/* Trial Banner */}
      {subscription.status === 'TRIAL' && (
        <div style={{
          background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-6)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)',
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

      {/* Usage Meters */}
      <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Resource Usage</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {usage.map((u) => {
          const meta = USAGE_META[u.metric];
          if (!meta) return null;
          const pct = u.limitValue > 0 ? (u.currentValue / u.limitValue) * 100 : 0;
          const displayCurrent = u.metric === 'STORAGE_MB' ? formatStorage(u.currentValue) : u.currentValue.toLocaleString();
          const displayLimit = u.metric === 'STORAGE_MB' ? formatStorage(u.limitValue) : u.limitValue.toLocaleString();
          const Icon = meta.icon;

          return (
            <Card key={u.metric} padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: meta.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{meta.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{displayCurrent} / {displayLimit}</div>
                </div>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: pct > 80 ? 'var(--color-danger)' : meta.color }}>
                  {pct.toFixed(0)}%
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(pct, 100)}%`,
                  background: pct > 80 ? 'var(--color-danger)' : pct > 60 ? 'var(--color-warning)' : meta.color,
                  borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease',
                }} />
              </div>
              {pct > 90 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
                  <AlertTriangle size={12} /> Approaching limit
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Plans */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Available Plans</h3>
        <button
          onClick={() => setShowComparison(!showComparison)}
          style={{
            background: 'none', border: '1px solid var(--color-border)', padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer',
            color: 'var(--color-primary)', fontWeight: 'var(--weight-semibold)',
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
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{plan.name}</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>{formatPrice(plan.price)}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>/{plan.interval}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Up to <strong>{plan.maxUsers}</strong> users · <strong>{formatStorage(plan.maxStorageMb)}</strong> storage
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1 }}>
              {plan.features.map((feat) => (
                <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <CheckCircle size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                  {feat}
                </li>
              ))}
            </ul>
            <button
              disabled={plan.isCurrent}
              onClick={() => !plan.isCurrent && setUpgradeTarget(plan)}
              style={{
                width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                border: plan.isCurrent ? '1px solid var(--color-border)' : 'none',
                background: plan.isCurrent ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: plan.isCurrent ? 'var(--color-text-secondary)' : 'var(--color-bg-elevated)',
                fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
                cursor: plan.isCurrent ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
              }}
            >
              {plan.isCurrent ? 'Current Plan' : (<>Select Plan <ArrowRight size={14} /></>)}
            </button>
          </Card>
        ))}
      </div>

      {/* Feature Comparison Table */}
      {showComparison && (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>Feature</th>
                <th style={{ textAlign: 'center', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>Starter</th>
                <th style={{ textAlign: 'center', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>Growth</th>
                <th style={{ textAlign: 'center', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 'var(--weight-medium)' }}>{row.feature}</td>
                  {(['starter', 'growth', 'enterprise'] as const).map((tier) => {
                    const val = row[tier];
                    return (
                      <td key={tier} style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-4)' }}>
                        {val === true ? <CheckCircle size={14} style={{ color: 'var(--color-success)' }} /> :
                         val === false ? <X size={14} style={{ color: 'var(--color-text-tertiary)' }} /> :
                         <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>{val}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Billing History */}
      <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Billing History</h3>
      <Card padding="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>
            <span>Period</span><span>Amount</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
            <span>{new Date(subscription.currentPeriodStart).toLocaleDateString()} — {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
            <span style={{ fontWeight: 'var(--weight-bold)' }}>{formatPrice(subscription.price)}</span>
          </div>
        </div>
      </Card>

      {/* Upgrade Confirmation Modal */}
      {upgradeTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)', maxWidth: '420px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Confirm Upgrade</h3>
              <button onClick={() => setUpgradeTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4)' }}>
              You are about to upgrade from <strong>{currentPlan?.name}</strong> to <strong>{upgradeTarget.name}</strong>.
              Your new price will be <strong>{formatPrice(upgradeTarget.price)}/{upgradeTarget.interval}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setUpgradeTarget(null)}
                style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', fontSize: 'var(--text-sm)', cursor: 'pointer', color: 'var(--color-text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                style={{
                  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                  fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: upgrading ? 'wait' : 'pointer',
                  opacity: upgrading ? 0.7 : 1,
                }}
              >
                {upgrading ? 'Processing...' : 'Confirm Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
