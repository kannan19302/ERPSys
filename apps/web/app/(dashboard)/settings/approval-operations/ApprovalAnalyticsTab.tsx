'use client';
import styles from './ApprovalAnalyticsTab.module.css';
import React from 'react';
import { Users, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ApprovalAnalyticsTab() {
  return (
    <div className="ui-stack-4">
      <div className="ui-grid-auto">
        {[
          { label: 'Avg Cycle Time', value: '4.2 hrs', trend: '-12%', trendColor: 'var(--color-success)' },
          { label: 'Approval Rate', value: '87.3%', trend: '+2.1%', trendColor: 'var(--color-success)' },
          { label: 'SLA Breach Rate', value: '8.5%', trend: '-3.4%', trendColor: 'var(--color-success)' },
          { label: 'Active Bottleneck', value: 'CFO Review', trend: '6 pending', trendColor: 'var(--color-warning)' },
        ].map((m, i) => (
          <div key={i} className="ui-card p-4">
            <div className={styles.s1}>{m.label}</div>
            <div className="text-2xl">{m.value}</div>
            <div style={{ color: m.trendColor }} className={styles.s2}>
              <TrendingUp size={12} /> {m.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="ui-grid-2">
        <div className="ui-card p-4">
          <h3 className="ui-section-header">
            <Users size={16} className={styles.s10} />
            Approver Workload
          </h3>
          {[
            { name: 'CFO', pending: 6, avgTime: '8.4 hrs', load: 'HIGH' },
            { name: 'VP Operations', pending: 4, avgTime: '3.2 hrs', load: 'MEDIUM' },
            { name: 'HR Director', pending: 2, avgTime: '1.8 hrs', load: 'LOW' },
            { name: 'CTO', pending: 3, avgTime: '5.6 hrs', load: 'MEDIUM' },
            { name: 'General Counsel', pending: 1, avgTime: '12.0 hrs', load: 'HIGH' },
          ].map((a, i) => (
            <div key={i} style={{ borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none' }} className={styles.s3}>
              <div>
                <span className="ui-heading-sm">{a.name}</span>
                <span className={styles.s4}>Avg: {a.avgTime}</span>
              </div>
              <div className="ui-hstack-2">
                <span className={styles.s5}>{a.pending}</span>
                <span style={{ color: a.load === 'HIGH' ? 'var(--color-error)' : a.load === 'MEDIUM' ? 'var(--color-warning)' : 'var(--color-success)', background: a.load === 'HIGH' ? 'var(--color-error-light)' : a.load === 'MEDIUM' ? 'var(--color-warning-light)' : 'var(--color-success-light)' }} className={styles.s6}
                >
                  {a.load}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="ui-card p-4">
          <h3 className="ui-section-header">
            <AlertTriangle size={16} className={styles.s11} />
            Bottleneck Detection
          </h3>
          {[
            { step: 'CFO Financial Approval', avgDelay: '8.4 hrs', breachRate: '22%', impact: 'HIGH' },
            { step: 'Legal NDA Review', avgDelay: '12.0 hrs', breachRate: '35%', impact: 'CRITICAL' },
            { step: 'CTO Technical Sign-off', avgDelay: '5.6 hrs', breachRate: '12%', impact: 'MEDIUM' },
          ].map((b, i) => (
            <div key={i} className={styles.s7}>
              <div className="ui-flex-between">
                <span className="ui-heading-sm">{b.step}</span>
                <span style={{ color: b.impact === 'CRITICAL' ? 'var(--color-error)' : b.impact === 'HIGH' ? 'var(--color-warning)' : 'var(--color-primary)', background: b.impact === 'CRITICAL' ? 'var(--color-error-light)' : b.impact === 'HIGH' ? 'var(--color-warning-light)' : 'var(--color-primary-light)' }} className={styles.s8}
                >
                  {b.impact}
                </span>
              </div>
              <div className={styles.s9}>
                Avg delay: {b.avgDelay} • Breach rate: {b.breachRate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
