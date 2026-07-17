'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { TrendingUp, Plus, Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface RevenueSchedule {
  id: string;
  contractName: string;
  totalAmount: number;
  recognizedAmount: number;
  startDate: string;
  endDate: string;
  method: string;
  status: string;
  periods: number;
}

const MOCK_SCHEDULES: RevenueSchedule[] = [
  { id: '1', contractName: 'Enterprise License - Wayne Corp', totalAmount: 120000, recognizedAmount: 50000, startDate: '2026-01-01', endDate: '2026-12-31', method: 'STRAIGHT_LINE', status: 'ACTIVE', periods: 12 },
  { id: '2', contractName: 'Professional Services - Stark Industries', totalAmount: 45000, recognizedAmount: 45000, startDate: '2025-10-01', endDate: '2026-03-31', method: 'MILESTONE', status: 'COMPLETED', periods: 6 },
  { id: '3', contractName: 'Annual Maintenance - Daily Planet', totalAmount: 36000, recognizedAmount: 18000, startDate: '2026-01-01', endDate: '2026-12-31', method: 'STRAIGHT_LINE', status: 'ACTIVE', periods: 12 },
];

const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function RevenueRecognitionPage() {
  const [schedules] = useState<RevenueSchedule[]>(MOCK_SCHEDULES);
  const [createOpen, setCreateOpen] = useState(false);

  const totalDeferred = schedules.reduce((acc, s) => acc + (s.totalAmount - s.recognizedAmount), 0);
  const totalRecognized = schedules.reduce((acc, s) => acc + s.recognizedAmount, 0);

  const columns: Column<RevenueSchedule>[] = [
    {
      key: 'contractName', header: 'Contract',
      render: (row) => (
        <div>
          <div className="ui-heading-sm">{row.contractName}</div>
          <div className="ui-text-xs-tertiary">{row.startDate} → {row.endDate}</div>
        </div>
      ),
    },
    { key: 'method', header: 'Method', render: (row) => <Badge variant="info">{row.method.replace('_', ' ')}</Badge> },
    { key: 'totalAmount', header: 'Total', align: 'right' as const, render: (row) => <span className="font-semibold">{fmtCurrency(row.totalAmount)}</span> },
    {
      key: 'progress', header: 'Progress',
      render: (row) => {
        const pct = Math.round((row.recognizedAmount / row.totalAmount) * 100);
        return (
          <div className="ui-hstack-2">
            <div className={styles.s1}>
              <div style={{ width: `${pct}%` }} className={styles.s2} />
            </div>
            <span className={styles.s3}>{pct}%</span>
          </div>
        );
      },
    },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'default'}>{row.status}</Badge> },
  ];

  return (
    <div className="ui-stack-6">
      <PageHeader title="Revenue Recognition" description="Manage deferred revenue schedules and recognition rules"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Revenue Recognition' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Schedule</Button>}
      />

      <div className="ui-grid-auto">
        <KPICard title="Total Contract Value" value={fmtCurrency(schedules.reduce((a, s) => a + s.totalAmount, 0))} icon={<DollarSign size={18} />} color="var(--color-primary)" />
        <KPICard title="Recognized" value={fmtCurrency(totalRecognized)} icon={<CheckCircle size={18} />} color="var(--color-success)" />
        <KPICard title="Deferred" value={fmtCurrency(totalDeferred)} icon={<Clock size={18} />} color="var(--color-warning)" />
      </div>

      <Card padding="none">
        <DataTable columns={columns} data={schedules} rowKey={(row) => row.id}
          emptyTitle="No revenue schedules" emptyMessage="Create a schedule to track deferred revenue recognition." emptyIcon={<TrendingUp size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Revenue Schedule" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary">Create</Button></>}
      >
        <div className="ui-stack-4">
          <TextField label="Contract Name" placeholder="Enterprise License - Customer" required />
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Total Amount ($)" type="number" placeholder="120000" required />
            <FormField label="Recognition Method" required>
              <Select><option value="STRAIGHT_LINE">Straight Line</option><option value="MILESTONE">Milestone</option><option value="PERCENTAGE">Percentage of Completion</option></Select>
            </FormField>
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Start Date" type="date" required />
            <TextField label="End Date" type="date" required />
          </div>
        </div>
      </Modal>
    </div>
  );
}
