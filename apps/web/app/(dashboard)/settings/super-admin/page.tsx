'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import styles from './page.module.css';
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
  const client = useApiClient();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, healthData] = await Promise.all([
        client.get<AnalyticsData | { data: AnalyticsData }>('/super-admin/analytics'),
        client.get<HealthData | { data: HealthData }>('/super-admin/health'),
      ]);
      setAnalytics('data' in analyticsData ? analyticsData.data : analyticsData);
      setHealth('data' in healthData ? healthData.data : healthData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
      setAnalytics(null);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  if (loading) {
    return (
      <div className={styles.loading}>
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
    <div className="ui-stack-6">
      <PageHeader
        title="Super Admin Dashboard"
        description="System overview and health monitoring"
      />

      {error && (
        <div className={`ui-card ${styles.error}`}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: 'Total Tenants', value: analytics?.totalTenants ?? 0, icon: Building },
          { label: 'Total Users', value: analytics?.totalUsers ?? 0, icon: Users },
          { label: 'Active Tenants', value: analytics?.activeTenants ?? 0, icon: Activity },
          { label: 'MRR', value: `$${(analytics?.mrr ?? 0).toLocaleString()}`, icon: DollarSign },
        ].map((card) => (
          <Card key={card.label}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon}>
                <card.icon size={20} />
              </div>
              <div>
                <div className={styles.kpiLabel}>{card.label}</div>
                <div className={styles.kpiValue}>{card.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* System Health */}
      <Card>
        <div className={styles.healthCard}>
          <div className="ui-flex-between">
            <h3 className={styles.healthTitle}>System Health</h3>
            <span className={styles.healthStatus} style={{
              color: statusColor(health?.status || ''),
            }}>
              {health?.status || 'Unknown'}
            </span>
          </div>

          <div className={styles.healthGrid}>
            <div className="ui-card p-3">
              <div className={styles.metricHeader}>
                <Server size={14} className={styles.metricIcon} />
                <span className={styles.metricLabel}>Uptime</span>
              </div>
              <div className={styles.metricValue}>{health?.uptime || '—'}</div>
            </div>

            <div className="ui-card p-3">
              <div className={styles.metricHeader}>
                <Database size={14} className={styles.metricIcon} />
                <span className={styles.metricLabel}>DB Latency</span>
              </div>
              <div className={styles.metricValue}>{health?.dbLatency ?? '—'} ms</div>
            </div>

            <div className="ui-card p-3">
              <div className={styles.metricHeader}>
                <Cpu size={14} className={styles.metricIcon} />
                <span className={styles.metricLabel}>Memory (RSS)</span>
              </div>
              <div className={styles.metricValue}>{health?.memoryUsage?.rss ?? '—'} MB</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
