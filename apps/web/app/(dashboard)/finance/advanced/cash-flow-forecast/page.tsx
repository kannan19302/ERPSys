'use client';

import React from 'react';
import { PageHeader, Card, KPICard, DashboardChart, Badge } from '@unerp/ui';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Calendar } from 'lucide-react';

const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

const FORECAST_DATA = [
  { name: 'Jul 2026', inflows: 185000, outflows: 142000, net: 43000, balance: 554120 },
  { name: 'Aug 2026', inflows: 210000, outflows: 155000, net: 55000, balance: 609120 },
  { name: 'Sep 2026', inflows: 175000, outflows: 168000, net: 7000, balance: 616120 },
  { name: 'Oct 2026', inflows: 195000, outflows: 148000, net: 47000, balance: 663120 },
  { name: 'Nov 2026', inflows: 160000, outflows: 172000, net: -12000, balance: 651120 },
  { name: 'Dec 2026', inflows: 230000, outflows: 190000, net: 40000, balance: 691120 },
];

const INFLOW_SOURCES = [
  { label: 'Accounts Receivable', value: 680000, color: 'var(--color-success)' },
  { label: 'Recurring Revenue', value: 420000, color: 'var(--color-primary)' },
  { label: 'Other Income', value: 55000, color: 'var(--color-info)' },
];

const OUTFLOW_SOURCES = [
  { label: 'Payroll', value: 480000, color: 'var(--color-danger)' },
  { label: 'Vendor Payments', value: 290000, color: 'var(--color-warning)' },
  { label: 'Operating Expenses', value: 145000, color: '#8b5cf6' },
  { label: 'Taxes', value: 60000, color: 'var(--color-text-secondary)' },
];

export default function CashFlowForecastPage() {
  const totalInflows = FORECAST_DATA.reduce((a, d) => a + d.inflows, 0);
  const totalOutflows = FORECAST_DATA.reduce((a, d) => a + d.outflows, 0);
  const lowMonth = FORECAST_DATA.find(d => d.net < 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Cash Flow Forecast" description="6-month rolling cash flow projection based on AR, AP, and recurring transactions"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Cash Flow Forecast' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Projected Inflows" value={fmtCurrency(totalInflows)} icon={<TrendingUp size={20} />} color="var(--color-success)" />
        <KPICard title="Projected Outflows" value={fmtCurrency(totalOutflows)} icon={<TrendingDown size={20} />} color="var(--color-danger)" />
        <KPICard title="Net Cash Flow" value={fmtCurrency(totalInflows - totalOutflows)} change={((totalInflows - totalOutflows) / totalOutflows * 100)} changeLabel="margin" icon={<DollarSign size={20} />} color="var(--color-primary)" />
        <KPICard title="End Balance (Dec)" value={fmtCurrency(FORECAST_DATA[FORECAST_DATA.length - 1]!.balance)} icon={<Calendar size={20} />} color="var(--color-info)" />
      </div>

      {lowMonth && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.08)', border: '1px solid var(--color-warning)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
          <span>Negative cash flow projected for <strong>{lowMonth.name}</strong> ({fmtCurrency(lowMonth.net)}). Consider accelerating receivables or deferring expenses.</span>
        </div>
      )}

      <DashboardChart title="Cash Flow Projection" subtitle="Monthly inflows, outflows, and running balance"
        data={FORECAST_DATA}
        config={{ xAxisKey: 'name', series: [
          { dataKey: 'inflows', name: 'Inflows', color: '#22c55e' },
          { dataKey: 'outflows', name: 'Outflows', color: '#ef4444' },
          { dataKey: 'balance', name: 'Balance', color: '#6366f1' },
        ] }}
        defaultChartType="composed" allowedChartTypes={['composed', 'area', 'bar', 'line']} height={320} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Inflow Sources</h3>
            {INFLOW_SOURCES.map((s) => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: s.color }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{s.label}</span>
                </div>
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{fmtCurrency(s.value)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Outflow Breakdown</h3>
            {OUTFLOW_SOURCES.map((s) => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: s.color }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{s.label}</span>
                </div>
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{fmtCurrency(s.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
