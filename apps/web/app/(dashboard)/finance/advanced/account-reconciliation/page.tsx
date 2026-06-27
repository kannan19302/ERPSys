'use client';

import React, { useState } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column, KPICard, Select, FormField,
} from '@unerp/ui';
import { GitCompare, CheckCircle, AlertTriangle, Search, DollarSign, FileText } from 'lucide-react';

interface ReconciliationItem {
  id: string;
  accountCode: string;
  accountName: string;
  glBalance: number;
  subLedgerBalance: number;
  difference: number;
  status: 'MATCHED' | 'VARIANCE' | 'UNRECONCILED';
  lastReconciled: string | null;
}

const MOCK_ITEMS: ReconciliationItem[] = [
  { id: '1', accountCode: '1100', accountName: 'Accounts Receivable', glBalance: 45200, subLedgerBalance: 45200, difference: 0, status: 'MATCHED', lastReconciled: '2026-06-30' },
  { id: '2', accountCode: '2100', accountName: 'Accounts Payable', glBalance: 28750, subLedgerBalance: 29100, difference: 350, status: 'VARIANCE', lastReconciled: '2026-06-30' },
  { id: '3', accountCode: '1200', accountName: 'Inventory', glBalance: 120000, subLedgerBalance: 120000, difference: 0, status: 'MATCHED', lastReconciled: '2026-06-30' },
  { id: '4', accountCode: '1000', accountName: 'Cash Account', glBalance: 5000, subLedgerBalance: 5000, difference: 0, status: 'MATCHED', lastReconciled: '2026-06-30' },
  { id: '5', accountCode: '4000', accountName: 'Revenue', glBalance: 185000, subLedgerBalance: 185000, difference: 0, status: 'MATCHED', lastReconciled: null },
];

const fmtCurrency = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function AccountReconciliationPage() {
  const [items] = useState(MOCK_ITEMS);
  const matched = items.filter(i => i.status === 'MATCHED').length;
  const variances = items.filter(i => i.status === 'VARIANCE').length;

  const columns: Column<ReconciliationItem>[] = [
    {
      key: 'account', header: 'Account',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.accountCode}</span>
          <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{row.accountName}</span>
        </div>
      ),
    },
    { key: 'glBalance', header: 'GL Balance', align: 'right' as const, render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{fmtCurrency(row.glBalance)}</span> },
    { key: 'subLedgerBalance', header: 'Sub-Ledger', align: 'right' as const, render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{fmtCurrency(row.subLedgerBalance)}</span> },
    {
      key: 'difference', header: 'Difference', align: 'right' as const,
      render: (row) => (
        <span style={{ fontWeight: 'var(--weight-semibold)', color: row.difference === 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {row.difference === 0 ? '$0.00' : fmtCurrency(row.difference)}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (row) => <Badge variant={row.status === 'MATCHED' ? 'success' : row.status === 'VARIANCE' ? 'danger' : 'warning'}>{row.status}</Badge>,
    },
    { key: 'lastReconciled', header: 'Last Reconciled', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.lastReconciled || 'Never'}</span> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Account Reconciliation" description="Match sub-ledger balances to the general ledger and identify variances"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Account Reconciliation' }]}
        actions={<Button variant="primary" onClick={() => {}}>Run Reconciliation</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Accounts Matched" value={matched} icon={<CheckCircle size={18} />} color="var(--color-success)" />
        <KPICard title="Variances Found" value={variances} icon={<AlertTriangle size={18} />} color="var(--color-danger)" />
        <KPICard title="Total Accounts" value={items.length} icon={<FileText size={18} />} color="var(--color-primary)" />
      </div>

      <Card padding="none">
        <DataTable columns={columns} data={items} rowKey={(r) => r.id} emptyTitle="No reconciliation data" emptyMessage="Run a reconciliation to compare GL and sub-ledger balances." emptyIcon={<GitCompare size={48} />} />
      </Card>
    </div>
  );
}
