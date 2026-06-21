'use client';

import React from 'react';
import {
  BarChart3, Users, AlertTriangle, TrendingUp
} from 'lucide-react';

export default function ApprovalAnalyticsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <BarChart3 style={{ color: 'var(--color-primary)' }} />
          Approval Analytics
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Monitor approval cycle times, SLA breach rates, workloads, and bottleneck statistics.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {[
            { label: 'Avg Cycle Time', value: '4.2 hrs', trend: '-12%', trendColor: 'var(--color-success)' },
            { label: 'Approval Rate', value: '87.3%', trend: '+2.1%', trendColor: 'var(--color-success)' },
            { label: 'SLA Breach Rate', value: '8.5%', trend: '-3.4%', trendColor: 'var(--color-success)' },
            { label: 'Active Bottleneck', value: 'CFO Review', trend: '6 pending', trendColor: 'var(--color-warning)' },
          ].map((m, i) => (
            <div key={i} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>{m.label}</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{m.value}</div>
              <div style={{ fontSize: '11px', color: m.trendColor, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'var(--space-1)' }}>
                <TrendingUp size={12} /> {m.trend}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {/* Approver Workload */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>
              <Users size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-primary)' }} />
              Approver Workload
            </h3>
            {[
              { name: 'CFO', pending: 6, avgTime: '8.4 hrs', load: 'HIGH' },
              { name: 'VP Operations', pending: 4, avgTime: '3.2 hrs', load: 'MEDIUM' },
              { name: 'HR Director', pending: 2, avgTime: '1.8 hrs', load: 'LOW' },
              { name: 'CTO', pending: 3, avgTime: '5.6 hrs', load: 'MEDIUM' },
              { name: 'General Counsel', pending: 1, avgTime: '12.0 hrs', load: 'HIGH' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{a.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)' }}>Avg: {a.avgTime}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{a.pending}</span>
                  <span style={{
                    fontSize: '9px', padding: '2px 6px', borderRadius: 'var(--radius-full)',
                    color: a.load === 'HIGH' ? 'var(--color-error)' : a.load === 'MEDIUM' ? 'var(--color-warning)' : 'var(--color-success)',
                    background: a.load === 'HIGH' ? 'var(--color-error-light)' : a.load === 'MEDIUM' ? 'var(--color-warning-light)' : 'var(--color-success-light)',
                  }}>{a.load}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottleneck Detection */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-warning)' }} />
              Bottleneck Detection
            </h3>
            {[
              { step: 'CFO Financial Approval', avgDelay: '8.4 hrs', breachRate: '22%', impact: 'HIGH' },
              { step: 'Legal NDA Review', avgDelay: '12.0 hrs', breachRate: '35%', impact: 'CRITICAL' },
              { step: 'CTO Technical Sign-off', avgDelay: '5.6 hrs', breachRate: '12%', impact: 'MEDIUM' },
            ].map((b, i) => (
              <div key={i} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{b.step}</span>
                  <span style={{
                    fontSize: '9px', padding: '2px 6px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)',
                    color: b.impact === 'CRITICAL' ? 'var(--color-error)' : b.impact === 'HIGH' ? 'var(--color-warning)' : 'var(--color-primary)',
                    background: b.impact === 'CRITICAL' ? 'var(--color-error-light)' : b.impact === 'HIGH' ? 'var(--color-warning-light)' : 'var(--color-primary-light)',
                  }}>{b.impact}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Avg delay: {b.avgDelay} • Breach rate: {b.breachRate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
