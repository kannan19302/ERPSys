'use client';

import React, { useState, useEffect } from 'react';
import { Card, KPICard, Badge, Spinner, DataTable, type Column } from '@unerp/ui';
import {
  Shield, Lock, Key, Smartphone, Globe, Monitor, AlertTriangle, FileText, Clock,
} from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './OverviewTab.module.css';

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

export default function OverviewTab({ onNavigateTab }: { onNavigateTab: (tab: string) => void }) {
  const client = useApiClient();
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [alerts, setAlerts] = useState<RecentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setOverview(await client.get<SecurityOverview>('/admin/security/overview'));
      } catch { /* use fallback */ }
      setAlerts(FALLBACK_ALERTS);
      setOverview((prev) => prev || FALLBACK_OVERVIEW);
      setLoading(false);
    })();
  }, [client]);

  if (loading || !overview) {
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  const securityModules = [
    {
      title: 'Password Policy', tab: 'password-policy', icon: Lock,
      status: overview.passwordPolicyStrength === 'strong' ? 'Configured' : 'Needs Review',
      statusType: overview.passwordPolicyStrength === 'strong' ? 'success' : 'warning',
      desc: 'Minimum length, complexity, and rotation rules',
    },
    {
      title: 'Multi-Factor Auth', tab: 'mfa', icon: Smartphone,
      status: overview.mfaEnforced ? 'Enforced' : overview.mfaEnabled ? 'Optional' : 'Disabled',
      statusType: overview.mfaEnforced ? 'success' : overview.mfaEnabled ? 'warning' : 'danger',
      desc: 'TOTP, SMS, and hardware key configuration',
    },
    {
      title: 'SSO Providers', tab: 'sso', icon: Key,
      status: overview.ssoConfigured ? 'Active' : 'Not Configured',
      statusType: overview.ssoConfigured ? 'success' : 'default',
      desc: 'SAML 2.0 and OIDC identity providers',
    },
    {
      title: 'Active Sessions', tab: 'sessions', icon: Monitor,
      status: `${overview.activeSessions} active`,
      statusType: 'info',
      desc: 'View and revoke user sessions',
    },
    {
      title: 'IP Restrictions', tab: 'ip-rules', icon: Globe,
      status: `${overview.ipRestrictionsCount} rules`,
      statusType: overview.ipRestrictionsCount > 0 ? 'success' : 'default',
      desc: 'Allow/deny lists for IP ranges',
    },
    {
      title: 'Login History', tab: 'login-history', icon: Clock,
      status: 'View Logs',
      statusType: 'info',
      desc: 'Complete login attempt history',
    },
  ];

  const alertColumns: Column<RecentAlert>[] = [
    {
      key: 'alert', header: 'Alert',
      render: (row) => {
        const sc = severityColors[row.severity] ?? { color: 'var(--color-primary)', bg: 'var(--color-primary-light)' };
        return (
          <div className="ui-hstack-3">
            <div className={styles.s1} style={{background: sc.bg, color: sc.color}}>
              <AlertTriangle size={14} />
            </div>
            <div>
              <div className={styles.s2}>{row.type}</div>
              <div className="ui-text-xs-tertiary">{row.message}</div>
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
      render: (row) => <span className="ui-text-xs-tertiary">{timeAgo(row.timestamp)}</span>,
    },
  ];

  return (
    <div className="ui-stack-6">
      <div className="ui-grid-auto">
        <KPICard
          title="Compliance Score"
          value={`${overview.complianceScore}%`}
          icon={<Shield size={20} />}
          color={overview.complianceScore >= 80 ? 'var(--color-success)' : 'var(--color-warning)'}
        />
        <KPICard
          title="Active Sessions"
          value={overview.activeSessions}
          icon={<Monitor size={20} />}
          color="var(--color-primary)"
          onClick={() => onNavigateTab('sessions')}
        />
        <KPICard
          title="Failed Logins (24h)"
          value={overview.failedLogins24h}
          icon={<AlertTriangle size={20} />}
          color={overview.failedLogins24h > 10 ? 'var(--color-danger)' : 'var(--color-warning)'}
          onClick={() => onNavigateTab('login-history')}
        />
        <KPICard
          title="MFA Status"
          value={overview.mfaEnforced ? 'Enforced' : overview.mfaEnabled ? 'Optional' : 'Off'}
          icon={<Smartphone size={20} />}
          color={overview.mfaEnforced ? 'var(--color-success)' : 'var(--color-warning)'}
          onClick={() => onNavigateTab('mfa')}
        />
      </div>

      <div>
        <h3 className={styles.s3}>
          Security Configuration
        </h3>
        <div className={styles.s4}>
          {securityModules.map((mod) => (
            <div
              key={mod.title}
              onClick={() => onNavigateTab(mod.tab)}
              className={styles.s5}
            >
              <div className={styles.s6}>
                <mod.icon size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className={styles.s7}>
                  <span className="ui-heading-sm">{mod.title}</span>
                  <Badge variant={mod.statusType as any}>{mod.status}</Badge>
                </div>
                <div className={styles.s8}>{mod.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card padding="none">
        <div className={styles.s9}>
          <h3 className={styles.s10}>
            Recent Security Alerts
          </h3>
          <button
            onClick={() => onNavigateTab('audit-trail')}
            className={styles.s11}
          >
            View audit trail
          </button>
        </div>
        <DataTable columns={alertColumns} data={alerts} rowKey={(row) => row.id} />
      </Card>
    </div>
  );
}
