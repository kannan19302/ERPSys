'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertOctagon, Info, RefreshCw, ShieldAlert, Search } from 'lucide-react';

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

const API = 'http://localhost:3001/api/v1/analytics';

const SEVERITY_STYLE: Record<Severity, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  critical: { color: 'var(--color-danger)', bg: 'var(--color-danger-light, rgba(239,68,68,0.1))', label: 'Critical', icon: <AlertOctagon size={18} /> },
  warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-light, rgba(245,158,11,0.1))', label: 'Warning', icon: <AlertTriangle size={18} /> },
  info: { color: 'var(--color-primary)', bg: 'var(--color-primary-light)', label: 'Info', icon: <Info size={18} /> },
};

export default function SmartInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightResponse | null>(null);
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/insights`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = res.ok ? await res.json() : null;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const insights = data?.insights ?? [];
  const counts: Record<Severity, number> = {
    critical: insights.filter(i => i.severity === 'critical').length,
    warning: insights.filter(i => i.severity === 'warning').length,
    info: insights.filter(i => i.severity === 'info').length,
  };
  const filtered = filter === 'all' ? insights : insights.filter(i => i.severity === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldAlert style={{ color: 'var(--color-primary)' }} />
            Smart Insights & Anomaly Detection
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Statistical scan of live revenue trends, receivables, and product margins for anomalies and risks.
          </p>
        </div>
        <button onClick={loadData} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
          cursor: loading ? 'wait' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
        }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Scanning…' : 'Re-scan'}
        </button>
      </div>

      {/* Severity summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
        {(['critical', 'warning', 'info'] as Severity[]).map(sev => {
          const s = SEVERITY_STYLE[sev];
          const active = filter === sev;
          return (
            <button key={sev} onClick={() => setFilter(active ? 'all' : sev)} style={{
              textAlign: 'left', background: 'var(--color-bg-elevated)',
              border: `1px solid ${active ? s.color : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-1)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: s.color, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>
                {s.icon} {s.label}
              </span>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{counts[sev]}</span>
            </button>
          );
        })}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>
            <Search size={16} /> Records Scanned
          </span>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>
            {data ? `${data.scanned.invoices} inv / ${data.scanned.products} prod` : '—'}
          </span>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh', color: 'var(--color-text-secondary)' }}>
          <RefreshCw className="animate-spin" size={28} />
          <span style={{ marginLeft: 'var(--space-2)' }}>Running anomaly detection…</span>
        </div>
      )}

      {/* Insight list */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
              ← Show all severities
            </button>
          )}
          {filtered.map(ins => {
            const s = SEVERITY_STYLE[ins.severity];
            return (
              <div key={ins.id} style={{
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderLeft: `4px solid ${s.color}`, borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-5)',
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)'
              }}>
                <span style={{ color: s.color, marginTop: '2px' }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: s.color, background: s.bg, padding: '2px 8px', borderRadius: '999px' }}>{ins.category}</span>
                    <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{ins.title}</h3>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{ins.detail}</p>
                </div>
                {ins.metric && (
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: s.color, whiteSpace: 'nowrap' }}>{ins.metric}</span>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-6)' }}>
              No insights for this filter.
            </div>
          )}
          {data && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textAlign: 'right', marginTop: 'var(--space-2)' }}>
              Last scanned {new Date(data.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
