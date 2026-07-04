'use client';

import React, { useState } from 'react';
import { BarChart3, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {[
          { label: 'Total Calls (24h)', value: apiMetrics.reduce((s, m) => s + m.calls24h, 0).toLocaleString(), icon: <BarChart3 size={20} />, color: 'var(--color-primary)' },
          { label: 'Avg Latency', value: `${(apiMetrics.reduce((s, m) => s + m.avgLatencyMs, 0) / apiMetrics.length).toFixed(0)} ms`, icon: <Clock size={20} />, color: 'var(--color-success)' },
          { label: 'Error Rate', value: `${(apiMetrics.reduce((s, m) => s + m.errorRate, 0) / apiMetrics.length).toFixed(1)}%`, icon: <AlertTriangle size={20} />, color: 'var(--color-warning)' },
          { label: 'Uptime', value: '99.97%', icon: <CheckCircle size={20} />, color: 'var(--color-success)' },
        ].map((m, i) => (
          <div key={i} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: m.color }}>{m.icon}</div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{m.label}</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              {['Endpoint', 'Calls (24h)', 'Avg Latency', 'P99 Latency', 'Error Rate'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apiMetrics.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <code style={{ fontSize: '12px', color: 'var(--color-primary)' }}>{m.endpoint}</code>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{m.calls24h.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ color: m.avgLatencyMs < 50 ? 'var(--color-success)' : m.avgLatencyMs < 100 ? 'var(--color-warning)' : 'var(--color-error)' }}>{m.avgLatencyMs} ms</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ color: m.p99LatencyMs < 200 ? 'var(--color-success)' : m.p99LatencyMs < 500 ? 'var(--color-warning)' : 'var(--color-error)' }}>{m.p99LatencyMs} ms</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: m.errorRate < 1 ? 'var(--color-success)' : 'var(--color-error)', background: m.errorRate < 1 ? 'var(--color-success-light)' : 'var(--color-error-light)', fontWeight: 'var(--weight-semibold)' }}>{m.errorRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
