'use client';
import styles from './page.module.css';
import React from 'react';
import { PageHeader, Card, KPICard, Badge, DashboardChart } from '@unerp/ui';
import { TrendingUp, TrendingDown, DollarSign, Percent, Scale, BarChart3 } from 'lucide-react';

interface Ratio {
  name: string;
  value: number;
  unit: string;
  benchmark: number;
  status: 'good' | 'warning' | 'poor';
  description: string;
}

const RATIOS: Ratio[] = [
  { name: 'Current Ratio', value: 2.4, unit: 'x', benchmark: 2.0, status: 'good', description: 'Current assets / current liabilities' },
  { name: 'Quick Ratio', value: 1.8, unit: 'x', benchmark: 1.0, status: 'good', description: 'Liquid assets / current liabilities' },
  { name: 'Debt-to-Equity', value: 0.45, unit: 'x', benchmark: 1.0, status: 'good', description: 'Total debt / total equity' },
  { name: 'Gross Margin', value: 68.5, unit: '%', benchmark: 60, status: 'good', description: 'Gross profit / revenue' },
  { name: 'Net Margin', value: 14.2, unit: '%', benchmark: 10, status: 'good', description: 'Net income / revenue' },
  { name: 'ROE', value: 18.7, unit: '%', benchmark: 15, status: 'good', description: 'Net income / shareholder equity' },
  { name: 'ROA', value: 9.3, unit: '%', benchmark: 5, status: 'good', description: 'Net income / total assets' },
  { name: 'Days Sales Outstanding', value: 42, unit: 'days', benchmark: 30, status: 'warning', description: 'Average collection period' },
  { name: 'Inventory Turnover', value: 6.2, unit: 'x', benchmark: 8, status: 'warning', description: 'COGS / average inventory' },
  { name: 'Interest Coverage', value: 8.5, unit: 'x', benchmark: 3, status: 'good', description: 'EBIT / interest expense' },
];

const TREND_DATA = [
  { name: 'Jan', currentRatio: 2.1, grossMargin: 65, roe: 16 },
  { name: 'Feb', currentRatio: 2.2, grossMargin: 66, roe: 17 },
  { name: 'Mar', currentRatio: 2.3, grossMargin: 67, roe: 17.5 },
  { name: 'Apr', currentRatio: 2.2, grossMargin: 68, roe: 18 },
  { name: 'May', currentRatio: 2.3, grossMargin: 68, roe: 18.2 },
  { name: 'Jun', currentRatio: 2.4, grossMargin: 68.5, roe: 18.7 },
];

const statusColor = { good: 'var(--color-success)', warning: 'var(--color-warning)', poor: 'var(--color-danger)' };

export default function FinancialRatiosPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader title="Financial Ratios" description="Key financial health indicators with industry benchmarks"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Financial Ratios' }]}
      />

      <div className={styles.s1}>
        <KPICard title="Current Ratio" value="2.4x" icon={<Scale size={18} />} color="var(--color-success)" />
        <KPICard title="Gross Margin" value="68.5%" icon={<Percent size={18} />} color="var(--color-success)" />
        <KPICard title="ROE" value="18.7%" change={2.1} changeLabel="vs last quarter" icon={<TrendingUp size={18} />} color="var(--color-primary)" />
        <KPICard title="DSO" value="42 days" icon={<DollarSign size={18} />} color="var(--color-warning)" />
      </div>

      <DashboardChart title="Ratio Trends" subtitle="Key ratios over the last 6 months" data={TREND_DATA}
        config={{ xAxisKey: 'name', series: [
          { dataKey: 'currentRatio', name: 'Current Ratio', color: '#6366f1' },
          { dataKey: 'grossMargin', name: 'Gross Margin %', color: '#22c55e' },
          { dataKey: 'roe', name: 'ROE %', color: '#f59e0b' },
        ] }}
        defaultChartType="line" allowedChartTypes={['line', 'area']} height={280} />

      <div className={styles.s2}>
        {RATIOS.map((r) => (
          <Card key={r.name}>
            <div className={styles.s3}>
              <div>
                <div className="ui-heading-sm">{r.name}</div>
                <div className={styles.s4}>{r.description}</div>
                <div className={styles.s4}>Benchmark: {r.benchmark}{r.unit}</div>
              </div>
              <div className="text-right">
                <div style={{ color: statusColor[r.status] }} className={styles.s5}>{r.value}{r.unit}</div>
                <Badge variant={r.status === 'good' ? 'success' : r.status === 'warning' ? 'warning' : 'danger'}>{r.status.toUpperCase()}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
