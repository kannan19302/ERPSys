"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  KPICard,
  Sparkline,
  MiniDonutChart,
  Badge,
  Spinner,
  DataTable,
  Button,
  type Column,
} from "@unerp/ui";
import {
  Users,
  Shield,
  Clock,
  Activity,
  Key,
  Globe,
  Settings,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Server,
  Database,
  HardDrive,
  Cpu,
  FileText,
  UserPlus,
  LogIn,
  Trash2,
  Edit,
  Lock,
  Unlock,
  Bell,
  Workflow,
  Import,
  Zap,
  BarChart3,
  MonitorSmartphone,
  Bot,
} from "lucide-react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { RouteGuard, useApiClient } from "@unerp/framework";
import {
  SettingsTabLayout,
  SETTINGS_TABS,
} from "@/components/settings/SettingsTabLayout";
import styles from "./page.module.css";

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

function isAdminStats(value: unknown): value is AdminStats {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.activeUsers === "number" &&
    typeof candidate.totalRoles === "number" &&
    typeof candidate.activeSessions === "number" &&
    typeof candidate.apiRequestsToday === "number" &&
    typeof candidate.pendingInvitations === "number" &&
    typeof candidate.failedLogins24h === "number" &&
    typeof candidate.storageUsedGB === "number" &&
    typeof candidate.storageTotalGB === "number" &&
    typeof candidate.uptime === "number" &&
    typeof candidate.cpuUsage === "number" &&
    typeof candidate.memoryUsage === "number" &&
    typeof candidate.dbSize === "string"
  );
}

function normalizeAdminStats(response: unknown): AdminStats | null {
  const candidate =
    typeof response === "object" && response !== null && "data" in response
      ? (response as { data?: unknown }).data
      : response;
  return isAdminStats(candidate) ? candidate : null;
}

