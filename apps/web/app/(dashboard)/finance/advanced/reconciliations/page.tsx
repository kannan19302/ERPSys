'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard, Tabs,
} from '@unerp/ui';
import { GitCompare, Upload, Link2, Unlink, FileText } from 'lucide-react';
import { RouteGuard } from '@unerp/framework';

interface BankStatement {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  matched: boolean;
  matchedTo?: string;
}

interface Reconciliation {
  id: string;
  bankAccountId: string;
  bankName: string;
  statementDate: string;
  status: string;
  matchedCount: number;
  unmatchedCount: number;
  totalTransactions: number;
}

const MOCK_RECONCILIATIONS: Reconciliation[] = [
  { id: '1', bankAccountId: 'ba-1', bankName: 'Chase Business Checking', statementDate: '2026-06-30', status: 'IN_PROGRESS', matchedCount: 45, unmatchedCount: 8, totalTransactions: 53 },
  { id: '2', bankAccountId: 'ba-2', bankName: 'Wells Fargo Savings', statementDate: '2026-05-31', status: 'COMPLETED', matchedCount: 22, unmatchedCount: 0, totalTransactions: 22 },
];

const MOCK_STATEMENTS: BankStatement[] = [
  { id: 's1', date: '2026-06-28', description: 'Wire from Wayne Enterprises', amount: 15000, type: 'CREDIT', matched: true, matchedTo: 'INV-2026-001' },
  { id: 's2', date: '2026-06-27', description: 'Office Rent Payment', amount: 5200, type: 'DEBIT', matched: true, matchedTo: 'EXP-0042' },
  { id: 's3', date: '2026-06-26', description: 'Unknown Transfer', amount: 3400, type: 'CREDIT', matched: false },
  { id: 's4', date: '2026-06-25', description: 'AWS Cloud Services', amount: 890.50, type: 'DEBIT', matched: false },
  { id: 's5', date: '2026-06-24', description: 'Client Payment - Stark Industries', amount: 25000, type: 'CREDIT', matched: true, matchedTo: 'INV-2026-003' },
];

const fmtCurrency = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function BankReconciliationPage() {
  const [reconciliations] = useState(MOCK_RECONCILIATIONS);
  const [statements] = useState(MOCK_STATEMENTS);
  const [activeTab, setActiveTab] = useState('reconciliations');
  const [importOpen, setImportOpen] = useState(false);

  const matchedTotal = statements.filter(s => s.matched).reduce((a, s) => a + s.amount, 0);
  const unmatchedTotal = statements.filter(s => !s.matched).reduce((a, s) => a + s.amount, 0);

  const reconColumns: Column<Reconciliation>[] = [
    {
      key: 'bank', header: 'Bank Account',
      render: (row) => (
        <div>
          <div className="ui-heading-sm">{row.bankName}</div>
          <div className="ui-text-xs-tertiary">Statement: {row.statementDate}</div>
        </div>
      ),
    },
    {
      key: 'progress', header: 'Match Progress',
      render: (row) => {
        const pct = Math.round((row.matchedCount / row.totalTransactions) * 100);
        return (
          <div className="ui-hstack-2">
            <div className={styles.s1}>
              <div style={{ width: `${pct}%`, background: pct === 100 ? 'var(--color-success)' : 'var(--color-primary)' }} className={styles.s2} />
            </div>
            <span className="ui-text-xs-muted">{row.matchedCount}/{row.totalTransactions}</span>
          </div>
        );
      },
    },
    { key: 'unmatched', header: 'Unmatched', render: (row) => row.unmatchedCount > 0 ? <Badge variant="warning">{row.unmatchedCount}</Badge> : <Badge variant="success">0</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'COMPLETED' ? 'success' : 'warning'}>{row.status.replace('_', ' ')}</Badge> },
  ];

  const stmtColumns: Column<BankStatement>[] = [
    { key: 'date', header: 'Date', render: (row) => <span className="text-xs">{row.date}</span> },
    { key: 'description', header: 'Description', render: (row) => <span className="text-sm">{row.description}</span> },
    {
      key: 'amount', header: 'Amount', align: 'right' as const,
      render: (row) => (
        <span style={{ color: row.type === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s3}>
          {row.type === 'DEBIT' ? '-' : '+'}{fmtCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'matched', header: 'Match Status',
      render: (row) => row.matched ? (
        <div className="ui-flex ui-items-center ui-gap-1">
          <Link2 size={12} className="ui-text-success" />
          <span className={styles.s4}>{row.matchedTo}</span>
        </div>
      ) : (
        <Badge variant="warning">Unmatched</Badge>
      ),
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '100px',
      render: (row) => !row.matched ? (
        <Button variant="outline" onClick={() => {}}>Match</Button>
      ) : null,
    },
  ];

  return (
    <RouteGuard permission="finance.reconciliation.read">
    <div className="ui-stack-6">
      <PageHeader title="Bank Reconciliation" description="Import statements, auto-match transactions, and reconcile accounts"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Bank Reconciliation' }]}
        actions={
          <div className="ui-flex ui-gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}><Upload size={14} className="mr-2" /> Import Statement</Button>
            <Button variant="primary" onClick={() => {}}>Auto-Match</Button>
          </div>
        }
      />

      <div className="ui-grid-auto">
        <KPICard title="Matched" value={fmtCurrency(matchedTotal)} icon={<Link2 size={18} />} color="var(--color-success)" />
        <KPICard title="Unmatched" value={fmtCurrency(unmatchedTotal)} icon={<Unlink size={18} />} color="var(--color-warning)" />
        <KPICard title="Transactions" value={statements.length} icon={<FileText size={18} />} color="var(--color-primary)" />
      </div>

      <Tabs tabs={[
        { key: 'reconciliations', label: 'Reconciliations' },
        { key: 'statements', label: 'Statement Lines' },
      ]} value={activeTab} onChange={setActiveTab} />

      <Card padding="none">
        {activeTab === 'reconciliations' ? (
          <DataTable columns={reconColumns} data={reconciliations} rowKey={(r) => r.id} emptyTitle="No reconciliations" emptyMessage="Import a bank statement to start." emptyIcon={<GitCompare size={48} />} />
        ) : (
          <DataTable columns={stmtColumns} data={statements} rowKey={(r) => r.id} emptyTitle="No statements" emptyMessage="Import a CSV bank statement." emptyIcon={<FileText size={48} />} />
        )}
      </Card>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Bank Statement" size="md"
        footer={<><Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button><Button variant="primary">Import</Button></>}
      >
        <div className="ui-stack-4">
          <FormField label="Bank Account" required>
            <Select><option value="">Select bank account...</option><option value="1">Chase Business Checking</option><option value="2">Wells Fargo Savings</option></Select>
          </FormField>
          <TextField label="Statement Date" type="date" required />
          <div className={styles.s5}>
            <Upload size={32} className={styles.s6} />
            <div className="ui-heading-sm">Drop CSV file here or click to browse</div>
            <div className="ui-text-xs-tertiary">Supports CSV, OFX, QFX formats</div>
          </div>
        </div>
      </Modal>
    </div>
    </RouteGuard>
  );
}
