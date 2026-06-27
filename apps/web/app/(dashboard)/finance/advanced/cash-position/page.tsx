'use client';

import React, { useState } from 'react';
import {
  PageHeader, Card, KPICard, DashboardChart, MiniBarChart, Badge,
} from '@unerp/ui';
import { DollarSign, TrendingUp, TrendingDown, Landmark, Wallet, ArrowRight } from 'lucide-react';

const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const ACCOUNTS = [
  { name: 'Chase Business Checking', balance: 125400, currency: 'USD', type: 'Operating' },
  { name: 'Wells Fargo Savings', balance: 340000, currency: 'USD', type: 'Reserves' },
  { name: 'PayPal Business', balance: 8920, currency: 'USD', type: 'Operating' },
  { name: 'Stripe Balance', balance: 14300, currency: 'USD', type: 'Operating' },
  { name: 'EUR Account', balance: 22500, currency: 'EUR', type: 'Foreign' },
];

const DAILY_POSITIONS = [
  { name: 'Mon', inflows: 28000, outflows: 15000 },
  { name: 'Tue', inflows: 12000, outflows: 22000 },
  { name: 'Wed', inflows: 45000, outflows: 8000 },
  { name: 'Thu', inflows: 18000, outflows: 31000 },
  { name: 'Fri', inflows: 32000, outflows: 12000 },
];

export default function CashPositionPage() {
  const totalCash = ACCOUNTS.reduce((a, acc) => a + acc.balance, 0);
  const operatingCash = ACCOUNTS.filter(a => a.type === 'Operating').reduce((a, acc) => a + acc.balance, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Cash Position" description="Real-time view of cash across all bank accounts and payment processors"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Cash Position' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Cash" value={fmtCurrency(totalCash)} icon={<DollarSign size={20} />} color="var(--color-primary)" />
        <KPICard title="Operating Cash" value={fmtCurrency(operatingCash)} icon={<Wallet size={20} />} color="var(--color-success)" />
        <KPICard title="Reserves" value={fmtCurrency(340000)} icon={<Landmark size={20} />} color="var(--color-info)" />
        <KPICard title="Net Change (Today)" value="+$23,400" change={4.2} changeLabel="vs yesterday" icon={<TrendingUp size={20} />} color="var(--color-success)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <DashboardChart title="Daily Cash Flow" subtitle="Inflows vs outflows this week" data={DAILY_POSITIONS}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'inflows', name: 'Inflows', color: '#22c55e' }, { dataKey: 'outflows', name: 'Outflows', color: '#ef4444' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'line']} height={280} />

        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Account Balances</h3>
            {ACCOUNTS.map((acc) => (
              <div key={acc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{acc.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{acc.type} · {acc.currency}</div>
                </div>
                <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{fmtCurrency(acc.balance)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
