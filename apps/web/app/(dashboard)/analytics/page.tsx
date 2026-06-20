'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

interface KPI {
  id: string;
  code: string;
  name: string;
  value: string;
  unit?: string;
  trend?: number[];
  target?: number;
  targetValue?: string;
  progressPct?: number;
  changePct?: number;
}

interface Dashboard {
  id: string;
  name: string;
}

interface Report {
  id: string;
  name: string;
  type: string;
}

interface Drilldown {
  code: string;
  columns: string[];
  rows: Record<string, string | number | boolean>[];
}

const API = 'http://localhost:3001/api/v1/analytics';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<{ kpi: KPI; data: Drilldown | null; loading: boolean } | null>(null);
  const [exporting, setExporting] = useState(false);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const loadData = async () => {
    try {
      const headers = authHeaders();
      const [kpiRes, dashRes, repRes] = await Promise.all([
        fetch(`${API}/kpis`, { headers }),
        fetch(`${API}/dashboards`, { headers }),
        fetch(`${API}/reports`, { headers }),
      ]);
      const [kpisData, dashData, repData] = await Promise.all([kpiRes.json(), dashRes.json(), repRes.json()]);

      setKpis(Array.isArray(kpisData) ? kpisData : []);
      setDashboards(Array.isArray(dashData) ? dashData : []);
      if (Array.isArray(dashData) && dashData.length > 0) setSelectedDashboard(dashData[0].id);
      setReports(Array.isArray(repData) ? repData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDrilldown = async (kpi: KPI) => {
    setDrilldown({ kpi, data: null, loading: true });
    try {
      const res = await fetch(`${API}/kpis/${kpi.code}/drilldown`, { headers: authHeaders() });
      const data = res.ok ? await res.json() : null;
      setDrilldown({ kpi, data, loading: false });
    } catch {
      setDrilldown({ kpi, data: null, loading: false });
    }
  };

  const exportDataset = async (dataset: string) => {
    setExporting(true);
    try {
      const res = await fetch(`${API}/export/${dataset}`, { headers: authHeaders() });
      if (!res.ok) {
        alert('Export failed.');
        return;
      }
      const payload = await res.json();
      const blob = new Blob([payload.content], { type: payload.mimeType || 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = payload.filename || `${dataset}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export error.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Executive Dashboard...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Sparkles style={{ color: 'var(--color-primary)' }} />
            Business Intelligence Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Monitor KPIs against goals, drill into source records, and export live data sets.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <Calendar size={16} /> Date Range
          </button>
          <button onClick={() => exportDataset('invoices')} disabled={exporting} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', border: 'none',
            color: '#ffffff', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: exporting ? 'wait' : 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* KPI Grid with goal tracking */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {kpis.map((kpi: KPI) => {
          const up = (kpi.changePct ?? 0) >= 0;
          const progress = kpi.progressPct ?? 0;
          return (
            <div key={kpi.id} onClick={() => openDrilldown(kpi)} style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column',
              gap: 'var(--space-2)', position: 'relative', overflow: 'hidden', cursor: 'pointer',
              transition: 'border-color var(--duration-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                {kpi.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
                  {kpi.value}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: up ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {up ? '+' : ''}{kpi.changePct ?? 0}%
                </span>
              </div>

              {/* Goal progress bar */}
              {kpi.target !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--space-1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Target size={10} /> Goal: {kpi.targetValue}</span>
                    <span style={{ fontWeight: 'var(--weight-semibold)', color: progress >= 100 ? 'var(--color-success)' : 'var(--color-text)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--color-bg)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress}%`, height: '100%',
                      background: progress >= 100 ? 'var(--color-success)' : 'var(--color-primary)',
                      borderRadius: '999px', transition: 'width var(--duration-base)'
                    }} />
                  </div>
                </div>
              )}

              {/* Sparkline */}
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '32px', gap: '3px', marginTop: 'var(--space-1)' }}>
                {Array.isArray(kpi.trend) && kpi.trend.map((val: number, i: number, arr: number[]) => {
                  const max = Math.max(...arr);
                  const pct = max > 0 ? (val / max) * 100 : 10;
                  return (
                    <div key={i} style={{
                      flex: 1, height: `${pct}%`, background: 'var(--color-primary-light)',
                      borderRadius: '2px', borderTop: '2px solid var(--color-primary)'
                    }} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Board Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>

        <div style={{
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
              {dashboards.find(d => d.id === selectedDashboard)?.name || 'Executive Sales Summary'}
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={loadData} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <RefreshCw size={16} />
              </button>
              <button onClick={() => exportDataset('invoices')} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <Download size={16} />
              </button>
            </div>
          </div>

          {/* CSS Chart View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{
              height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              padding: 'var(--space-4) var(--space-2)', borderLeft: '2px solid var(--color-border)',
              borderBottom: '2px solid var(--color-border)', position: 'relative', marginTop: 'var(--space-4)'
            }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px dashed var(--color-border)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed var(--color-border)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px dashed var(--color-border)' }} />

              {[45, 60, 52, 78, 88, 92, 70, 85, 95, 110, 120, 130].map((val, idx) => (
                <div key={idx} style={{
                  width: '6%', height: `${(val / 130) * 100}%`,
                  background: 'linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                  borderTopLeftRadius: 'var(--radius-sm)', borderTopRightRadius: 'var(--radius-sm)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
                  position: 'relative', zIndex: 1
                }} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 'var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((lbl, idx) => (
                <span key={idx} style={{ width: '6%', textAlign: 'center' }}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel: Reports + export shortcuts */}
        <div style={{
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
        }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Download size={18} style={{ color: 'var(--color-primary)' }} />
            Quick Export
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {['invoices', 'products', 'employees'].map(ds => (
              <button key={ds} onClick={() => exportDataset(ds)} disabled={exporting} style={{
                padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', textTransform: 'capitalize',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                {ds} <Download size={13} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
            Saved Reports
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {reports.map((rep: Report) => (
              <div key={rep.id} style={{
                padding: 'var(--space-3)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', cursor: 'pointer'
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{rep.name}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-secondary)' }}>{rep.type} Report</p>
                </div>
                <Download size={14} style={{ color: 'var(--color-text-secondary)' }} />
              </div>
            ))}
            {reports.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>
                No custom reports saved.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Drill-down modal */}
      {drilldown && (
        <div onClick={() => setDrilldown(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)'
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', width: 'min(800px, 100%)',
            maxHeight: '80vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Target size={18} style={{ color: 'var(--color-primary)' }} />
                {drilldown.kpi.name} — Source Records
              </h2>
              <button onClick={() => setDrilldown(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {drilldown.loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', padding: 'var(--space-6)', justifyContent: 'center' }}>
                <RefreshCw className="animate-spin" size={20} /> Loading records…
              </div>
            )}

            {!drilldown.loading && drilldown.data && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr>
                      {drilldown.data.columns.map(c => (
                        <th key={c} style={{ textAlign: 'left', padding: 'var(--space-2)', borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-secondary)', textTransform: 'capitalize', fontWeight: 'var(--weight-semibold)' }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drilldown.data.rows.map((row, i) => (
                      <tr key={i}>
                        {drilldown.data!.columns.map(c => (
                          <td key={c} style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>{String(row[c])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {drilldown.data.rows.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-4)' }}>No records found.</p>
                )}
              </div>
            )}

            {!drilldown.loading && !drilldown.data && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-4)' }}>
                No drill-down available for this KPI.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