interface AuditEvent {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

const FALLBACK_STATS: AdminStats = {
  activeUsers: 85,
  totalRoles: 12,
  activeSessions: 14,
  apiRequestsToday: 3420,
  pendingInvitations: 3,
  failedLogins24h: 7,
  storageUsedGB: 12.4,
  storageTotalGB: 50,
  uptime: 99.97,
  cpuUsage: 23,
  memoryUsage: 61,
  dbSize: "2.3 GB",
};

const FALLBACK_EVENTS: AuditEvent[] = [
  {
    id: "1",
    action: "User Invited",
    user: "admin@company.com",
    target: "jane.doe@company.com",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    severity: "info",
  },
  {
    id: "2",
    action: "Role Modified",
    user: "admin@company.com",
    target: "Finance Manager",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    severity: "warning",
  },
  {
    id: "3",
    action: "Failed Login",
    user: "unknown@external.com",
    target: "Login Portal",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    severity: "critical",
  },
  {
    id: "4",
    action: "Settings Updated",
    user: "admin@company.com",
    target: "General Settings",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    severity: "info",
  },
  {
    id: "5",
    action: "User Suspended",
    user: "admin@company.com",
    target: "john.smith@company.com",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    severity: "warning",
  },
  {
    id: "6",
    action: "API Key Created",
    user: "dev@company.com",
    target: "Integration Key",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    severity: "info",
  },
];

const API_SPARKLINE = [
  1200, 1450, 1380, 1620, 1890, 2100, 1950, 2340, 2680, 3100, 3420,
];
const SESSION_SPARKLINE = [8, 10, 9, 12, 11, 14, 13, 15, 14, 16, 14];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const severityColor: Record<string, string> = {
  info: "var(--color-primary)",
  warning: "var(--color-warning)",
  critical: "var(--color-danger)",
};

const severityBg: Record<string, string> = {
  info: "var(--color-primary-light)",
  warning: "var(--color-warning-light)",
  critical: "var(--color-danger-light)",
};

const actionIcons: Record<string, React.ReactNode> = {
  "User Invited": <UserPlus size={14} />,
  "Role Modified": <Shield size={14} />,
  "Failed Login": <AlertTriangle size={14} />,
  "Settings Updated": <Settings size={14} />,
  "User Suspended": <Lock size={14} />,
  "API Key Created": <Key size={14} />,
};

export default function AdminDashboardPage() {
  const client = useApiClient();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await client.get<unknown>("/admin/stats");
        setStats(normalizeAdminStats(data));
      } catch {
        setStats(null);
      }
      setEvents(FALLBACK_EVENTS);
      setLoading(false);
    })();
  }, [client]);

  const s = stats || FALLBACK_STATS;

  const quickLinks = [
    {
      title: "Identity & Access",
      href: "/settings/identity-access",
      icon: Users,
      desc: "Users, groups, roles & access packages",
      color: "var(--color-primary)",
    },
    {
      title: "Security",
      href: "/settings/security",
      icon: Lock,
      desc: "SSO, MFA, sessions, audit trail",
      color: "var(--color-danger)",
    },
    {
      title: "Compliance & Governance",
      href: "/settings/compliance",
      icon: FileText,
      desc: "Compliance, retention, GDPR",
      color: "#f97316",
    },
    {
      title: "Approval Operations",
      href: "/settings/approval-operations",
      icon: CheckCircle,
      desc: "Active approvals & analytics",
      color: "#8b5cf6",
    },
    {
      title: "Workflow Builder",
      href: "/settings/workflow-builder",
      icon: Workflow,
      desc: "Templates, routing, simulator",
      color: "#a855f7",
    },
    {
      title: "Branding & Communication",
      href: "/settings/branding-communication",
      icon: Bell,
      desc: "Login page, SMTP, announcements",
      color: "#ec4899",
    },
    {
      title: "System Operations",
      href: "/settings/system-operations",
      icon: Server,
      desc: "Health, jobs, error logs",
      color: "#06b6d4",
    },
    {
      title: "General & Branding",
      href: "/settings/general-branding",
      icon: Settings,
      desc: "Organization profile, feature flags",
      color: "var(--color-text-secondary)",
    },
    {
      title: "API Platform",
      href: "/settings/api-platform",
      icon: Zap,
      desc: "Keys, webhooks, OAuth",
      color: "#d946ef",
    },
    {
      title: "Import / Export",
      href: "/settings/import-export",
      icon: Import,
      desc: "Bulk data & sync monitor",
      color: "#84cc16",
    },
    {
      title: "Localization",
      href: "/settings/localization",
      icon: Globe,
      desc: "Languages & date formats",
      color: "var(--color-info)",
    },
    {
      title: "Tenant Analytics",
      href: "/settings/tenant-analytics",
      icon: BarChart3,
      desc: "Tenant usage analytics",
      color: "#14b8a6",
    },
    {
      title: "AI Assistant",
      href: "/ai/settings",
      icon: Bot,
      desc: "Kill switch, model info & engine control",
      color: "#6366f1",
    },
  ];

  const userSegments = [
    { label: "Active", value: s.activeUsers, color: "var(--color-success)" },
    {
      label: "Invited",
      value: s.pendingInvitations,
      color: "var(--color-warning)",
    },
    { label: "Suspended", value: 2, color: "var(--color-danger)" },
  ];

  const auditColumns: Column<AuditEvent>[] = [
    {
      key: "action",
      header: "Event",
      render: (row) => (
        <div className="ui-hstack-3">
          <div
            className={styles.s1}
            style={{
              background: severityBg[row.severity],
              color: severityColor[row.severity],
            }}
          >
            {actionIcons[row.action] || <Activity size={14} />}
          </div>
          <div>
            <div className={styles.s2}>{row.action}</div>
            <div className="ui-text-xs-tertiary">{row.target}</div>
          </div>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (row) => <span className="ui-text-sm-muted">{row.user}</span>,
    },
    {
      key: "severity",
      header: "Severity",
      render: (row) => (
        <Badge
          variant={
            row.severity === "critical"
              ? "danger"
              : row.severity === "warning"
                ? "warning"
                : "info"
          }
        >
          {row.severity.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "timestamp",
      header: "Time",
      align: "right" as const,
      render: (row) => (
        <span className="ui-text-xs-tertiary">{timeAgo(row.timestamp)}</span>
      ),
    },
  ];

  return (
    <RouteGuard permission="settings.dashboard.read">
      <SettingsTabLayout
        tabs={SETTINGS_TABS}
        moduleId="settings"
        moduleLabel="Administration"
        moduleIcon={Settings}
        moduleDescription="SaaS Portal settings — manage users, security, compliance, system health, and platform configuration"
      >
        {loading ? (
          <div className={styles.s3}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="ui-stack-6">
            {/* KPI Cards Row */}
            <div className={styles.s4}>
              <KPICard
                title="Active Users"
                value={s.activeUsers}
                change={12}
                changeLabel="vs last month"
                icon={<Users size={20} />}
                color="var(--color-primary)"
                onClick={() =>
                  (window.location.href =
                    "/settings/identity-access?subtab=users")
                }
              />
              <KPICard
                title="Active Sessions"
                value={s.activeSessions}
                icon={<MonitorSmartphone size={20} />}
                color="var(--color-success)"
                onClick={() => (window.location.href = "/settings/sessions")}
              />
              <KPICard
                title="API Requests Today"
                value={s.apiRequestsToday.toLocaleString()}
                change={8}
                changeLabel="vs yesterday"
                icon={<Zap size={20} />}
                color="var(--color-info)"
                onClick={() =>
                  (window.location.href =
                    "/settings/api-platform?subtab=analytics")
                }
              />
              <KPICard
                title="Failed Logins (24h)"
                value={s.failedLogins24h}
                icon={<AlertTriangle size={20} />}
                color={
                  s.failedLogins24h > 10
                    ? "var(--color-danger)"
                    : "var(--color-warning)"
                }
                onClick={() =>
                  (window.location.href = "/settings/login-history")
                }
              />
            </div>

            {/* Main Content Grid */}
            <div className={styles.s5}>
              {/* Left Column */}
              <div className="ui-stack-6">
                {/* Recent Activity */}
                <Card padding="none">
                  <div className={styles.s6}>
                    <h3 className={styles.s7}>Recent Activity</h3>
                    <Link href="/settings/audit-trail" className={styles.s8}>
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
                  <h3 className={styles.s9}>Settings</h3>
                  <div className={styles.s10}>
                    {quickLinks.map((link) => (
                      <Link
                        href={link.href}
                        key={link.title}
                        className={styles.s11}
                      >
                        <div
                          className={styles.s12}
                          style={
                            {
                              "--quick-link-color": link.color,
                            } as React.CSSProperties
                          }
                        >
                          <div
                            className={styles.s13}
                            style={{
                              background: `${link.color}15`,
                              color: link.color,
                            }}
                          >
                            <link.icon size={18} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className={styles.s14}>{link.title}</div>
                            <div className={styles.s15}>{link.desc}</div>
                          </div>
                          <ArrowRight size={14} className={styles.s16} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="ui-stack-4">
                {/* System Health */}
                <Card>
                  <div className={styles.s17}>
                    <div className="ui-flex-between">
                      <h3 className={styles.s18}>System Health</h3>
                      <Badge variant="success">Operational</Badge>
                    </div>

                    <div className="ui-stack-3">
                      <HealthBar
                        label="Uptime"
                        value={`${s.uptime}%`}
                        percent={s.uptime}
                        color="var(--color-success)"
                      />
                      <HealthBar
                        label="CPU Usage"
                        value={`${s.cpuUsage}%`}
                        percent={s.cpuUsage}
                        color={
                          s.cpuUsage > 80
                            ? "var(--color-danger)"
                            : "var(--color-primary)"
                        }
                      />
                      <HealthBar
                        label="Memory"
                        value={`${s.memoryUsage}%`}
                        percent={s.memoryUsage}
                        color={
                          s.memoryUsage > 80
                            ? "var(--color-warning)"
                            : "var(--color-info)"
                        }
                      />
                      <HealthBar
                        label="Storage"
                        value={`${s.storageUsedGB}/${s.storageTotalGB} GB`}
                        percent={(s.storageUsedGB / s.storageTotalGB) * 100}
                        color="var(--color-primary)"
                      />
                      <div className={styles.s19}>
                        <span>Database</span>
                        <span className={styles.s20}>{s.dbSize}</span>
                      </div>
                    </div>

                    <Link href="/settings/system-health" className={styles.s21}>
                      View details <ArrowRight size={12} />
                    </Link>
                  </div>
                </Card>

                {/* AI Assistant (link-out to dedicated admin console) */}
                <Link href="/ai/settings" className={styles.s22}>
                  <Card>
                    <div className={styles.s23}>
                      <div className={styles.s24}>
                        <Bot size={18} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h3 className={styles.s25}>AI Assistant</h3>
                        <span className="ui-text-xs-tertiary">
                          Configure kill switch & engine
                        </span>
                      </div>
                      <ArrowRight size={14} className={styles.s26} />
                    </div>
                  </Card>
                </Link>

                {/* User Distribution */}
                <Card>
                  <div className={styles.s27}>
                    <h3 className={styles.s28}>User Distribution</h3>
                    <MiniDonutChart
                      segments={userSegments}
                      size={140}
                      thickness={22}
                      centerValue={s.activeUsers + s.pendingInvitations + 2}
                      centerLabel="Total"
                    />
                    <div className={styles.s29}>
                      {userSegments.map((seg) => (
                        <div
                          key={seg.label}
                          className="ui-flex ui-items-center ui-gap-1"
                        >
                          <div
                            className={styles.s30}
                            style={{ background: seg.color }}
                          />
                          <span className="ui-text-muted">{seg.label}</span>
                          <span className="font-semibold">{seg.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* API Traffic Sparkline */}
                <Card>
                  <div className="p-4 ui-stack-3">
                    <div className="ui-flex-between">
                      <h3 className={styles.s31}>API Traffic</h3>
                      <span className="ui-text-xs-tertiary">Last 24h</span>
                    </div>
                    <Sparkline
                      data={API_SPARKLINE}
                      width={280}
                      height={48}
                      color="var(--color-primary)"
                      fill
                    />
                  </div>
                </Card>

                {/* Session Trend */}
                <Card>
                  <div className="p-4 ui-stack-3">
                    <div className="ui-flex-between">
                      <h3 className={styles.s32}>Session Trend</h3>
                      <span className="ui-text-xs-tertiary">Last 7 days</span>
                    </div>
                    <Sparkline
                      data={SESSION_SPARKLINE}
                      width={280}
                      height={48}
                      color="var(--color-success)"
                      fill
                    />
                  </div>
                </Card>

                {/* Pending Actions */}
                <Card>
                  <div className="p-4 ui-stack-3">
                    <h3 className={styles.s33}>Pending Actions</h3>
                    <PendingItem
                      label="User invitations pending"
                      count={s.pendingInvitations}
                      href="/settings/identity-access?subtab=users"
                      color="var(--color-warning)"
                    />
                    <PendingItem
                      label="Failed login attempts"
                      count={s.failedLogins24h}
                      href="/settings/login-history"
                      color="var(--color-danger)"
                    />
                    <PendingItem
                      label="Roles configured"
                      count={s.totalRoles}
                      href="/settings/identity-access?subtab=roles"
                      color="var(--color-primary)"
                    />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </SettingsTabLayout>
    </RouteGuard>
  );
}

function HealthBar({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
}) {
  return (
    <div className={styles.s34}>
      <div className={styles.s35}>
        <span>{label}</span>
        <span className={styles.s36}>{value}</span>
      </div>
      <div className={styles.s37}>
        <div
          className={styles.s38}
          style={{ width: `${Math.min(percent, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function PendingItem({
  label,
  count,
  href,
  color,
}: {
  label: string;
  count: number;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className={styles.s39}>
      <div className={styles.s40}>
        <span className="ui-text-xs-muted">{label}</span>
        <span className={styles.s41}>{count}</span>
      </div>
    </Link>
  );
}
