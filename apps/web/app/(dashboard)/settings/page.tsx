'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, KPICard, Sparkline, MiniDonutChart, Badge, Tabs, Spinner,
  DataTable, Button, type Column,
} from '@unerp/ui';
import {
  Users, Shield, Clock, Activity, Key, Globe, Settings, ArrowRight,
  AlertTriangle, CheckCircle, Server, Database, HardDrive, Cpu,
  FileText, UserPlus, LogIn, Trash2, Edit, Lock, Unlock,
  Bell, Workflow, Import, Zap, BarChart3, MonitorSmartphone, Bot,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface AdminStats {
  activeUsers: number;
  totalRoles: number;
  activeSessions: number;
  apiRequestsToday: number;
  pendingInvitations: number;
  failedLogins24h: number;
  storageUsedGB: number;
  storageTotalGB: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  dbSize: string;
}

interface AuditEvent {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

const FALLBACK_STATS: AdminStats = {
  activeUsers: 85, totalRoles: 12, activeSessions: 14,
  apiRequestsToday: 3420, pendingInvitations: 3, failedLogins24h: 7,
  storageUsedGB: 12.4, storageTotalGB: 50, uptime: 99.97,
  cpuUsage: 23, memoryUsage: 61, dbSize: '2.3 GB',
};

const FALLBACK_EVENTS: AuditEvent[] = [
  { id: '1', action: 'User Invited', user: 'admin@company.com', target: 'jane.doe@company.com', timestamp: new Date(Date.now() - 300000).toISOString(), severity: 'info' },
  { id: '2', action: 'Role Modified', user: 'admin@company.com', target: 'Finance Manager', timestamp: new Date(Date.now() - 900000).toISOString(), severity: 'warning' },
  { id: '3', action: 'Failed Login', user: 'unknown@external.com', target: 'Login Portal', timestamp: new Date(Date.now() - 1800000).toISOString(), severity: 'critical' },
  { id: '4', action: 'Settings Updated', user: 'admin@company.com', target: 'General Settings', timestamp: new Date(Date.now() - 3600000).toISOString(), severity: 'info' },
  { id: '5', action: 'User Suspended', user: 'admin@company.com', target: 'john.smith@company.com', timestamp: new Date(Date.now() - 7200000).toISOString(), severity: 'warning' },
  { id: '6', action: 'API Key Created', user: 'dev@company.com', target: 'Integration Key', timestamp: new Date(Date.now() - 10800000).toISOString(), severity: 'info' },
];

const API_SPARKLINE = [1200, 1450, 1380, 1620, 1890, 2100, 1950, 2340, 2680, 3100, 3420];
const SESSION_SPARKLINE = [8, 10, 9, 12, 11, 14, 13, 15, 14, 16, 14];

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const severityColor: Record<string, string> = {
  info: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  critical: 'var(--color-danger)',
};

const severityBg: Record<string, string> = {
  info: 'var(--color-primary-light)',
  warning: 'var(--color-warning-light)',
  critical: 'var(--color-danger-light)',
};

const actionIcons: Record<string, React.ReactNode> = {
  'User Invited': <UserPlus size={14} />,
  'Role Modified': <Shield size={14} />,
  'Failed Login': <AlertTriangle size={14} />,
  'Settings Updated': <Settings size={14} />,
  'User Suspended': <Lock size={14} />,
  'API Key Created': <Key size={14} />,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/v1/admin/stats', {
          headers: { Authorization: `Bearer ${token || ''}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStats(data?.data || data);
      } catch {
        setStats(null);
      }
      setEvents(FALLBACK_EVENTS);
      setLoading(false);
    })();
  }, []);

  const s = stats || FALLBACK_STATS;

  const quickLinks = [
    { title: 'Users', href: '/admin/users', icon: Users, desc: 'Manage users & invitations', color: 'var(--color-primary)' },
    { title: 'Roles & Permissions', href: '/admin/access-control', icon: Shield, desc: 'Configure RBAC policies', color: 'var(--color-success)' },
    { title: 'SSO Configuration', href: '/admin/sso', icon: Key, desc: 'SAML & OIDC providers', color: 'var(--color-warning)' },
    { title: 'Security Hub', href: '/admin/security', icon: Lock, desc: 'MFA, IP rules, policies', color: 'var(--color-danger)' },
    { title: 'Localization', href: '/admin/localization', icon: Globe, desc: 'Languages & date formats', color: 'var(--color-info)' },
    { title: 'Workflows', href: '/admin/workflows', icon: Workflow, desc: 'Approval chains & routing', color: '#8b5cf6' },
    { title: 'Audit Trail', href: '/admin/audit-trail', icon: FileText, desc: 'Activity logs & compliance', color: '#f97316' },
    { title: 'System Health', href: '/admin/system-health', icon: Server, desc: 'Server & services status', color: '#06b6d4' },
    { title: 'Import / Export', href: '/admin/import', icon: Import, desc: 'Bulk data operations', color: '#84cc16' },
    { title: 'API Platform', href: '/admin/api-platform', icon: Zap, desc: 'Keys, webhooks, OAuth', color: '#ec4899' },
    { title: 'Analytics', href: '/admin/tenant-analytics', icon: BarChart3, desc: 'Tenant usage analytics', color: '#14b8a6' },
    { title: 'AI Assistant', href: '/admin/ai', icon: Bot, desc: 'Kill switch, model info & engine control', color: '#6366f1' },
    { title: 'General Settings', href: '/admin/settings/general', icon: Settings, desc: 'Organization profile', color: 'var(--color-text-secondary)' },
  ];

  const userSegments = [
    { label: 'Active', value: s.activeUsers, color: 'var(--color-success)' },
    { label: 'Invited', value: s.pendingInvitations, color: 'var(--color-warning)' },
    { label: 'Suspended', value: 2, color: 'var(--color-danger)' },
  ];

  const auditColumns: Column<AuditEvent>[] = [
    {
      key: 'action', header: 'Event',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--radius-md)',
            background: severityBg[row.severity], color: severityColor[row.severity],
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {actionIcons[row.action] || <Activity size={14} />}
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{row.action}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.target}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'user', header: 'User',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{row.user}</span>
      ),
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
      render: (row) => (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{timeAgo(row.timestamp)}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Settings"
        description="System overview, user management, security monitoring, and configuration"
        breadcrumbs={[{ label: 'Settings' }]}
      />

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard
          title="Active Users"
          value={s.activeUsers}
          change={12}
          changeLabel="vs last month"
          icon={<Users size={20} />}
          color="var(--color-primary)"
          onClick={() => window.location.href = '/admin/users'}
        />
        <KPICard
          title="Active Sessions"
          value={s.activeSessions}
          icon={<MonitorSmartphone size={20} />}
          color="var(--color-success)"
          onClick={() => window.location.href = '/admin/sessions'}
        />
        <KPICard
          title="API Requests Today"
          value={s.apiRequestsToday.toLocaleString()}
          change={8}
          changeLabel="vs yesterday"
          icon={<Zap size={20} />}
          color="var(--color-info)"
          onClick={() => window.location.href = '/admin/api-platform/analytics'}
        />
        <KPICard
          title="Failed Logins (24h)"
          value={s.failedLogins24h}
          icon={<AlertTriangle size={20} />}
          color={s.failedLogins24h > 10 ? 'var(--color-danger)' : 'var(--color-warning)'}
          onClick={() => window.location.href = '/admin/login-history'}
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Recent Activity */}
          <Card padding="none">
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Recent Activity</h3>
              <Link href="/admin/audit-trail" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <DataTable
              columns={auditColumns}
              data={events}
              rowKey={(row) => row.id}
              onRowClick={() => {}}
            />
          </Card>

          {/* Quick Actions Grid */}
          <div>
            <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
              Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
              {quickLinks.map((link) => (
                <Link href={link.href} key={link.title} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)',
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      cursor: 'pointer',
                      transition: 'all var(--duration-fast) var(--ease-default)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = link.color;
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-md)',
                      background: `${link.color}15`, color: link.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <link.icon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {link.title}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.desc}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* System Health */}
          <Card>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>System Health</h3>
                <Badge variant="success">Operational</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <HealthBar label="Uptime" value={`${s.uptime}%`} percent={s.uptime} color="var(--color-success)" />
                <HealthBar label="CPU Usage" value={`${s.cpuUsage}%`} percent={s.cpuUsage} color={s.cpuUsage > 80 ? 'var(--color-danger)' : 'var(--color-primary)'} />
                <HealthBar label="Memory" value={`${s.memoryUsage}%`} percent={s.memoryUsage} color={s.memoryUsage > 80 ? 'var(--color-warning)' : 'var(--color-info)'} />
                <HealthBar label="Storage" value={`${s.storageUsedGB}/${s.storageTotalGB} GB`} percent={(s.storageUsedGB / s.storageTotalGB) * 100} color="var(--color-primary)" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <span>Database</span>
                  <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{s.dbSize}</span>
                </div>
              </div>

              <Link href="/admin/system-health" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View details <ArrowRight size={12} />
              </Link>
            </div>
          </Card>

          {/* AI Assistant (link-out to dedicated admin console) */}
          <Link href="/admin/ai" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card>
              <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Bot size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>AI Assistant</h3>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Configure kill switch & engine</span>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
              </div>
            </Card>
          </Link>

          {/* User Distribution */}
          <Card>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', alignSelf: 'flex-start' }}>User Distribution</h3>
              <MiniDonutChart
                segments={userSegments}
                size={140}
                thickness={22}
                centerValue={s.activeUsers + s.pendingInvitations + 2}
                centerLabel="Total"
              />
              <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
                {userSegments.map((seg) => (
                  <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: seg.color }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>{seg.label}</span>
                    <span style={{ fontWeight: 'var(--weight-semibold)' }}>{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* API Traffic Sparkline */}
          <Card>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>API Traffic</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Last 24h</span>
              </div>
              <Sparkline data={API_SPARKLINE} width={280} height={48} color="var(--color-primary)" fill />
            </div>
          </Card>

          {/* Session Trend */}
          <Card>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Session Trend</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Last 7 days</span>
              </div>
              <Sparkline data={SESSION_SPARKLINE} width={280} height={48} color="var(--color-success)" fill />
            </div>
          </Card>

          {/* Pending Actions */}
          <Card>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Pending Actions</h3>
              <PendingItem label="User invitations pending" count={s.pendingInvitations} href="/admin/users" color="var(--color-warning)" />
              <PendingItem label="Failed login attempts" count={s.failedLogins24h} href="/admin/login-history" color="var(--color-danger)" />
              <PendingItem label="Roles configured" count={s.totalRoles} href="/admin/access-control" color="var(--color-primary)" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HealthBar({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-sunken)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(percent, 100)}%`,
          borderRadius: 'var(--radius-full)', background: color,
          transition: 'width var(--duration-normal) var(--ease-default)',
        }} />
      </div>
    </div>
  );
}

function PendingItem({ label, count, href, color }: { label: string; count: number; href: string; color: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          transition: 'background var(--duration-fast) var(--ease-default)', cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color }}>{count}</span>
      </div>
    </Link>
  );
}
