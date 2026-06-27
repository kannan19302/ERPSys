'use client';

import React, { useState } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column, KPICard, DashboardChart, Tabs,
} from '@unerp/ui';
import { Building2, DollarSign, TrendingUp, GitMerge, BarChart3, FileText } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  currency: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  assets: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const ENTITIES: Entity[] = [
  { id: '1', name: 'Acme Corp (Parent)', currency: 'USD', revenue: 2400000, expenses: 1800000, netIncome: 600000, assets: 5200000, status: 'ACTIVE' },
  { id: '2', name: 'Acme Europe GmbH', currency: 'EUR', revenue: 850000, expenses: 720000, netIncome: 130000, assets: 1800000, status: 'ACTIVE' },
  { id: '3', name: 'Acme Asia Pte Ltd', currency: 'SGD', revenue: 620000, expenses: 510000, netIncome: 110000, assets: 1200000, status: 'ACTIVE' },
  { id: '4', name: 'Acme UK Ltd', currency: 'GBP', revenue: 440000, expenses: 380000, netIncome: 60000, assets: 890000, status: 'ACTIVE' },
];

const CONSOLIDATED_TREND = [
  { name: 'Q1', revenue: 980000, expenses: 780000, netIncome: 200000 },
  { name: 'Q2', revenue: 1100000, expenses: 850000, netIncome: 250000 },
  { name: 'Q3', revenue: 1050000, expenses: 810000, netIncome: 240000 },
  { name: 'Q4', revenue: 1180000, expenses: 970000, netIncome: 210000 },
];

const fmtCurrency = (n: number) => `$${(n / 1000).toFixed(0)}K`;
const fmtFull = (n: number) => `$${n.toLocaleString()}`;

export default function ConsolidationPage() {
  const [activeTab, setActiveTab] = useState('entities');
  const totalRevenue = ENTITIES.reduce((a, e) => a + e.revenue, 0);
  const totalNet = ENTITIES.reduce((a, e) => a + e.netIncome, 0);
  const totalAssets = ENTITIES.reduce((a, e) => a + e.assets, 0);

  const columns: Column<Entity>[] = [
    {
      key: 'name', header: 'Entity',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.currency}</div>
          </div>
        </div>
      ),
    },
    { key: 'revenue', header: 'Revenue', align: 'right' as const, render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{fmtFull(row.revenue)}</span> },
    { key: 'expenses', header: 'Expenses', align: 'right' as const, render: (row) => <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{fmtFull(row.expenses)}</span> },
    {
      key: 'netIncome', header: 'Net Income', align: 'right' as const,
      render: (row) => <span style={{ fontWeight: 'var(--weight-bold)', color: row.netIncome >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{fmtFull(row.netIncome)}</span>,
    },
    { key: 'assets', header: 'Total Assets', align: 'right' as const, render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{fmtFull(row.assets)}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'default'}>{row.status}</Badge> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Financial Consolidation" description="Multi-entity consolidated financial statements and inter-company eliminations"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Consolidation' }]}
        actions={<Button variant="primary" onClick={() => {}}><GitMerge size={14} style={{ marginRight: 6 }} /> Run Consolidation</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Consolidated Revenue" value={fmtFull(totalRevenue)} icon={<TrendingUp size={20} />} color="var(--color-success)" />
        <KPICard title="Consolidated Net Income" value={fmtFull(totalNet)} icon={<DollarSign size={20} />} color="var(--color-primary)" />
        <KPICard title="Consolidated Assets" value={fmtFull(totalAssets)} icon={<BarChart3 size={20} />} color="var(--color-info)" />
        <KPICard title="Entities" value={ENTITIES.length} icon={<Building2 size={20} />} color="var(--color-text-secondary)" />
      </div>

      <Tabs tabs={[
        { key: 'entities', label: 'Entities', icon: <Building2 size={14} /> },
        { key: 'trend', label: 'Consolidated Trend', icon: <BarChart3 size={14} /> },
      ]} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'entities' ? (
        <Card padding="none">
          <DataTable columns={columns} data={ENTITIES} rowKey={(r) => r.id} emptyTitle="No entities" emptyMessage="Add subsidiary entities for consolidation." emptyIcon={<Building2 size={48} />} />
        </Card>
      ) : (
        <DashboardChart title="Quarterly Consolidated P&L" subtitle="Revenue, expenses, and net income across all entities"
          data={CONSOLIDATED_TREND}
          config={{ xAxisKey: 'name', series: [
            { dataKey: 'revenue', name: 'Revenue', color: '#22c55e' },
            { dataKey: 'expenses', name: 'Expenses', color: '#ef4444' },
            { dataKey: 'netIncome', name: 'Net Income', color: '#6366f1' },
          ] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'line', 'stacked-bar']} height={360} />
      )}
    </div>
  );
}
