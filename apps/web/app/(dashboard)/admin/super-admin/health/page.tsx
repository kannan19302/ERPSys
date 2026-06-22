'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, PageHeader, Spinner } from '@unerp/ui';
import { Server, Database, Cpu, RefreshCw } from 'lucide-react';

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

const MOCK_HEALTH: HealthData = {
  uptime: '14d 6h 32m',
  dbLatency: 4.2,
  memoryUsage: { rss: 256, heapUsed: 128, heapTotal: 512 },
  status: 'healthy',
};

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
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/super-admin/health', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to fetch health data');
      const data = await res.json();
      setHealth(data?.data || data);
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
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="System Health"
        subtitle="Real-time system monitoring with auto-refresh every 30 seconds"
      />

      {error && (
        <div className="frappe-card" style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-yellow-50)',
          color: 'var(--color-yellow-800)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
        }}>
          {error}
        </div>
      )}

      {/* Status + Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: statusColor(health?.status || ''),
          }} />
          <span style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: statusColor(health?.status || ''),
            textTransform: 'capitalize',
          }}>
            {health?.status || 'Unknown'}
          </span>
        </div>
        <button
          className="frappe-btn"
          onClick={fetchHealth}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {/* Uptime */}
        <Card>
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Server size={18} style={{ color: 'var(--color-blue-600)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-gray-600)' }}>Uptime</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              {health?.uptime || '—'}
            </div>
          </div>
        </Card>

        {/* DB Latency */}
        <Card>
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Database size={18} style={{ color: 'var(--color-blue-600)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-gray-600)' }}>DB Latency</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: latencyColor(health?.dbLatency ?? 0) }}>
              {health?.dbLatency ?? '—'} ms
            </div>
            <div style={{
              width: '100%',
              height: 6,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-gray-100)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min((health?.dbLatency ?? 0) / 100 * 100, 100)}%`,
                borderRadius: 'var(--radius-full)',
                background: latencyColor(health?.dbLatency ?? 0),
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </Card>

        {/* Memory RSS */}
        <Card>
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Cpu size={18} style={{ color: 'var(--color-blue-600)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-gray-600)' }}>Memory (RSS)</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              {health?.memoryUsage?.rss ?? '—'} MB
            </div>
          </div>
        </Card>

        {/* Heap Used */}
        <Card>
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Cpu size={18} style={{ color: 'var(--color-purple-600)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-gray-600)' }}>Heap Used / Total</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: memoryColor(health?.memoryUsage?.heapUsed ?? 0, health?.memoryUsage?.heapTotal ?? 1) }}>
              {health?.memoryUsage?.heapUsed ?? '—'} / {health?.memoryUsage?.heapTotal ?? '—'} MB
            </div>
            <div style={{
              width: '100%',
              height: 6,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-gray-100)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${health?.memoryUsage?.heapTotal ? (health.memoryUsage.heapUsed / health.memoryUsage.heapTotal * 100) : 0}%`,
                borderRadius: 'var(--radius-full)',
                background: memoryColor(health?.memoryUsage?.heapUsed ?? 0, health?.memoryUsage?.heapTotal ?? 1),
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
