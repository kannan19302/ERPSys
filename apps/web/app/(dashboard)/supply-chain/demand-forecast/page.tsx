'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Spinner, KPICard, DashboardChart, Badge, FormField, Select,
} from '@unerp/ui';
import { TrendingUp, Package, BarChart3, AlertTriangle, Calendar } from 'lucide-react';

interface ForecastData {
  period: string;
  predicted: number;
  actual?: number;
  product?: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const FALLBACK_FORECAST: ForecastData[] = [
  { period: 'Jul 2026', predicted: 1200, actual: undefined },
  { period: 'Aug 2026', predicted: 1350, actual: undefined },
  { period: 'Sep 2026', predicted: 1100, actual: undefined },
  { period: 'Oct 2026', predicted: 1500, actual: undefined },
  { period: 'Nov 2026', predicted: 1800, actual: undefined },
  { period: 'Dec 2026', predicted: 2200, actual: undefined },
];

const HISTORICAL: ForecastData[] = [
  { period: 'Jan 2026', predicted: 900, actual: 920 },
  { period: 'Feb 2026', predicted: 1000, actual: 980 },
  { period: 'Mar 2026', predicted: 1100, actual: 1150 },
  { period: 'Apr 2026', predicted: 1050, actual: 1020 },
  { period: 'May 2026', predicted: 1200, actual: 1180 },
  { period: 'Jun 2026', predicted: 1300, actual: 1290 },
];

export default function DemandForecastPage() {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/supply-chain/forecast', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) setForecast(await res.json());
        else setForecast(FALLBACK_FORECAST);
      } catch { setForecast(FALLBACK_FORECAST); }
      finally { setLoading(false); }
    })();
  }, []);

  const combined = [...HISTORICAL, ...forecast];
  const totalPredicted = forecast.reduce((a, f) => a + f.predicted, 0);
  const avgAccuracy = HISTORICAL.filter(h => h.actual).length > 0
    ? Math.round(HISTORICAL.filter(h => h.actual).reduce((a, h) => a + (1 - Math.abs((h.actual! - h.predicted) / h.predicted)), 0) / HISTORICAL.filter(h => h.actual).length * 100)
    : 95;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Demand Forecast" description="Predictive demand planning based on historical trends and market signals"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Demand Forecast' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="6-Month Forecast" value={totalPredicted.toLocaleString()} icon={<TrendingUp size={18} />} color="var(--color-primary)" />
        <KPICard title="Forecast Accuracy" value={`${avgAccuracy}%`} icon={<BarChart3 size={18} />} color="var(--color-success)" />
        <KPICard title="Peak Month" value="Dec 2026" icon={<Calendar size={18} />} color="var(--color-warning)" />
      </div>

      <DashboardChart title="Demand Forecast vs Actuals" subtitle="Historical actuals and 6-month projected demand"
        data={combined.map(d => ({ name: d.period, Predicted: d.predicted, Actual: d.actual || null }))}
        config={{ xAxisKey: 'name', series: [
          { dataKey: 'Actual', name: 'Actual', color: '#22c55e' },
          { dataKey: 'Predicted', name: 'Forecast', color: '#6366f1' },
        ] }}
        defaultChartType="line" allowedChartTypes={['line', 'area', 'bar', 'composed']} height={360} />

      <DashboardChart title="Monthly Forecast Breakdown" subtitle="Projected demand units by month"
        data={forecast.map(d => ({ name: d.period, units: d.predicted }))}
        config={{ xAxisKey: 'name', series: [{ dataKey: 'units', name: 'Predicted Units', color: '#6366f1' }] }}
        defaultChartType="bar" allowedChartTypes={['bar', 'area']} height={280} />
    </div>
  );
}
