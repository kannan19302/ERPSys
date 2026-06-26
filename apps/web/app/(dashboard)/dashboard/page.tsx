'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Badge } from '@unerp/ui';
import {
  TrendingUp,
  Users,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  PlusCircle,
  FileText,
  BarChart2,
  PieChart,
  Hash,
  Table as TableIcon,
  LayoutDashboard,
  Layers,
  Database
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApiQuery } from '../../../src/lib/hooks/useApi';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  description,
  icon: Icon,
}) => {
  return (
    <Card hover padding="md" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>
          {title}
        </span>
        <div
          style={{ padding: 'var(--space-2)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}
        >
          <Icon size={18} />
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' as unknown as number, margin: '0 0 var(--space-1)' }}>
          {value}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
          <span
            style={{ display: 'inline-flex', alignItems: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: trend === 'up' ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            {description}
          </span>
        </div>
      </div>
    </Card>
  );
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const dashboardId = searchParams?.get('dashboardId');
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; lastName: string; tenantId?: string } | null>(null);
  
  const [customDashboard, setCustomDashboard] = useState<any>(null);
  const [customLayout, setCustomLayout] = useState<any[]>([]);
  const [customWidgets, setCustomWidgets] = useState<any[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Global enterprise dashboard states
  const [activeTab, setActiveTab] = useState<'global' | 'personal'>('global');
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // Ignore
      }
    }
  }, []);

  useEffect(() => {
    if (dashboardId) {
      setLoadingCustom(true);
      const token = localStorage.getItem('token') || '';
      fetch(`/api/v1/builder/dashboards/${dashboardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setCustomDashboard(data);
        if (data.layout) setCustomLayout(typeof data.layout === 'string' ? JSON.parse(data.layout) : data.layout);
        if (data.widgets) setCustomWidgets(typeof data.widgets === 'string' ? JSON.parse(data.widgets) : data.widgets);
      })
      .catch(console.error)
      .finally(() => setLoadingCustom(false));
    }
  }, [dashboardId]);

  useEffect(() => {
    if (activeTab === 'global' && !customDashboard) {
      setLoadingGlobal(true);
      const token = localStorage.getItem('token') || '';
      fetch('/api/v1/builder/dashboards/global-stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setGlobalStats(data);
      })
      .catch(console.error)
      .finally(() => setLoadingGlobal(false));
    }
  }, [activeTab, customDashboard]);

  // Live data: invoice totals, employee count, stock alerts
  const { data: invoiceData } = useApiQuery<{ total: number; data: any[] }>(
    ['dashboard', 'invoices'],
    '/finance/invoices?limit=1',
    { staleTime: 60_000 },
  );
  const { data: employeeData } = useApiQuery<{ total: number }>(
    ['dashboard', 'employees'],
    '/hr/employees?limit=1',
    { staleTime: 60_000 },
  );
  const { data: activityData } = useApiQuery<any[]>(
    ['dashboard', 'activity'],
    '/admin/activity-feed?limit=5',
    { staleTime: 30_000 },
  );

  const invoiceCount = invoiceData?.total ?? 0;
  const employeeCount = employeeData?.total ?? 0;

  const metrics: MetricCardProps[] = [
    {
      title: 'Total Revenue',
      value: globalStats?.metrics?.totalRevenue
        ? `$${Number(globalStats.metrics.totalRevenue).toLocaleString()}`
        : (invoiceCount > 0 ? `${invoiceCount} invoices` : '$0'),
      change: globalStats?.metrics?.revenueChange || '--',
      trend: 'up',
      description: 'vs last month',
      icon: TrendingUp,
    },
    {
      title: 'Active Employees',
      value: String(globalStats?.metrics?.activeEmployees ?? employeeCount),
      change: '--',
      trend: 'up',
      description: 'current headcount',
      icon: Users,
    },
    {
      title: 'Pending Invoices',
      value: String(globalStats?.metrics?.pendingInvoices ?? invoiceCount),
      change: '--',
      trend: 'down',
      description: 'awaiting payment',
      icon: Clock,
    },
    {
      title: 'Stock Alerts',
      value: String(globalStats?.metrics?.stockAlerts ?? 0),
      change: '--',
      trend: 'up',
      description: 'items low stock',
      icon: AlertCircle,
    },
  ];

  const recentLogs = (activityData || []).slice(0, 5).map((log: any, idx: number) => ({
    id: log.id || String(idx),
    action: log.action || log.description || 'Activity',
    user: log.userName || log.userId || 'System',
    time: log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent',
    status: log.status || 'SUCCESS',
  }));

  const globalMetrics = globalStats?.metrics || {
    totalRevenue: 0,
    activeEmployees: employeeCount,
    totalCustomApps: 0,
    totalCustomRecords: 0,
    pendingInvoices: invoiceCount,
    stockAlerts: 0,
    totalLeads: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title={customDashboard ? customDashboard.name : (activeTab === 'global' ? 'Global Enterprise Dashboard' : `Welcome back, ${user ? user.firstName : 'Admin'}`)}
        description={customDashboard ? customDashboard.description || 'Custom Builder Dashboard' : (activeTab === 'global' ? 'Overview of all custom applications and global company performance metrics.' : "Here is an overview of your organization's operations today.")}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: customDashboard ? customDashboard.name : 'Dashboard' }]}
      />

      {!customDashboard && (
        <div className="builder-tabs" style={{ marginBottom: '-8px' }}>
          <button
            className={`builder-tab ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            Global Enterprise Overview
          </button>
          <button
            className={`builder-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Dashboard
          </button>
        </div>
      )}

      {loadingCustom ? (
        <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading dashboard...</div>
      ) : customDashboard ? (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0.05)', padding: '16px', minHeight: '600px' }}>
          <GridLayout
            className="layout"
            layout={customLayout}
            // @ts-ignore
            cols={12}
            rowHeight={40}
            width={1200} // Hardcoded width for simple preview, or could use responsive grid
            isDraggable={false}
            isResizable={false}
            margin={[16, 16]}
          >
            {customLayout.map(l => {
              const widget = customWidgets.find(w => w.id === l.i);
              if (!widget) return <div key={l.i}></div>;
              
              const typeIcons: Record<string, any> = { kpi: Hash, bar: BarChart2, line: TrendingUp, pie: PieChart, table: TableIcon };
              const typeColors: Record<string, string> = { kpi: '#10b981', bar: '#3b82f6', line: '#f59e0b', pie: '#8b5cf6', table: '#64748b' };
              const Icon = typeIcons[widget.type] || LayoutDashboard;
              const color = typeColors[widget.type] || '#64748b';
              
              return (
                <div key={l.i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', background: 'white' }}>
                    <Icon size={14} color={color} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', flex: 1 }}>{widget.title}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                    {widget.type === 'kpi' && <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>--</span>}
                    {widget.type !== 'kpi' && <BarChart2 size={32} opacity={0.5} />}
                  </div>
                </div>
              );
            })}
          </GridLayout>
        </div>
      ) : activeTab === 'global' ? (
        loadingGlobal ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading enterprise performance stats...</div>
        ) : (
          <>
            {/* Global enterprise summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              <MetricCard
                title="Company Paid Revenue"
                value={`$${Number(globalMetrics.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                change={`${globalMetrics.pendingInvoices} unpaid`}
                trend={globalMetrics.totalRevenue > 0 ? "up" : "down"}
                description="Invoices amount paid"
                icon={TrendingUp}
              />
              <MetricCard
                title="Active Workforce"
                value={String(globalMetrics.activeEmployees || 0)}
                change="Employees"
                trend="up"
                description="Active status records"
                icon={Users}
              />
              <MetricCard
                title="CRM Leads"
                value={String(globalMetrics.totalLeads || 0)}
                change="Leads"
                trend="up"
                description="In CRM sales pipeline"
                icon={ArrowUpRight}
              />
              <MetricCard
                title="Low Stock Alerts"
                value={String(globalMetrics.stockAlerts || 0)}
                change="Items low stock"
                trend="down"
                description="Requires reordering"
                icon={AlertCircle}
              />
              <MetricCard
                title="Custom Applications"
                value={String(globalMetrics.totalCustomApps || 0)}
                change={`${globalMetrics.totalCustomRecords} submissions`}
                trend="up"
                description="Visual Apps Deployed"
                icon={LayoutDashboard}
              />
            </div>

            {/* Performance charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
              <Card padding="lg">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4)' }}>
                  Submissions Distribution by Custom App
                </h3>
                {(!globalStats?.charts?.submissionsByApp || globalStats.charts.submissionsByApp.length === 0) ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No custom app records submitted yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'conic-gradient(var(--color-primary) 0% 40%, #10b981 40% 70%, #f59e0b 70% 90%, #8b5cf6 90% 100%)' }}>
                      <div style={{ position: 'absolute', borderRadius: '9999px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-bg-elevated)' }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-text)' }}>{globalMetrics.totalCustomRecords || 0}</span>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Submissions</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--text-xs)' }}>
                      {globalStats.charts.submissionsByApp.slice(0, 4).map((app: any, idx: number) => {
                        const colors = ['var(--color-primary)', '#10b981', '#f59e0b', '#8b5cf6'];
                        const color = colors[idx % colors.length];
                        const pct = globalMetrics.totalCustomRecords > 0 ? Math.round((app.count / globalMetrics.totalCustomRecords) * 100) : 0;
                        return (
                          <div key={app.appName} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ borderRadius: '9999px', background: color }} />
                            <span>{app.appName} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              <Card padding="lg">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4)' }}>
                  Monthly Custom Record Submissions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ flex: '1', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingInline: 'var(--space-2)', gap: 'var(--space-3)' }}>
                    {(globalStats?.charts?.monthlySubmissionsTrend || []).map((d: any, i: number) => {
                      const maxVal = Math.max(...(globalStats?.charts?.monthlySubmissionsTrend || []).map((x: any) => x.count), 1);
                      return (
                        <div key={i} style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                          <div className="bottom-full bg-text text-card text-[10px] py-1 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ position: 'absolute', marginBottom: 'var(--space-1)', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--color-text)', color: 'var(--color-bg-elevated)' }}>
                            {d.count} records
                          </div>
                          <div
                            className="rounded-t hover:brightness-110 transition-all" style={{ width: '100%', cursor: 'pointer' }}
                            style={{
                              height: `${Math.max(4, (d.count / maxVal) * 90)}%`,
                              background: 'linear-gradient(to top, var(--color-primary-light), var(--color-primary))',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', paddingInline: 'var(--space-2)' }}>
                    {(globalStats?.charts?.monthlySubmissionsTrend || []).map((d: any, i: number) => (
                      <span key={i} style={{ textAlign: 'center' }}>{d.month}</span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Custom apps catalog */}
            <Card padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>
                  Custom Applications Workspace
                </h3>
                <span className="frappe-badge frappe-badge-primary" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  {globalStats?.customApps?.length || 0} Apps Deployed
                </span>
              </div>

              {(!globalStats?.customApps || globalStats.customApps.length === 0) ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No custom applications have been created yet. Navigate to App Studio to create one!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                  {globalStats.customApps.map((app: any) => (
                    <div
                      key={app.id}
                      style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', transition: 'border-color 0.2s ease', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                      onClick={() => router.push(`/builder/erp/apps/${app.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                          {app.name}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: app.status === 'ACTIVE' || app.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: app.status === 'ACTIVE' || app.status === 'Active' ? '#10b981' : '#f59e0b' }}>
                          {app.status}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', textAlign: 'center', background: 'var(--color-bg-sunken)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{app.pagesCount}</div>
                          <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Pages</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{app.formsCount}</div>
                          <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Forms</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{app.dataModelsCount}</div>
                          <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Models</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-primary)' }}>{app.submissionsCount}</div>
                          <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Subs</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        <span>Category: {app.category}</span>
                        <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>v{app.version}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Submissions Timeline Activity */}
            <Card padding="lg">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4)' }}>
                Enterprise Activity Timeline (Custom Records)
              </h3>
              {(!globalStats?.recentSubmissions || globalStats.recentSubmissions.length === 0) ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No recent submissions recorded.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {globalStats.recentSubmissions.map((sub: any) => (
                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                            New submission to {sub.schemaName}
                          </span>
                          <span style={{ fontSize: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '1px 6px', borderRadius: '4px' }}>
                            {sub.appName}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', maxWidth: '600px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Data: {JSON.stringify(sub.data)}
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                        {new Date(sub.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )
      ) : (
        <>
          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>

          {/* Actions and Activity Logs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
            
            {/* Quick Actions Panel */}
            <Card padding="lg">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4)' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)', fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'var(--color-primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'var(--color-bg)';
                  }}
                >
                  <UserPlus size={18} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Invite Team Member</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>Add administrators, managers, or viewers</p>
                  </div>
                </button>

                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)', fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'var(--color-primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'var(--color-bg)';
                  }}
                >
                  <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Create Customer Invoice</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>Record new sales and trigger billing events</p>
                  </div>
                </button>

                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)', fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'var(--color-primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'var(--color-bg)';
                  }}
                >
                  <PlusCircle size={18} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Register New Product</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>Add products and define warehouse settings</p>
                  </div>
                </button>
              </div>
            </Card>

            {/* Audit Activity Log */}
            <Card padding="lg">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4)' }}>
                Recent Activity Logs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {recentLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        By {log.user} • {log.time}
                      </span>
                    </div>
                    <Badge variant={log.status === 'SUCCESS' ? 'success' : 'warning'}>
                      {log.status.toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </>
      )}
    </div>
  );
}

import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
