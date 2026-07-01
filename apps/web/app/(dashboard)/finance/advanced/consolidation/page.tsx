'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column, KPICard, DashboardChart, Tabs, Spinner,
} from '@unerp/ui';
import { Building2, DollarSign, TrendingUp, GitMerge, BarChart3 } from 'lucide-react';

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

interface QuarterTrend {
  name: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  [key: string]: unknown;
}

interface ConsolidationOverview {
  entities: Entity[];
  consolidated: { revenue: number; expenses: number; netIncome: number; assets: number; entityCount: number };
  eliminations: { total: number; transfers: unknown[] };
  trend: QuarterTrend[];
}

const fmtFull = (n: number) => `$${n.toLocaleString()}`;

export default function ConsolidationPage() {
  const [activeTab, setActiveTab] = useState('entities');
  const [overview, setOverview] = useState<ConsolidationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('admin_token') || '' : '';

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/consolidation/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOverview(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const runConsolidation = async () => {
    setRunning(true);
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), 0, 1).toISOString();
      const periodEnd = now.toISOString();
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/consolidation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ periodStart, periodEnd, eliminateIntercompany: true }),
      });
      if (res.ok) await fetchOverview();
    } finally {
      setRunning(false);
    }
  };

  const entities = overview?.entities || [];
  const trend = overview?.trend || [];
  const totalRevenue = overview?.consolidated.revenue || 0;
  const totalNet = overview?.consolidated.netIncome || 0;
  const totalAssets = overview?.consolidated.assets || 0;

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

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Financial Consolidation" description="Multi-entity consolidated financial statements and inter-company eliminations"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Consolidation' }]}
        actions={
          <Button variant="primary" onClick={runConsolidation} disabled={running}>
            <GitMerge size={14} style={{ marginRight: 6 }} /> {running ? 'Running…' : 'Run Consolidation'}
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Consolidated Revenue" value={fmtFull(totalRevenue)} icon={<TrendingUp size={20} />} color="var(--color-success)" />
        <KPICard title="Consolidated Net Income" value={fmtFull(totalNet)} icon={<DollarSign size={20} />} color="var(--color-primary)" />
        <KPICard title="Consolidated Assets" value={fmtFull(totalAssets)} icon={<BarChart3 size={20} />} color="var(--color-info)" />
        <KPICard title="Entities" value={entities.length} icon={<Building2 size={20} />} color="var(--color-text-secondary)" />
      </div>

      {overview && overview.eliminations.total > 0 && (
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <GitMerge size={14} />
            Inter-company eliminations netted from consolidated totals: <strong>{fmtFull(overview.eliminations.total)}</strong>
          </div>
        </Card>
      )}

      <Tabs tabs={[
        { key: 'entities', label: 'Entities', icon: <Building2 size={14} /> },
        { key: 'trend', label: 'Consolidated Trend', icon: <BarChart3 size={14} /> },
      ]} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'entities' ? (
        <Card padding="none">
          <DataTable columns={columns} data={entities} rowKey={(r) => r.id} emptyTitle="No entities" emptyMessage="Add subsidiary organizations for consolidation." emptyIcon={<Building2 size={48} />} />
        </Card>
      ) : (
        <DashboardChart title="Quarterly Consolidated P&L" subtitle="Revenue, expenses, and net income across all entities"
          data={trend}
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
