'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Badge } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
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
  const client = useApiClient();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [links, setLinks] = useState<IntegrationLinks | null>(null);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [metricsData, linksData, errorsData] = await Promise.all([
        client.get<SystemMetrics>('/admin/devops/metrics'),
        client.get<IntegrationLinks>('/admin/devops/integrations'),
        client.get<ErrorEntry[]>('/admin/devops/errors').catch(() => null),
      ]);
      setMetrics(metricsData);
      setLinks(linksData);
      if (errorsData) setErrors(errorsData);
      setLastRefresh(new Date());
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client]);

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
      <div className={styles.p1}>
        <PageHeader
          title="DevOps & Telemetry"
          description="Loading system metrics..."
          breadcrumbs={[{ label: 'Administration' }, { label: 'DevOps' }]}
        />
        <div className={styles.p2}>
          Loading...
        </div>
      </div>
    );
  }

  const errorRate = metrics.apiRequestsTotal > 0 ? ((metrics.apiErrorsTotal / metrics.apiRequestsTotal) * 100).toFixed(2) : '0';

  const statCards = [
    { label: 'Uptime', value: formatUptime(metrics.uptimeSeconds), icon: Activity, color: 'var(--color-success)' },
    { label: 'Avg Latency', value: `${metrics.latencyMs}ms`, icon: Wifi, color: 'var(--color-info)' },
    { label: 'API Requests', value: metrics.apiRequestsTotal.toLocaleString(), icon: Server, color: 'var(--color-primary)' },
    { label: 'Error Rate', value: `${errorRate}%`, icon: AlertTriangle, color: Number(errorRate) > 1 ? 'var(--color-danger)' : 'var(--color-success)' },
    { label: 'Heap Used', value: `${metrics.memory.heapUsed} MB`, icon: Cpu, color: memoryColor(metrics.memory.heapUsed, metrics.memory.heapTotal) },
    { label: 'DB Connections', value: String(metrics.dbConnections), icon: Database, color: 'var(--color-info)' },
  ];

  const integrations = links ? [
    { name: 'Prometheus', description: 'Metrics collection and alerting', url: links.prometheus, color: 'var(--color-warning)' },
    { name: 'Grafana', description: 'Dashboard visualization and monitoring', url: links.grafana, color: 'var(--color-warning)' },
    { name: 'Jaeger', description: 'Distributed tracing for microservices', url: links.jaeger, color: 'var(--color-info)' },
    { name: 'Sentry', description: 'Error tracking and performance monitoring', url: links.sentry, color: 'var(--color-primary)' },
  ] : [];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="DevOps & Telemetry"
        description="Monitor system health, resource utilization, and access observability dashboards."
        breadcrumbs={[{ label: 'Administration' }, { label: 'DevOps' }]}
      />

      {/* Status Banner */}
      <div
        className={styles.s1}
      >
        <div className={styles.p3} />
        <div>
          <div className="ui-heading-base">All Systems Operational</div>
          <div className={styles.p4}>Last refreshed: {lastRefresh.toLocaleString()}</div>
        </div>
        <div className={styles.p5}>
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            style={{ cursor: refreshing ? 'not-allowed' : 'pointer' }} className={styles.s2}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <Badge variant="success">Healthy</Badge>
        </div>
      </div>

      {/* System Info Bar */}
      <Card padding="lg">
        <div className={styles.p6}>
          <div className="ui-hstack-2">
            <Monitor size={14} className="ui-text-tertiary" />
            <span className="ui-text-xs-muted">Node.js</span>
            <span className="ui-text-xs-label">{metrics.nodeVersion}</span>
          </div>
          <div className="ui-hstack-2">
            <Server size={14} className="ui-text-tertiary" />
            <span className="ui-text-xs-muted">Platform</span>
            <span className="ui-text-xs-label">{metrics.platform}</span>
          </div>
          <div className="ui-hstack-2">
            <Clock size={14} className="ui-text-tertiary" />
            <span className="ui-text-xs-muted">Uptime</span>
            <span className="ui-text-xs-label">{formatUptime(metrics.uptimeSeconds)}</span>
          </div>
          <div className="ui-hstack-2">
            <Cpu size={14} className="ui-text-tertiary" />
            <span className="ui-text-xs-muted">CPU (user/sys)</span>
            <span className="ui-text-xs-label">
              {Math.round(metrics.cpuUsage.user / 1000)}ms / {Math.round(metrics.cpuUsage.system / 1000)}ms
            </span>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className={styles.p7}>
        {statCards.map((stat) => (
          <Card key={stat.label} padding="lg" style={{ borderTop: `3px solid ${stat.color}` }}>
            <div className={styles.p8}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div className={styles.p10}>{stat.value}</div>
            <div className={styles.p11}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Memory Bar */}
      <Card padding="lg">
        <h3 className={styles.p12}>Memory Utilization</h3>
        <div className="ui-stack-3">
          {[
            { label: 'RSS (Resident Set)', value: metrics.memory.rss, max: 512 },
            { label: 'Heap Total', value: metrics.memory.heapTotal, max: 512 },
            { label: 'Heap Used', value: metrics.memory.heapUsed, max: metrics.memory.heapTotal },
            { label: 'External', value: metrics.memory.external, max: 128 },
          ].map((bar) => (
            <div key={bar.label}>
              <div className={styles.p13}>
                <span className="ui-text-xs-muted">{bar.label}</span>
                <span className="ui-text-xs-label">{bar.value} MB / {bar.max} MB</span>
              </div>
              <div className={styles.p14}>
                <div
                  style={{ width: `${Math.min((bar.value / bar.max) * 100, 100)}%`, background: memoryColor(bar.value, bar.max) }} className={styles.s3}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Errors */}
      <Card padding="lg">
        <h3 className={styles.p15}>
          <AlertTriangle size={16} className="ui-text-danger" />
          Recent Errors
        </h3>
        {errors.length === 0 ? (
          <div className={styles.p16}>
            No recent errors recorded.
          </div>
        ) : (
          <div className="ui-stack-2">
            {errors.map((err) => (
              <div
                key={err.id}
                className={styles.s4}
              >
                <div>
                  <span className={styles.p17}>{err.entityType}</span>
                  <span className={styles.p18}>{err.entityId}</span>
                  {err.changes && (
                    <span className={styles.p19}>
                      {typeof err.changes === 'object' && err.changes.message ? err.changes.message : JSON.stringify(err.changes).slice(0, 80)}
                    </span>
                  )}
                </div>
                <span className={styles.p20}>
                  {new Date(err.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Integration Links */}
      <h3 className={styles.p21}>Observability Integrations</h3>
      <div className={styles.p22}>
        {integrations.map((intg) => (
          <Card
            key={intg.name}
            padding="lg"
            className={styles.integrationCard}
            style={{ borderLeft: `4px solid ${intg.color}` }}
            onClick={() => window.open(intg.url, '_blank')}
          >
            <div className="ui-flex-between">
              <div>
                <div className={styles.p23}>{intg.name}</div>
                <div className="ui-text-xs-muted">{intg.description}</div>
              </div>
              <ExternalLink size={16} className={styles.p24} />
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
