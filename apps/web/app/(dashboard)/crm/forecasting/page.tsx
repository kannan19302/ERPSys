'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Badge } from '@unerp/ui';
import {
  TrendingUp, TrendingDown, DollarSign, Target, BarChart3,
  ArrowUp, ArrowDown, Users, Clock, Award
} from 'lucide-react';

interface Forecast { bestCase: number; commit: number; worstCase: number; pipelineDeals: number; }
interface RepPerformance { id: string; name: string; dealsWon: number; revenue: number; avgDealSize: number; avgCycleTimeDays: number; }
interface FunnelStage { label: string; value: number; percentage: number; }
interface SalesTarget { id: string; name: string; period: string; target: number; achieved: number; }

export default function ForecastingPage() {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [reps, setReps] = useState<RepPerformance[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [sortField, setSortField] = useState<keyof RepPerformance>('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      const h = { Authorization: `Bearer ${token || ''}` };
      const fetches = [
        fetch('/api/v1/crm/analytics/forecast', { headers: h }).then(r => r.ok ? r.json() : null),
        fetch('/api/v1/crm/analytics/rep-performance', { headers: h }).then(r => r.ok ? r.json() : null),
        fetch('/api/v1/crm/analytics/conversion-funnel', { headers: h }).then(r => r.ok ? r.json() : null),
        fetch('/api/v1/crm/targets', { headers: h }).then(r => r.ok ? r.json() : null),
      ];
      try {
        const [fc, rp, fn, tg] = await Promise.all(fetches);
        setForecast(fc || mockForecast);
        setReps(Array.isArray(rp) ? rp : (rp?.data || mockReps));
        setFunnel(Array.isArray(fn) ? fn : (fn?.data || mockFunnel));
        setTargets(Array.isArray(tg) ? tg : (tg?.data || mockTargets));
      } catch {
        setForecast(mockForecast);
        setReps(mockReps);
        setFunnel(mockFunnel);
        setTargets(mockTargets);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const mockForecast: Forecast = { bestCase: 1250000, commit: 890000, worstCase: 620000, pipelineDeals: 47 };
  const mockReps: RepPerformance[] = [
    { id: 'r1', name: 'Alice Johnson', dealsWon: 12, revenue: 340000, avgDealSize: 28333, avgCycleTimeDays: 34 },
    { id: 'r2', name: 'Bob Martinez', dealsWon: 9, revenue: 275000, avgDealSize: 30556, avgCycleTimeDays: 41 },
    { id: 'r3', name: 'Carol Nguyen', dealsWon: 15, revenue: 410000, avgDealSize: 27333, avgCycleTimeDays: 28 },
    { id: 'r4', name: 'David Park', dealsWon: 7, revenue: 198000, avgDealSize: 28286, avgCycleTimeDays: 52 },
    { id: 'r5', name: 'Eva Schmidt', dealsWon: 11, revenue: 305000, avgDealSize: 27727, avgCycleTimeDays: 37 },
  ];
  const mockFunnel: FunnelStage[] = [
    { label: 'Total Leads', value: 520, percentage: 100 },
    { label: 'Converted', value: 185, percentage: 35.6 },
    { label: 'Opportunities', value: 92, percentage: 17.7 },
    { label: 'Won', value: 41, percentage: 7.9 },
  ];
  const mockTargets: SalesTarget[] = [
    { id: 't1', name: 'Q2 2026 Revenue', period: 'Q2 2026', target: 500000, achieved: 385000 },
    { id: 't2', name: 'Q2 2026 Deals Closed', period: 'Q2 2026', target: 30, achieved: 22 },
    { id: 't3', name: 'H1 2026 Pipeline', period: 'H1 2026', target: 2000000, achieved: 1450000 },
  ];

  const fmtCurrency = (v: number) => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v.toLocaleString()}`;

  const toggleSort = (field: keyof RepPerformance) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };
  const sortedReps = [...reps].sort((a, b) => {
    const av = a[sortField], bv = b[sortField];
    const cmp = typeof av === 'number' ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
    return sortAsc ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: keyof RepPerformance }) => (
    sortField === field ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : null
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  const kpis = [
    { label: 'Best Case', value: fmtCurrency(forecast!.bestCase), icon: <TrendingUp size={20} />, color: 'var(--color-success)' },
    { label: 'Commit', value: fmtCurrency(forecast!.commit), icon: <Target size={20} />, color: 'var(--color-primary)' },
    { label: 'Worst Case', value: fmtCurrency(forecast!.worstCase), icon: <TrendingDown size={20} />, color: 'var(--color-warning)' },
    { label: 'Pipeline Deals', value: String(forecast!.pipelineDeals), icon: <BarChart3 size={20} />, color: 'var(--color-info)' },
  ];

  const funnelColors = ['var(--color-primary)', 'var(--color-info)', 'var(--color-warning)', 'var(--color-success)'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader title="Sales Forecasting" description="Pipeline forecasts, rep performance, and conversion analytics"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Forecasting' }]} />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {kpis.map(k => (
          <Card key={k.label}>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>{k.icon}</div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{k.label}</div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{k.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Conversion Funnel */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Conversion Funnel</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {funnel.map((stage, idx) => {
                const widthPct = Math.max(stage.percentage, 15);
                return (
                  <div key={stage.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-size-sm)' }}>
                      <span style={{ fontWeight: 500 }}>{stage.label}</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{stage.value.toLocaleString()} ({stage.percentage}%)</span>
                    </div>
                    <div style={{ height: 32, borderRadius: 6, background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{ width: `${widthPct}%`, height: '100%', borderRadius: 6, background: funnelColors[idx], transition: 'width 0.6s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                        {stage.percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Sales Targets */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Target size={18} /> Sales Targets
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {targets.map(t => {
                const pct = Math.min(Math.round((t.achieved / t.target) * 100), 100);
                return (
                  <div key={t.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-size-sm)' }}>
                      <span style={{ fontWeight: 500 }}>{t.name}</span>
                      <Badge variant="secondary">{t.period}</Badge>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--color-border)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 5, background: pct >= 80 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)', transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, minWidth: 44, textAlign: 'right' }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {typeof t.achieved === 'number' && t.achieved >= 1000 ? fmtCurrency(t.achieved) : t.achieved} / {typeof t.target === 'number' && t.target >= 1000 ? fmtCurrency(t.target) : t.target}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Rep Leaderboard */}
      <Card>
        <div style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Award size={18} /> Rep Leaderboard
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {[
                  { key: 'name' as const, label: 'Rep', align: 'left' as const },
                  { key: 'dealsWon' as const, label: 'Deals Won', align: 'right' as const },
                  { key: 'revenue' as const, label: 'Revenue', align: 'right' as const },
                  { key: 'avgDealSize' as const, label: 'Avg Deal Size', align: 'right' as const },
                  { key: 'avgCycleTimeDays' as const, label: 'Avg Cycle (days)', align: 'right' as const },
                ].map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}
                    style={{ textAlign: col.align, padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    {col.label} <SortIcon field={col.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedReps.map((rep, idx) => (
                <tr key={rep.id} style={{ borderBottom: '1px solid var(--color-border)', background: idx === 0 ? 'var(--color-success)08' : undefined }}>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {idx === 0 && <Award size={14} style={{ color: 'var(--color-warning)' }} />}
                    {rep.name}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{rep.dealsWon}</td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(rep.revenue)}</td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{fmtCurrency(rep.avgDealSize)}</td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                    <Clock size={12} style={{ color: 'var(--color-text-secondary)' }} /> {rep.avgCycleTimeDays}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
