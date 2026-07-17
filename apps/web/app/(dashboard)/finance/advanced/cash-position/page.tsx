'use client';

import styles from './page.module.css';
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
    <div className="ui-stack-6">
      <PageHeader title="Cash Position" description="Real-time view of cash across all bank accounts and payment processors"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Cash Position' }]}
      />

      <div className={styles.s1}>
        <KPICard title="Total Cash" value={fmtCurrency(totalCash)} icon={<DollarSign size={20} />} color="var(--color-primary)" />
        <KPICard title="Operating Cash" value={fmtCurrency(operatingCash)} icon={<Wallet size={20} />} color="var(--color-success)" />
        <KPICard title="Reserves" value={fmtCurrency(340000)} icon={<Landmark size={20} />} color="var(--color-info)" />
        <KPICard title="Net Change (Today)" value="+$23,400" change={4.2} changeLabel="vs yesterday" icon={<TrendingUp size={20} />} color="var(--color-success)" />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Daily Cash Flow" subtitle="Inflows vs outflows this week" data={DAILY_POSITIONS}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'inflows', name: 'Inflows', color: 'var(--color-success)' }, { dataKey: 'outflows', name: 'Outflows', color: 'var(--color-danger)' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'line']} height={280} />

        <Card>
          <div className="p-4 ui-stack-3">
            <h3 className={styles.s2}>Account Balances</h3>
            {ACCOUNTS.map((acc) => (
              <div key={acc.name} className={styles.s3}>
                <div>
                  <div className="ui-heading-sm">{acc.name}</div>
                  <div className="ui-text-xs-tertiary">{acc.type} · {acc.currency}</div>
                </div>
                <span className="ui-heading-sm font-bold">{fmtCurrency(acc.balance)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
