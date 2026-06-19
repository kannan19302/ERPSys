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
  LayoutDashboard
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
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
          style={{
            padding: 'var(--space-2)',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-md)',
          }}
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              color: trend === 'up' ? 'var(--color-success)' : 'var(--color-danger)',
            }}
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

  const metrics: MetricCardProps[] = [
    {
      title: 'Total Revenue',
      value: '$124,560.00',
      change: '+12.3%',
      trend: 'up',
      description: 'vs last month',
      icon: TrendingUp,
    },
    {
      title: 'Active Employees',
      value: '24',
      change: '+4.5%',
      trend: 'up',
      description: 'vs last month',
      icon: Users,
    },
    {
      title: 'Pending Invoices',
      value: '18',
      change: '-2.1%',
      trend: 'down',
      description: 'vs last week',
      icon: Clock,
    },
    {
      title: 'Stock Alerts',
      value: '3',
      change: '+2 new',
      trend: 'up',
      description: 'items low stock',
      icon: AlertCircle,
    },
  ];

  const recentLogs = [
    { id: '1', action: 'User login', user: 'admin@uni-erp.com', time: '10 minutes ago', status: 'SUCCESS' },
    { id: '2', action: 'Created Invoice #INV-004', user: 'Jane Doe', time: '1 hour ago', status: 'SUCCESS' },
    { id: '3', action: 'Role updated: Finance Manager', user: 'Super Admin', time: '4 hours ago', status: 'SUCCESS' },
    { id: '4', action: 'Invited user sales@company.com', user: 'admin@uni-erp.com', time: '1 day ago', status: 'WARNING' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title={customDashboard ? customDashboard.name : `Welcome back, ${user ? user.firstName : 'Admin'}`}
        description={customDashboard ? customDashboard.description || 'Custom Builder Dashboard' : "Here is an overview of your organization's operations today."}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: customDashboard ? customDashboard.name : 'Dashboard' }]}
      />

      {loadingCustom ? (
        <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading dashboard...</div>
      ) : customDashboard ? (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '16px', minHeight: '600px' }}>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text)',
                fontWeight: 'var(--weight-medium)',
                fontSize: 'var(--text-sm)',
                transition: 'all 0.2s ease',
              }}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text)',
                fontWeight: 'var(--weight-medium)',
                fontSize: 'var(--text-sm)',
                transition: 'all 0.2s ease',
              }}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text)',
                fontWeight: 'var(--weight-medium)',
                fontSize: 'var(--text-sm)',
                transition: 'all 0.2s ease',
              }}
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
