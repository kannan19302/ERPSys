'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertOctagon, Info, RefreshCw, ShieldAlert, Search } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

type Severity = 'critical' | 'warning' | 'info';

interface Insight {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  detail: string;
  metric?: string;
}

interface InsightResponse {
  generatedAt: string;
  scanned: { invoices: number; products: number };
  insights: Insight[];
}

const SEVERITY_STYLE: Record<Severity, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  critical: { color: 'var(--color-danger)', bg: 'var(--color-danger-light, rgba(239,68,68,0.1))', label: 'Critical', icon: <AlertOctagon size={18} /> },
  warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-light, rgba(245,158,11,0.1))', label: 'Warning', icon: <AlertTriangle size={18} /> },
  info: { color: 'var(--color-primary)', bg: 'var(--color-primary-light)', label: 'Info', icon: <Info size={18} /> },
};

export default function SmartInsightsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightResponse | null>(null);
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      setData(await client.get<InsightResponse | null>('/analytics/insights'));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const insights = data?.insights ?? [];
  const counts: Record<Severity, number> = {
    critical: insights.filter(i => i.severity === 'critical').length,
    warning: insights.filter(i => i.severity === 'warning').length,
    info: insights.filter(i => i.severity === 'info').length,
  };
  const filtered = filter === 'all' ? insights : insights.filter(i => i.severity === filter);

  return (
    <RouteGuard permission="analytics.insights.read">
      <div className="ui-stack-6">
      <div className={styles.s1}>
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <ShieldAlert className="ui-text-primary" />
            Smart Insights & Anomaly Detection
          </h1>
          <p className="ui-text-sm-muted">
            Statistical scan of live revenue trends, receivables, and product margins for anomalies and risks.
          </p>
        </div>
        <button onClick={loadData} disabled={loading} style={{ cursor: loading ? 'wait' : 'pointer' }} className={styles.s2}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Scanning…' : 'Re-scan'}
        </button>
      </div>

      {/* Severity summary cards */}
      <div className={styles.s3}>
        {(['critical', 'warning', 'info'] as Severity[]).map(sev => {
          const s = SEVERITY_STYLE[sev];
          const active = filter === sev;
          return (
            <button key={sev} onClick={() => setFilter(active ? 'all' : sev)} style={{ border: `1px solid ${active ? s.color : 'var(--color-border)'}` }} className={styles.s4}>
              <span style={{ color: s.color }} className={styles.s5}>
                {s.icon} {s.label}
              </span>
              <span className="text-2xl">{counts[sev]}</span>
            </button>
          );
        })}
        <div className={styles.s6}>
          <span className={styles.s7}>
            <Search size={16} /> Records Scanned
          </span>
          <span className={styles.s8}>
            {data ? `${data.scanned.invoices} inv / ${data.scanned.products} prod` : '—'}
          </span>
        </div>
      </div>

      {loading && (
        <div className={styles.s9}>
          <RefreshCw className="animate-spin" size={28} />
          <span className={styles.s10}>Running anomaly detection…</span>
        </div>
      )}

      {/* Insight list */}
      {!loading && (
        <div className="ui-stack-3">
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className={styles.s11}>
              ← Show all severities
            </button>
          )}
          {filtered.map(ins => {
            const s = SEVERITY_STYLE[ins.severity];
            return (
              <div key={ins.id} style={{ borderLeft: `4px solid ${s.color}` }} className={styles.s12}>
                <span style={{ color: s.color }} className={styles.s13}>{s.icon}</span>
                <div className="flex-1">
                  <div className={styles.s14}>
                    <span style={{ color: s.color, background: s.bg }} className={styles.s15}>{ins.category}</span>
                    <h3 className={styles.s16}>{ins.title}</h3>
                  </div>
                  <p className={styles.s17}>{ins.detail}</p>
                </div>
                {ins.metric && (
                  <span style={{ color: s.color }} className={styles.s18}>{ins.metric}</span>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className={styles.s19}>
              No insights for this filter.
            </div>
          )}
          {data && (
            <p className={styles.s20}>
              Last scanned {new Date(data.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
