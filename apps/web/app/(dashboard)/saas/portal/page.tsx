'use client';

import React from 'react';
import { Card, PageHeader } from '@unerp/ui';
import { Users, HardDrive, Zap, CheckCircle, ArrowRight, Crown } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  maxUsers: number;
  maxStorage: string;
  features: string[];
  isCurrent: boolean;
  recommended: boolean;
}

interface UsageMeter {
  metric: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  currentValue: number;
  limitValue: number;
  color: string;
}

export default function SaasPortalPage() {


  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: '/month',
      maxUsers: 5,
      maxStorage: '1 GB',
      features: ['Core Modules', 'Email Support', '5 API Keys', 'Basic Reports'],
      isCurrent: false,
      recommended: false,
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '$99',
      period: '/month',
      maxUsers: 50,
      maxStorage: '10 GB',
      features: ['All Modules', 'Priority Support', 'Unlimited API Keys', 'Advanced Reporting', 'Workflow Engine', 'Custom Integrations'],
      isCurrent: true,
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$299',
      period: '/month',
      maxUsers: 500,
      maxStorage: '100 GB',
      features: ['Everything in Growth', 'Dedicated Support', 'SLA 99.9%', 'Custom Branding', 'SSO/SAML', 'Audit Compliance', 'Multi-Region'],
      isCurrent: false,
      recommended: false,
    },
  ];

  const usageMeters: UsageMeter[] = [
    { metric: 'USERS_COUNT', label: 'Active Users', icon: Users, currentValue: 12, limitValue: 50, color: '#6366f1' },
    { metric: 'STORAGE_MB', label: 'Storage Used', icon: HardDrive, currentValue: 2048, limitValue: 10240, color: '#f59e0b' },
    { metric: 'API_CALLS_COUNT', label: 'API Calls (Month)', icon: Zap, currentValue: 450, limitValue: 10000, color: '#22c55e' },
  ];

  const formatStorage = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="SaaS Portal & Subscription"
        description="Manage your subscription plan, monitor resource usage, and configure billing preferences."
        breadcrumbs={[{ label: 'SaaS', href: '/saas/portal' }, { label: 'Portal' }]}
      />

      {/* Current Plan Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #312e81, #4338ca, #6366f1)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6) var(--space-8)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Crown size={18} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Current Plan</span>
            </div>
            <h2 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
              Growth Plan
            </h2>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', opacity: 0.8 }}>
              $99/month · Renews on {new Date(Date.now() + 30 * 86400000).toLocaleDateString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', cursor: 'pointer' }}>
              Manage Billing
            </button>
            <button style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: '#fff', color: '#4338ca', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Usage Meters */}
      <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Resource Usage</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {usageMeters.map((meter) => {
          const pct = (meter.currentValue / meter.limitValue) * 100;
          const displayCurrent = meter.metric === 'STORAGE_MB' ? formatStorage(meter.currentValue) : meter.currentValue.toLocaleString();
          const displayLimit = meter.metric === 'STORAGE_MB' ? formatStorage(meter.limitValue) : meter.limitValue.toLocaleString();

          return (
            <Card key={meter.metric} padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: `${meter.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <meter.icon size={18} style={{ color: meter.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{meter.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{displayCurrent} / {displayLimit}</div>
                </div>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: pct > 80 ? '#ef4444' : meter.color }}>
                  {pct.toFixed(0)}%
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(pct, 100)}%`,
                    background: pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : meter.color,
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Plans Comparison */}
      <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Available Plans</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {plans.map((plan) => (
          <Card
            key={plan.id}
            padding="lg"
            style={{
              border: plan.isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {plan.recommended && (
              <div style={{ position: 'absolute', top: '-1px', right: 'var(--space-4)', background: 'var(--color-primary)', color: '#fff', fontSize: '10px', fontWeight: 'var(--weight-bold)', padding: '2px 10px', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current
              </div>
            )}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{plan.name}</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>{plan.price}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{plan.period}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Up to <strong>{plan.maxUsers}</strong> users · <strong>{plan.maxStorage}</strong> storage
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1 }}>
              {plan.features.map((feat) => (
                <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <CheckCircle size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                  {feat}
                </li>
              ))}
            </ul>
            <button
              disabled={plan.isCurrent}
              style={{
                width: '100%',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                border: plan.isCurrent ? '1px solid var(--color-border)' : 'none',
                background: plan.isCurrent ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: plan.isCurrent ? 'var(--color-text-secondary)' : '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                cursor: plan.isCurrent ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
              }}
            >
              {plan.isCurrent ? 'Current Plan' : (
                <>Select Plan <ArrowRight size={14} /></>
              )}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
