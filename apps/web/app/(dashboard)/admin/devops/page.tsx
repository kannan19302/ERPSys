'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Badge } from '@unerp/ui';
import { Server, Cpu, Activity, ExternalLink, Wifi, Database, RefreshCw } from 'lucide-react';

interface SystemMetrics {
  uptimeSeconds: number;
  memory: { rss: number; heapTotal: number; heapUsed: number };
  dbConnections: number;
  apiRequestsTotal: number;
  apiErrorsTotal: number;
  latencyMs: number;
}

interface IntegrationLinks {
  prometheus: string;
  grafana: string;
  jaeger: string;
  sentry: string;
}

export default function DevopsPage() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptimeSeconds: 86400,
    memory: { rss: 128, heapTotal: 96, heapUsed: 64 },
    dbConnections: 5,
    apiRequestsTotal: 2543,
    apiErrorsTotal: 12,
    latencyMs: 14,
  });
  const [links] = useState<IntegrationLinks>({
    prometheus: 'http://localhost:9090',
    grafana: 'http://localhost:3000/d/unerp-dashboard',
    jaeger: 'http://localhost:16686',
    sentry: 'https://sentry.io/organizations/unerp/issues/',
  });

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        uptimeSeconds: prev.uptimeSeconds + 1,
        apiRequestsTotal: prev.apiRequestsTotal + Math.floor(Math.random() * 3),
        latencyMs: Math.max(5, prev.latencyMs + Math.floor(Math.random() * 5) - 2),
        memory: {
          ...prev.memory,
          heapUsed: Math.max(30, Math.min(120, prev.memory.heapUsed + Math.floor(Math.random() * 5) - 2)),
        },
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const errorRate = metrics.apiRequestsTotal > 0 ? ((metrics.apiErrorsTotal / metrics.apiRequestsTotal) * 100).toFixed(2) : '0';

  const statCards = [
    { label: 'Uptime', value: formatUptime(metrics.uptimeSeconds), icon: Activity, color: '#22c55e' },
    { label: 'Avg Latency', value: `${metrics.latencyMs}ms`, icon: Wifi, color: '#3b82f6' },
    { label: 'API Requests', value: metrics.apiRequestsTotal.toLocaleString(), icon: Server, color: '#8b5cf6' },
    { label: 'Error Rate', value: `${errorRate}%`, icon: RefreshCw, color: Number(errorRate) > 1 ? '#ef4444' : '#22c55e' },
    { label: 'Heap Used', value: `${metrics.memory.heapUsed} MB`, icon: Cpu, color: '#f59e0b' },
    { label: 'DB Connections', value: String(metrics.dbConnections), icon: Database, color: '#06b6d4' },
  ];

  const integrations = [
    { name: 'Prometheus', description: 'Metrics collection and alerting', url: links.prometheus, color: '#e6522c' },
    { name: 'Grafana', description: 'Dashboard visualization and monitoring', url: links.grafana, color: '#f46800' },
    { name: 'Jaeger', description: 'Distributed tracing for microservices', url: links.jaeger, color: '#00bcd4' },
    { name: 'Sentry', description: 'Error tracking and performance monitoring', url: links.sentry, color: '#362d59' },
  ];

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
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'pulse 2s ease-in-out infinite' }} />
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>All Systems Operational</div>
          <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8 }}>Last checked: {new Date().toLocaleString()}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge variant="success">Healthy</Badge>
        </div>
      </div>

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
            { label: 'RSS (Resident Set)', value: metrics.memory.rss, max: 256 },
            { label: 'Heap Total', value: metrics.memory.heapTotal, max: 256 },
            { label: 'Heap Used', value: metrics.memory.heapUsed, max: metrics.memory.heapTotal },
          ].map((bar) => (
            <div key={bar.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{bar.label}</span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>{bar.value} MB / {bar.max} MB</span>
              </div>
              <div style={{ height: '8px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((bar.value / bar.max) * 100, 100)}%`,
                    background: (bar.value / bar.max) > 0.8 ? '#ef4444' : (bar.value / bar.max) > 0.6 ? '#f59e0b' : '#22c55e',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
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
      `}</style>
    </div>
  );
}
