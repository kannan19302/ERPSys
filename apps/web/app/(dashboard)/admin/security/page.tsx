'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, KPICard, Badge, Spinner, DataTable, type Column,
} from '@unerp/ui';
import {
  Shield, Lock, Key, Smartphone, Globe, Monitor, AlertTriangle,
  CheckCircle, XCircle, Users, ArrowRight, Eye, FileText, Clock,
} from 'lucide-react';
import Link from 'next/link';

interface SecurityOverview {
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  ssoConfigured: boolean;
  passwordPolicyStrength: 'weak' | 'medium' | 'strong';
  activeSessions: number;
  failedLogins24h: number;
  ipRestrictionsCount: number;
  complianceScore: number;
  lastAudit: string | null;
}

interface RecentAlert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

const FALLBACK_OVERVIEW: SecurityOverview = {
  mfaEnabled: true, mfaEnforced: false, ssoConfigured: true,
  passwordPolicyStrength: 'medium', activeSessions: 14,
  failedLogins24h: 7, ipRestrictionsCount: 3,
  complianceScore: 78, lastAudit: new Date(Date.now() - 86400000).toISOString(),
};

const FALLBACK_ALERTS: RecentAlert[] = [
  { id: '1', type: 'Failed Login', message: '5 failed login attempts from IP 192.168.1.105', severity: 'warning', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', type: 'New Device', message: 'admin@company.com logged in from new device (MacOS/Chrome)', severity: 'info', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'Brute Force', message: 'Potential brute force detected from IP 10.0.0.45', severity: 'critical', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', type: 'MFA Disabled', message: 'User dev@company.com disabled MFA', severity: 'warning', timestamp: new Date(Date.now() - 14400000).toISOString() },
];

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const severityColors: Record<string, { color: string; bg: string }> = {
  info: { color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
  critical: { color: 'var(--color-danger)', bg: 'var(--color-danger-light)' },
};

export default function SecurityPage() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [alerts, setAlerts] = useState<RecentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/v1/admin/security/overview', {
          headers: { Authorization: `Bearer ${token || ''}` },
        });
        if (res.ok) {
          setOverview(await res.json());
        }
      } catch { /* use fallback */ }
      setAlerts(FALLBACK_ALERTS);
      setOverview((prev) => prev || FALLBACK_OVERVIEW);
      setLoading(false);
    })();
  }, []);

  if (loading || !overview) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  const securityModules = [
    {
      title: 'Password Policy', href: '/admin/password-policy', icon: Lock,
      status: overview.passwordPolicyStrength === 'strong' ? 'Configured' : 'Needs Review',
      statusType: overview.passwordPolicyStrength === 'strong' ? 'success' : 'warning',
      desc: 'Minimum length, complexity, and rotation rules',
    },
    {
      title: 'Multi-Factor Auth', href: '/admin/mfa', icon: Smartphone,
      status: overview.mfaEnforced ? 'Enforced' : overview.mfaEnabled ? 'Optional' : 'Disabled',
      statusType: overview.mfaEnforced ? 'success' : overview.mfaEnabled ? 'warning' : 'danger',
      desc: 'TOTP, SMS, and hardware key configuration',
    },
    {
      title: 'SSO Providers', href: '/admin/sso', icon: Key,
      status: overview.ssoConfigured ? 'Active' : 'Not Configured',
      statusType: overview.ssoConfigured ? 'success' : 'default',
      desc: 'SAML 2.0 and OIDC identity providers',
    },
    {
      title: 'Active Sessions', href: '/admin/sessions', icon: Monitor,
      status: `${overview.activeSessions} active`,
      statusType: 'info',
      desc: 'View and revoke user sessions',
    },
    {
      title: 'IP Restrictions', href: '/admin/ip-restrictions', icon: Globe,
      status: `${overview.ipRestrictionsCount} rules`,
      statusType: overview.ipRestrictionsCount > 0 ? 'success' : 'default',
      desc: 'Allow/deny lists for IP ranges',
    },
    {
      title: 'Login History', href: '/admin/login-history', icon: Clock,
      status: 'View Logs',
      statusType: 'info',
      desc: 'Complete login attempt history',
    },
    {
      title: 'Data Retention', href: '/admin/data-retention', icon: FileText,
      status: 'Configured',
      statusType: 'success',
      desc: 'Automated data lifecycle policies',
    },
    {
      title: 'Compliance', href: '/admin/compliance', icon: Shield,
      status: `${overview.complianceScore}%`,
      statusType: overview.complianceScore >= 80 ? 'success' : overview.complianceScore >= 60 ? 'warning' : 'danger',
      desc: 'SOC 2, GDPR, and compliance status',
    },
  ];

  const alertColumns: Column<RecentAlert>[] = [
    {
      key: 'alert', header: 'Alert',
      render: (row) => {
        const sc = severityColors[row.severity] ?? { color: 'var(--color-primary)', bg: 'var(--color-primary-light)' };
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-md)',
              background: sc.bg, color: sc.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AlertTriangle size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{row.type}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.message}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'severity', header: 'Severity',
      render: (row) => (
        <Badge variant={row.severity === 'critical' ? 'danger' : row.severity === 'warning' ? 'warning' : 'info'}>
          {row.severity.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'timestamp', header: 'Time', align: 'right' as const,
      render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{timeAgo(row.timestamp)}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Security Control Hub"
        description="Monitor and configure authentication, access policies, and compliance"
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Security' },
        ]}
      />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard
          title="Compliance Score"
          value={`${overview.complianceScore}%`}
          icon={<Shield size={20} />}
          color={overview.complianceScore >= 80 ? 'var(--color-success)' : 'var(--color-warning)'}
          onClick={() => window.location.href = '/admin/compliance'}
        />
        <KPICard
          title="Active Sessions"
          value={overview.activeSessions}
          icon={<Monitor size={20} />}
          color="var(--color-primary)"
          onClick={() => window.location.href = '/admin/sessions'}
        />
        <KPICard
          title="Failed Logins (24h)"
          value={overview.failedLogins24h}
          icon={<AlertTriangle size={20} />}
          color={overview.failedLogins24h > 10 ? 'var(--color-danger)' : 'var(--color-warning)'}
          onClick={() => window.location.href = '/admin/login-history'}
        />
        <KPICard
          title="MFA Status"
          value={overview.mfaEnforced ? 'Enforced' : overview.mfaEnabled ? 'Optional' : 'Off'}
          icon={<Smartphone size={20} />}
          color={overview.mfaEnforced ? 'var(--color-success)' : 'var(--color-warning)'}
          onClick={() => window.location.href = '/admin/mfa'}
        />
      </div>

      {/* Security Modules Grid */}
      <div>
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
          Security Configuration
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
          {securityModules.map((mod) => (
            <Link href={mod.href} key={mod.title} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                style={{
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-default)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <mod.icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{mod.title}</span>
                    <Badge variant={mod.statusType as any}>{mod.status}</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>{mod.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Security Alerts */}
      <Card padding="none">
        <div style={{
          padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
            Recent Security Alerts
          </h3>
          <Link href="/admin/audit-trail" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View audit trail <ArrowRight size={12} />
          </Link>
        </div>
        <DataTable
          columns={alertColumns}
          data={alerts}
          rowKey={(row) => row.id}
        />
      </Card>
    </div>
  );
}
