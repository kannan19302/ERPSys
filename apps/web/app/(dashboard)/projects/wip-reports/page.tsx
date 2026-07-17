'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, DataTable, type Column, KPICard, Spinner } from '@unerp/ui';
import { DollarSign, TrendingUp, Wallet, AlertTriangle, ArrowUpDown, Percent } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface ProjectWipRow {
  projectId: string;
  name: string;
  code: string;
  status: string;
  laborCost: number;
  materialCost: number;
  overheadCost: number;
  totalCost: number;
  estimatedCost: number;
  contractValue: number;
  percentComplete: number;
  recognizedRevenue: number;
  billedAmount: number;
  overUnderBilling: number;
  billingStatus: 'UNDERBILLED' | 'OVERBILLED' | 'IN_BALANCE';
}

const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function WipReportsPage() {
  const client = useApiClient();
  const [rows, setRows] = useState<ProjectWipRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setRows(await client.get<ProjectWipRow[]>('/projects/wip-summary'));
    } catch (err) {
      console.error('Failed to fetch WIP summary:', err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate metrics
  const totalContractValue = rows.reduce((s, r) => s + r.contractValue, 0);
  const totalCostIncurred = rows.reduce((s, r) => s + r.totalCost, 0);
  const totalRecognizedRevenue = rows.reduce((s, r) => s + r.recognizedRevenue, 0);
  const totalBilled = rows.reduce((s, r) => s + r.billedAmount, 0);

  const totalWipAssets = rows
    .filter((r) => r.overUnderBilling > 0)
    .reduce((s, r) => s + r.overUnderBilling, 0);

  const totalWipLiabilities = rows
    .filter((r) => r.overUnderBilling < 0)
    .reduce((s, r) => s + Math.abs(r.overUnderBilling), 0);

  const columns: Column<ProjectWipRow>[] = [
    {
      key: 'name',
      header: 'Project',
      render: (row) => (
        <div>
          <div className="font-semibold">{row.name}</div>
          <div className="ui-text-xs-tertiary">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'COMPLETED' ? 'success' : row.status === 'CANCELLED' ? 'default' : 'info'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'estimatedCost',
      header: 'Est. Cost',
      align: 'right' as const,
      render: (row) => fmtCurrency(row.estimatedCost),
    },
    {
      key: 'totalCost',
      header: 'Cost Incurred',
      align: 'right' as const,
      render: (row) => (
        <div>
          <div className="font-semibold">{fmtCurrency(row.totalCost)}</div>
          <div className={styles.p1}>
            L: {Math.round(row.percentComplete)}%
          </div>
        </div>
      ),
    },
    {
      key: 'contractValue',
      header: 'Contract Value',
      align: 'right' as const,
      render: (row) => fmtCurrency(row.contractValue),
    },
    {
      key: 'recognizedRevenue',
      header: 'Recognized Rev',
      align: 'right' as const,
      render: (row) => fmtCurrency(row.recognizedRevenue),
    },
    {
      key: 'billedAmount',
      header: 'Total Billed',
      align: 'right' as const,
      render: (row) => fmtCurrency(row.billedAmount),
    },
    {
      key: 'overUnderBilling',
      header: 'WIP Position',
      align: 'right' as const,
      render: (row) => {
        if (row.overUnderBilling > 0) {
          return (
            <Badge variant="success">
              Underbilled: {fmtCurrency(row.overUnderBilling)}
            </Badge>
          );
        } else if (row.overUnderBilling < 0) {
          return (
            <Badge variant="danger">
              Overbilled: {fmtCurrency(Math.abs(row.overUnderBilling))}
            </Badge>
          );
        } else {
          return <span className="ui-text-tertiary">In Balance</span>;
        }
      },
    },
  ];

  if (loading) {
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RouteGuard permission="projects.wip-reports.read">
    <div className="ui-stack-6">
      <PageHeader
        title="WIP Valuation & Job Costing"
        description="Over/Under-billing WIP report based on Percentage-of-Completion (POC) revenue recognition."
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: 'WIP & Job Costing' }]}
      />

      <div className={styles.p2}>
        <KPICard title="Total Contract Value" value={fmtCurrency(totalContractValue)} icon={<Wallet size={20} />} color="var(--color-text-secondary)" />
        <KPICard title="Total Cost Incurred" value={fmtCurrency(totalCostIncurred)} icon={<DollarSign size={20} />} color="var(--color-primary)" />
        <KPICard title="WIP Assets (Underbilled)" value={fmtCurrency(totalWipAssets)} icon={<TrendingUp size={20} />} color="var(--color-success)" />
        <KPICard title="WIP Liabilities (Overbilled)" value={fmtCurrency(totalWipLiabilities)} icon={<AlertTriangle size={20} />} color="var(--color-danger)" />
      </div>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(r) => r.projectId}
          emptyTitle="No Projects Found"
          emptyMessage="Create a project with estimated costs and log cost entries to generate WIP metrics."
          emptyIcon={<Percent size={48} />}
        />
      </Card>
    </div>
    </RouteGuard>
  );
}
