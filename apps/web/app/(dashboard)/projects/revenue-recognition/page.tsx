'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, DataTable, type Column, KPICard, Spinner } from '@unerp/ui';
import { DollarSign, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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
  const client = useApiClient();
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setRows(await client.get<RevenueRow[]>('/projects/revenue-recognition'));
    } finally {
      setLoading(false);
    }
  }, [client]);

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
          <div className="font-semibold">{row.name}</div>
          <div className="ui-text-xs-tertiary">{row.code}</div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'COMPLETED' ? 'success' : row.status === 'CANCELLED' ? 'default' : 'info'}>{row.status}</Badge> },
    { key: 'budget', header: 'Budget', align: 'right' as const, render: (row) => fmtCurrency(row.budget) },
    {
      key: 'percentComplete', header: '% Complete', align: 'right' as const,
      render: (row) => (row.percentComplete === null ? <span className="ui-text-tertiary">—</span> : `${row.percentComplete}%`),
    },
    {
      key: 'recognizedRevenue', header: 'Recognized Revenue', align: 'right' as const,
      render: (row) => <span className={styles.p1}>{fmtCurrency(row.recognizedRevenue)}</span>,
    },
    { key: 'remainingRevenue', header: 'Remaining', align: 'right' as const, render: (row) => fmtCurrency(row.remainingRevenue) },
  ];

  if (loading) {
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  return (
    <RouteGuard permission="projects.revenue-recognition.read">
    <div className="ui-stack-6">
      <PageHeader
        title="Project Revenue Recognition"
        description="Time-based percentage-of-completion revenue recognition schedule across all projects."
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: 'Revenue Recognition' }]}
      />

      <div className={styles.p2}>
        <KPICard title="Total Contracted Budget" value={fmtCurrency(totalBudget)} icon={<Wallet size={20} />} color="var(--color-text-secondary)" />
        <KPICard title="Recognized Revenue" value={fmtCurrency(totalRecognized)} icon={<TrendingUp size={20} />} color="var(--color-success)" />
        <KPICard title="Remaining to Recognize" value={fmtCurrency(totalRemaining)} icon={<DollarSign size={20} />} color="var(--color-primary)" />
      </div>

      {unscoped > 0 && (
        <Card padding="md">
          <div className={styles.p3}>
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
    </RouteGuard>
  );
}
