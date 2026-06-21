'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner } from '@unerp/ui';
import {
  Building,
  Users,
  Activity,
  DollarSign,
  Server,
  Database,
  Cpu,
} from 'lucide-react';

interface AnalyticsData {
  totalTenants: number;
  totalUsers: number;
  activeTenants: number;
  mrr: number;
}

interface HealthData {
  uptime: string;
  dbLatency: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  status: 'healthy' | 'degraded' | 'down';
}

const MOCK_ANALYTICS: AnalyticsData = {
  totalTenants: 42,
  totalUsers: 1284,
  activeTenants: 38,
  mrr: 24500,
};

const MOCK_HEALTH: HealthData = {
  uptime: '14d 6h 32m',
  dbLatency: 4.2,
  memoryUsage: { rss: 256, heapUsed: 128, heapTotal: 512 },
  status: 'healthy',
};

export default function SuperAdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      const [analyticsRes, healthRes] = await Promise.all([
        fetch('/api/v1/super-admin/analytics', { headers }),
        fetch('/api/v1/super-admin/health', { headers }),
      ]);

      if (!analyticsRes.ok || !healthRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const analyticsData = await analyticsRes.json();
      const healthData = await healthRes.json();
      setAnalytics(analyticsData?.data || analyticsData);
      setHealth(healthData?.data || healthData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
      setAnalytics(MOCK_ANALYTICS);
      setHealth(MOCK_HEALTH);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
        <Spinner />
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'var(--color-green-600)';
      case 'degraded': return 'var(--color-yellow-600)';
      case 'down': return 'var(--color-red-600)';
      default: return 'var(--color-gray-500)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="System overview and health monitoring"
      />

      {error && (
        <div className="frappe-card" style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-yellow-50)',
          color: 'var(--color-yellow-800)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
        }}>
          {error} — showing demo data
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {[
          { label: 'Total Tenants', value: analytics?.totalTenants ?? 0, icon: Building },
          { label: 'Total Users', value: analytics?.totalUsers ?? 0, icon: Users },
          { label: 'Active Tenants', value: analytics?.activeTenants ?? 0, icon: Activity },
          { label: 'MRR', value: `$${(analytics?.mrr ?? 0).toLocaleString()}`, icon: DollarSign },
        ].map((card) => (
          <Card key={card.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
              <div style={{
                background: 'var(--color-blue-50)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2)',
                display: 'flex',
              }}>
                <card.icon size={20} style={{ color: 'var(--color-blue-600)' }} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>{card.label}</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>{card.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* System Health */}
      <Card>
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>System Health</h3>
            <span style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: statusColor(health?.status || ''),
              textTransform: 'capitalize',
            }}>
              {health?.status || 'Unknown'}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            <div className="frappe-card" style={{ padding: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <Server size={14} style={{ color: 'var(--color-gray-500)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>Uptime</span>
              </div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{health?.uptime || '—'}</div>
            </div>

            <div className="frappe-card" style={{ padding: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <Database size={14} style={{ color: 'var(--color-gray-500)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>DB Latency</span>
              </div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{health?.dbLatency ?? '—'} ms</div>
            </div>

            <div className="frappe-card" style={{ padding: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <Cpu size={14} style={{ color: 'var(--color-gray-500)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>Memory (RSS)</span>
              </div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{health?.memoryUsage?.rss ?? '—'} MB</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
