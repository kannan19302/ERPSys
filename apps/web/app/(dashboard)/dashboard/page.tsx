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
} from 'lucide-react';

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

export default function DashboardPage() {
  const [user, setUser] = useState<{ firstName: string; lastName: string } | null>(null);

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
        title={`Welcome back, ${user ? user.firstName : 'Admin'}`}
        description="Here is an overview of your organization's operations today."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
      />

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
    </div>
  );
}
