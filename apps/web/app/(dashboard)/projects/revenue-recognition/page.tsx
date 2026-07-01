'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, DataTable, type Column, KPICard, Spinner } from '@unerp/ui';
import { DollarSign, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';

interface RevenueRow {
  projectId: string;
  name: string;
  code: string;
  status: string;
  budget: number;
  percentComplete: number | null;
  recognizedRevenue: number;
  remainingRevenue: number;
  reason: string | null;
}

const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ProjectRevenueRecognitionPage() {
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/projects/revenue-recognition', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalRecognized = rows.reduce((s, r) => s + r.recognizedRevenue, 0);
  const totalRemaining = rows.reduce((s, r) => s + r.remainingRevenue, 0);
  const unscoped = rows.filter((r) => r.reason).length;

  const columns: Column<RevenueRow>[] = [
    {
      key: 'name', header: 'Project',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)' }}>{row.name}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.code}</div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'COMPLETED' ? 'success' : row.status === 'CANCELLED' ? 'default' : 'info'}>{row.status}</Badge> },
    { key: 'budget', header: 'Budget', align: 'right' as const, render: (row) => fmtCurrency(row.budget) },
    {
      key: 'percentComplete', header: '% Complete', align: 'right' as const,
      render: (row) => (row.percentComplete === null ? <span style={{ color: 'var(--color-text-tertiary)' }}>—</span> : `${row.percentComplete}%`),
    },
    {
      key: 'recognizedRevenue', header: 'Recognized Revenue', align: 'right' as const,
      render: (row) => <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-success)' }}>{fmtCurrency(row.recognizedRevenue)}</span>,
    },
    { key: 'remainingRevenue', header: 'Remaining', align: 'right' as const, render: (row) => fmtCurrency(row.remainingRevenue) },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Project Revenue Recognition"
        description="Time-based percentage-of-completion revenue recognition schedule across all projects."
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: 'Revenue Recognition' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Contracted Budget" value={fmtCurrency(totalBudget)} icon={<Wallet size={20} />} color="var(--color-text-secondary)" />
        <KPICard title="Recognized Revenue" value={fmtCurrency(totalRecognized)} icon={<TrendingUp size={20} />} color="var(--color-success)" />
        <KPICard title="Remaining to Recognize" value={fmtCurrency(totalRemaining)} icon={<DollarSign size={20} />} color="var(--color-primary)" />
      </div>

      {unscoped > 0 && (
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-warning)' }}>
            <AlertTriangle size={14} />
            {unscoped} project(s) are missing a budget or start/end date and are excluded from the recognition schedule.
          </div>
        </Card>
      )}

      <Card padding="none">
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(r) => r.projectId}
          emptyTitle="No projects"
          emptyMessage="Set a budget, start date, and end date on a project to see its revenue recognition schedule."
          emptyIcon={<DollarSign size={48} />}
        />
      </Card>
    </div>
  );
}
