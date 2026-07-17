'use client';
import styles from './ApiMetricsTab.module.css';
import React, { useState } from 'react';
import { BarChart3, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';

export default function ApiMetricsTab() {
  const [apiMetrics] = useState([
    { endpoint: 'GET /api/invoices', calls24h: 12450, avgLatencyMs: 42, errorRate: 0.3, p99LatencyMs: 180 },
    { endpoint: 'POST /api/orders', calls24h: 3280, avgLatencyMs: 85, errorRate: 1.2, p99LatencyMs: 420 },
    { endpoint: 'GET /api/products', calls24h: 18900, avgLatencyMs: 28, errorRate: 0.1, p99LatencyMs: 95 },
    { endpoint: 'PUT /api/inventory', calls24h: 2100, avgLatencyMs: 67, errorRate: 0.8, p99LatencyMs: 310 },
    { endpoint: 'GET /api/employees', calls24h: 5600, avgLatencyMs: 35, errorRate: 0.2, p99LatencyMs: 120 },
    { endpoint: 'POST /api/workflows/trigger', calls24h: 890, avgLatencyMs: 125, errorRate: 2.5, p99LatencyMs: 650 },
  ]);

  return (
    <div className="ui-stack-4">
      <div className={styles.s1}>
        {[
          { label: 'Total Calls (24h)', value: apiMetrics.reduce((s, m) => s + m.calls24h, 0).toLocaleString(), icon: <BarChart3 size={20} />, color: 'var(--color-primary)' },
          { label: 'Avg Latency', value: `${(apiMetrics.reduce((s, m) => s + m.avgLatencyMs, 0) / apiMetrics.length).toFixed(0)} ms`, icon: <Clock size={20} />, color: 'var(--color-success)' },
          { label: 'Error Rate', value: `${(apiMetrics.reduce((s, m) => s + m.errorRate, 0) / apiMetrics.length).toFixed(1)}%`, icon: <AlertTriangle size={20} />, color: 'var(--color-warning)' },
          { label: 'Uptime', value: '99.97%', icon: <CheckCircle size={20} />, color: 'var(--color-success)' },
        ].map((m, i) => (
          <div key={i} className={styles.s2}>
            <div style={{ color: m.color }}>{m.icon}</div>
            <div>
              <div className="ui-text-xs-muted">{m.label}</div>
              <div className={styles.s3}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      <ListPageTemplate
        columns={[
          { key: 'endpoint', header: 'Endpoint', render: (v) => <code className={styles.s4}>{String(v)}</code> },
          { key: 'calls24h', header: 'Calls (24h)', render: (v) => <span className="font-semibold">{Number(v).toLocaleString()}</span> },
          { key: 'avgLatencyMs', header: 'Avg Latency', render: (v) => <span style={{ color: Number(v) < 50 ? 'var(--color-success)' : Number(v) < 100 ? 'var(--color-warning)' : 'var(--color-error)' }}>{Number(v)} ms</span> },
          { key: 'p99LatencyMs', header: 'P99 Latency', render: (v) => <span style={{ color: Number(v) < 200 ? 'var(--color-success)' : Number(v) < 500 ? 'var(--color-warning)' : 'var(--color-error)' }}>{Number(v)} ms</span> },
          { key: 'errorRate', header: 'Error Rate', render: (v) => <span style={{ color: Number(v) < 1 ? 'var(--color-success)' : 'var(--color-error)', background: Number(v) < 1 ? 'var(--color-success-light)' : 'var(--color-error-light)' }} className={styles.s5}>{Number(v)}%</span> },
        ] as ListColumn[]}
        data={apiMetrics as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No metrics"
        emptyDescription="No API metrics available."
      />
    </div>
  );
}
