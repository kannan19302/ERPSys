'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Badge } from '@unerp/ui';
import { Server, Cpu, Activity, ExternalLink, Wifi, Database, RefreshCw, AlertTriangle, Monitor, Clock } from 'lucide-react';

interface SystemMetrics {
  uptimeSeconds: number;
  memory: { rss: number; heapTotal: number; heapUsed: number; external: number };
  dbConnections: number;
  apiRequestsTotal: number;
  apiErrorsTotal: number;
  latencyMs: number;
  nodeVersion: string;
  platform: string;
  cpuUsage: { user: number; system: number };
}

interface IntegrationLinks {
  prometheus: string;
  grafana: string;
  jaeger: string;
  sentry: string;
}

interface ErrorEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  createdAt: string;
  userId: string;
}

export default function DevopsPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [links, setLinks] = useState<IntegrationLinks | null>(null);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };

      const [metricsRes, linksRes, errorsRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/admin/devops/metrics', { headers }),
        fetch('http://localhost:3001/api/v1/admin/devops/integrations', { headers }),
        fetch('http://localhost:3001/api/v1/admin/devops/errors', { headers }).catch(() => null),
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (linksRes.ok) setLinks(await linksRes.json());
      if (errorsRes && errorsRes.ok) setErrors(await errorsRes.json());
      setLastRefresh(new Date());
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => fetchMetrics(), 10000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const memoryColor = (used: number, total: number) => {
    const pct = total > 0 ? used / total : 0;
    if (pct > 0.8) return 'var(--color-danger)';
    if (pct > 0.5) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  if (loading || !metrics) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
        <PageHeader
          title="DevOps & Telemetry"
          description="Loading system metrics..."
          breadcrumbs={[{ label: 'Administration' }, { label: 'DevOps' }]}
        />
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-8)' }}>
          Loading...
        </div>
      </div>
    );
  }

  const errorRate = metrics.apiRequestsTotal > 0 ? ((metrics.apiErrorsTotal / metrics.apiRequestsTotal) * 100).toFixed(2) : '0';

  const statCards = [
    { label: 'Uptime', value: formatUptime(metrics.uptimeSeconds), icon: Activity, color: 'var(--color-success)' },
    { label: 'Avg Latency', value: `${metrics.latencyMs}ms`, icon: Wifi, color: '#3b82f6' },
    { label: 'API Requests', value: metrics.apiRequestsTotal.toLocaleString(), icon: Server, color: '#8b5cf6' },
    { label: 'Error Rate', value: `${errorRate}%`, icon: AlertTriangle, color: Number(errorRate) > 1 ? 'var(--color-danger)' : 'var(--color-success)' },
    { label: 'Heap Used', value: `${metrics.memory.heapUsed} MB`, icon: Cpu, color: memoryColor(metrics.memory.heapUsed, metrics.memory.heapTotal) },
    { label: 'DB Connections', value: String(metrics.dbConnections), icon: Database, color: '#06b6d4' },
  ];

  const integrations = links ? [
    { name: 'Prometheus', description: 'Metrics collection and alerting', url: links.prometheus, color: '#e6522c' },
    { name: 'Grafana', description: 'Dashboard visualization and monitoring', url: links.grafana, color: '#f46800' },
    { name: 'Jaeger', description: 'Distributed tracing for microservices', url: links.jaeger, color: '#00bcd4' },
    { name: 'Sentry', description: 'Error tracking and performance monitoring', url: links.sentry, color: '#362d59' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="DevOps & Telemetry"
        description="Monitor system health, resource utilization, and access observability dashboards."
        breadcrumbs={[{ label: 'Administration' }, { label: 'DevOps' }]}
      />

      {/* Status Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #065f46, #047857, #059669)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-5) var(--space-6)',
          color: 'var(--color-bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'pulse 2s ease-in-out infinite' }} />
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>All Systems Operational</div>
          <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8 }}>Last refreshed: {lastRefresh.toLocaleString()}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-2) var(--space-3)',
              color: 'inherit',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <Badge variant="success">Healthy</Badge>
        </div>
      </div>

      {/* System Info Bar */}
      <Card padding="lg">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Monitor size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Node.js</span>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>{metrics.nodeVersion}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Server size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Platform</span>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>{metrics.platform}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Clock size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Uptime</span>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>{formatUptime(metrics.uptimeSeconds)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Cpu size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>CPU (user/sys)</span>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
              {Math.round(metrics.cpuUsage.user / 1000)}ms / {Math.round(metrics.cpuUsage.system / 1000)}ms
            </span>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        {statCards.map((stat) => (
          <Card key={stat.label} padding="lg" style={{ borderTop: `3px solid ${stat.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{stat.value}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Memory Bar */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Memory Utilization</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[
            { label: 'RSS (Resident Set)', value: metrics.memory.rss, max: 512 },
            { label: 'Heap Total', value: metrics.memory.heapTotal, max: 512 },
            { label: 'Heap Used', value: metrics.memory.heapUsed, max: metrics.memory.heapTotal },
            { label: 'External', value: metrics.memory.external, max: 128 },
          ].map((bar) => (
            <div key={bar.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{bar.label}</span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>{bar.value} MB / {bar.max} MB</span>
              </div>
              <div style={{ height: '8px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((bar.value / bar.max) * 100, 100)}%`,
                    background: memoryColor(bar.value, bar.max),
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Errors */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
          Recent Errors
        </h3>
        {errors.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            No recent errors recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {errors.map((err) => (
              <div
                key={err.id}
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-sunken)',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-danger)' }}>{err.entityType}</span>
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: 'var(--space-2)' }}>{err.entityId}</span>
                  {err.changes && (
                    <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)' }}>
                      {typeof err.changes === 'object' && err.changes.message ? err.changes.message : JSON.stringify(err.changes).slice(0, 80)}
                    </span>
                  )}
                </div>
                <span style={{ color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                  {new Date(err.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Integration Links */}
      <h3 style={{ margin: '0', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Observability Integrations</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
        {integrations.map((intg) => (
          <Card
            key={intg.name}
            padding="lg"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              borderLeft: `4px solid ${intg.color}`,
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            onClick={() => window.open(intg.url, '_blank')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginBottom: '2px' }}>{intg.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{intg.description}</div>
              </div>
              <ExternalLink size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
            </div>
          </Card>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
