'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Badge, useToast, Button, Input } from '@unerp/ui';
import {
  TrendingUp, TrendingDown, DollarSign, Target, BarChart3,
  ArrowUp, ArrowDown, Users, Clock, Award
} from 'lucide-react';
import { apiGet } from '../_components/api';

interface Forecast { bestCase: number; commit: number; worstCase: number; pipelineDeals: number; }
interface RepPerformance { id: string; name: string; dealsWon: number; revenue: number; avgDealSize: number; avgCycleTimeDays: number; }
interface RepForecast { userId: string; name: string; pipelineAmount: number; weightedAmount: number; openDeals: number; }
interface FunnelStage { label: string; value: number; percentage: number; }
interface SalesTarget { id: string; name: string; period: string; target: number; achieved: number; }

export default function ForecastingPage() {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [reps, setReps] = useState<RepPerformance[]>([]);
  const [repForecasts, setRepForecasts] = useState<RepForecast[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [sortField, setSortField] = useState<keyof RepPerformance>('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [quotas, setQuotas] = useState<any[]>([]);
  const [newQuota, setNewQuota] = useState({ userId: '', period: '', amount: '' });
  const [submittingQuota, setSubmittingQuota] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [fc, rp, fn, tg, rf, snaps, qts] = await Promise.all([
        apiGet<Forecast>('/crm/analytics/forecast'),
        apiGet<RepPerformance[]>('/crm/analytics/rep-performance'),
        apiGet<FunnelStage[]>('/crm/analytics/conversion-funnel'),
        apiGet<SalesTarget[]>('/crm/targets'),
        apiGet<RepForecast[]>('/crm/analytics/forecast-by-rep'),
        apiGet<any[]>('/crm/expansion/forecast-snapshots'),
        apiGet<any[]>('/crm/expansion/quotas'),
      ]);
      setForecast(fc || { bestCase: 0, commit: 0, worstCase: 0, pipelineDeals: 0 });
      setReps(Array.isArray(rp) ? rp : []);
      setFunnel(Array.isArray(fn) ? fn : []);
      setTargets(Array.isArray(tg) ? tg : []);
      setRepForecasts(Array.isArray(rf) ? rf : []);
      setSnapshots(Array.isArray(snaps) ? snaps : []);
      setQuotas(Array.isArray(qts) ? qts : []);
    } catch (err) {
      toast.error('Could not load forecasting data', err instanceof Error ? err.message : 'Please try again.');
      setForecast({ bestCase: 0, commit: 0, worstCase: 0, pipelineDeals: 0 });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, [toast]);

  const handleCreateQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuota.userId || !newQuota.period || !newQuota.amount) {
      toast.error('Validation Error', 'All fields are required.');
      return;
    }
    setSubmittingQuota(true);
    try {
      // Import apiPost from components helper dynamically or use it directly
      const { apiPost } = await import('../_components/api');
      await apiPost('/crm/expansion/quotas', {
        userId: newQuota.userId,
        period: newQuota.period,
        amount: parseFloat(newQuota.amount),
      });
      toast.success('Success', 'Quota created successfully.');
      setNewQuota({ userId: '', period: '', amount: '' });
      loadData();
    } catch (err) {
      toast.error('Error creating quota', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmittingQuota(false);
    }
  };

  const handleFreezeSnapshot = async (id: string) => {
    try {
      const { apiPut } = await import('../_components/api');
      await apiPut(`/crm/expansion/forecast-snapshots/${id}/freeze`, {});
      toast.success('Success', 'Snapshot frozen.');
      loadData();
    } catch (err) {
      toast.error('Error freezing snapshot', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleAdjustForecast = async (id: string, amount: number) => {
    try {
      const { apiPut } = await import('../_components/api');
      await apiPut(`/crm/expansion/forecast-snapshots/${id}/adjust`, { amount });
      toast.success('Success', 'Forecast override applied.');
      loadData();
    } catch (err) {
      toast.error('Error adjusting forecast', err instanceof Error ? err.message : 'Please try again.');
    }
  };

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
                      <Badge variant="default">{t.period}</Badge>
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

      {/* Pipeline-Weighted Forecast by Rep */}
      <Card>
        <div style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BarChart3 size={18} /> Pipeline-Weighted Forecast by Rep
          </h3>
          {repForecasts.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>No open pipeline assigned to reps.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Rep</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Open Deals</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Pipeline Amount</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Weighted Forecast</th>
                </tr>
              </thead>
              <tbody>
                {repForecasts.map(rf => (
                  <tr key={rf.userId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 500 }}>{rf.name}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{rf.openDeals}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{fmtCurrency(rf.pipelineAmount)}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(rf.weightedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

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

      {/* Forecast Snapshots / Overrides */}
      <Card>
        <div style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
            Forecast Snapshots & Adjustments
          </h3>
          {snapshots.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>No forecast snapshots created yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Snapshot Name</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Quota</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Pipeline</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Won</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Override Forecast</th>
                  <th style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map(snap => (
                  <tr key={snap.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 500 }}>{snap.name}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{fmtCurrency(Number(snap.quotaAmount))}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{fmtCurrency(Number(snap.pipelineAmount))}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{fmtCurrency(Number(snap.wonAmount))}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                      {snap.status === 'FROZEN' ? (
                        <span>{fmtCurrency(Number(snap.forecastAmount))}</span>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                          <Input
                            type="number"
                            defaultValue={snap.forecastAmount}
                            onBlur={(e) => handleAdjustForecast(snap.id, parseFloat(e.target.value))}
                            style={{ width: 100, textAlign: 'right' }}
                          />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      <Badge variant={snap.status === 'FROZEN' ? 'default' : 'success'}>{snap.status}</Badge>
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      {snap.status !== 'FROZEN' && (
                        <Button size="sm" onClick={() => handleFreezeSnapshot(snap.id)}>Freeze</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Quota Management */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
              Assign Sales Quota
            </h3>
            <form onSubmit={handleCreateQuota} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>User ID</label>
                <Input
                  type="text"
                  placeholder="e.g. usr-123"
                  value={newQuota.userId}
                  onChange={(e) => setNewQuota({ ...newQuota, userId: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Period</label>
                <Input
                  type="text"
                  placeholder="e.g. Q3 2026"
                  value={newQuota.period}
                  onChange={(e) => setNewQuota({ ...newQuota, period: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Amount ($)</label>
                <Input
                  type="number"
                  placeholder="e.g. 100000"
                  value={newQuota.amount}
                  onChange={(e) => setNewQuota({ ...newQuota, amount: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={submittingQuota}>
                {submittingQuota ? 'Saving...' : 'Assign Quota'}
              </Button>
            </form>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
              Current Quotas
            </h3>
            {quotas.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>No quotas assigned yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>User ID</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Period</th>
                    <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotas.map((q, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)' }}>{q.userId}</td>
                      <td style={{ padding: 'var(--space-3)' }}>{q.period}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(Number(q.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
