'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, PageHeader, Spinner } from '@unerp/ui';
import { Server, Database, Cpu, RefreshCw } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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

const statusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'var(--color-green-600)';
    case 'degraded': return 'var(--color-yellow-600)';
    case 'down': return 'var(--color-red-600)';
    default: return 'var(--color-gray-500)';
  }
};

const latencyColor = (ms: number) => {
  if (ms < 10) return 'var(--color-green-600)';
  if (ms < 50) return 'var(--color-yellow-600)';
  return 'var(--color-red-600)';
};

const memoryColor = (used: number, total: number) => {
  const pct = total > 0 ? used / total : 0;
  if (pct < 0.6) return 'var(--color-green-600)';
  if (pct < 0.85) return 'var(--color-yellow-600)';
  return 'var(--color-red-600)';
};

export default function SystemHealthPage() {
  const client = useApiClient();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = async () => {
    try {
      const data = await client.get<HealthData>('/super-admin/health');
      setHealth(data);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load health data';
      setError(message);
      setHealth(null);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchHealth();
    intervalRef.current = setInterval(fetchHealth, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [client]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner />
      </div>
    );
  }

  return (
    <RouteGuard permission="system.health.read">
    <div className="ui-stack-6">
      <PageHeader
        title="System Health"
        description="Real-time system monitoring with auto-refresh every 30 seconds"
      />

      {error && (
        <div className={`${styles.warning} ui-card`}>
          {error}
        </div>
      )}

      {/* Status + Refresh */}
      <div className="ui-flex-between">
        <div className="ui-hstack-3">
          <div className={styles.statusDot} style={{ background: statusColor(health?.status || '') }} />
          <span className={styles.statusLabel} style={{ color: statusColor(health?.status || '') }}>
            {health?.status || 'Unknown'}
          </span>
        </div>
        <button
          className="ui-btn ui-hstack-2"
          onClick={fetchHealth}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className={styles.lastUpdated}>
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Metric Cards */}
      <div className={styles.metricsGrid}>
        {/* Uptime */}
        <Card>
          <div className={styles.metricCard}>
            <div className="ui-hstack-2">
              <Server className={styles.blueIcon} size={18} />
              <span className={styles.metricLabel}>Uptime</span>
            </div>
            <div className={styles.metricValue}>
              {health?.uptime || '—'}
            </div>
          </div>
        </Card>

        {/* DB Latency */}
        <Card>
          <div className={styles.metricCard}>
            <div className="ui-hstack-2">
              <Database className={styles.blueIcon} size={18} />
              <span className={styles.metricLabel}>DB Latency</span>
            </div>
            <div className={styles.metricValue} style={{ color: latencyColor(health?.dbLatency ?? 0) }}>
              {health?.dbLatency ?? '—'} ms
            </div>
            <div className={styles.progressTrack}>
              <div style={{
                width: `${Math.min((health?.dbLatency ?? 0) / 100 * 100, 100)}%`,
                background: latencyColor(health?.dbLatency ?? 0),
              }} className={styles.progressValue} />
            </div>
          </div>
        </Card>

        {/* Memory RSS */}
        <Card>
          <div className={styles.metricCard}>
            <div className="ui-hstack-2">
              <Cpu className={styles.blueIcon} size={18} />
              <span className={styles.metricLabel}>Memory (RSS)</span>
            </div>
            <div className={styles.metricValue}>
              {health?.memoryUsage?.rss ?? '—'} MB
            </div>
          </div>
        </Card>

        {/* Heap Used */}
        <Card>
          <div className={styles.metricCard}>
            <div className="ui-hstack-2">
              <Cpu className={styles.purpleIcon} size={18} />
              <span className={styles.metricLabel}>Heap Used / Total</span>
            </div>
            <div className={styles.metricValue} style={{ color: memoryColor(health?.memoryUsage?.heapUsed ?? 0, health?.memoryUsage?.heapTotal ?? 1) }}>
              {health?.memoryUsage?.heapUsed ?? '—'} / {health?.memoryUsage?.heapTotal ?? '—'} MB
            </div>
            <div className={styles.progressTrack}>
              <div style={{
                width: `${health?.memoryUsage?.heapTotal ? (health.memoryUsage.heapUsed / health.memoryUsage.heapTotal * 100) : 0}%`,
                background: memoryColor(health?.memoryUsage?.heapUsed ?? 0, health?.memoryUsage?.heapTotal ?? 1),
              }} className={styles.progressValue} />
            </div>
          </div>
        </Card>
      </div>
    </div>
    </RouteGuard>
  );
}
