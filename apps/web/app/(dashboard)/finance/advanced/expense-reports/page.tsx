'use client';

import React, { useState } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard, Tabs,
} from '@unerp/ui';
import { Receipt, Plus, DollarSign, Clock, CheckCircle, XCircle, Upload, Users } from 'lucide-react';

interface ExpenseReport {
  id: string;
  employeeName: string;
  title: string;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';
  submittedAt: string;
  items: number;
  category: string;
}

const MOCK_REPORTS: ExpenseReport[] = [
  { id: '1', employeeName: 'John Smith', title: 'Client Visit - Chicago', totalAmount: 2340, status: 'SUBMITTED', submittedAt: '2026-06-25', items: 5, category: 'Travel' },
  { id: '2', employeeName: 'Sarah Johnson', title: 'Software Licenses Q3', totalAmount: 4500, status: 'APPROVED', submittedAt: '2026-06-20', items: 3, category: 'Software' },
  { id: '3', employeeName: 'Mike Chen', title: 'Team Lunch - Project Kickoff', totalAmount: 320, status: 'REIMBURSED', submittedAt: '2026-06-15', items: 1, category: 'Meals' },
  { id: '4', employeeName: 'Emily Davis', title: 'Office Supplies', totalAmount: 189.50, status: 'DRAFT', submittedAt: '2026-06-27', items: 8, category: 'Supplies' },
];

const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ExpenseManagementPage() {
  const [reports] = useState(MOCK_REPORTS);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const pending = reports.filter(r => r.status === 'SUBMITTED').length;
  const totalPending = reports.filter(r => r.status === 'SUBMITTED').reduce((a, r) => a + r.totalAmount, 0);

  const filtered = activeTab === 'all' ? reports : reports.filter(r => r.status === activeTab);

  const columns: Column<ExpenseReport>[] = [
    {
      key: 'report', header: 'Expense Report',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.title}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.employeeName} · {row.items} items</div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => <Badge variant="info">{row.category}</Badge> },
    { key: 'totalAmount', header: 'Amount', align: 'right' as const, render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmtCurrency(row.totalAmount)}</span> },
    { key: 'submittedAt', header: 'Submitted', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{row.submittedAt}</span> },
    {
      key: 'status', header: 'Status',
      render: (row) => <Badge variant={row.status === 'APPROVED' || row.status === 'REIMBURSED' ? 'success' : row.status === 'REJECTED' ? 'danger' : row.status === 'SUBMITTED' ? 'warning' : 'default'}>{row.status}</Badge>,
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '140px',
      render: (row) => row.status === 'SUBMITTED' ? (
        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={() => {}}>Approve</Button>
          <Button variant="danger" onClick={() => {}}>Reject</Button>
        </div>
      ) : null,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Expense Management" description="Employee expense reports, approvals, and reimbursement tracking"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Expense Management' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Report</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Pending Approval" value={pending} icon={<Clock size={18} />} color="var(--color-warning)" />
        <KPICard title="Pending Amount" value={fmtCurrency(totalPending)} icon={<DollarSign size={18} />} color="var(--color-warning)" />
        <KPICard title="Total Reports" value={reports.length} icon={<Receipt size={18} />} color="var(--color-primary)" />
      </div>

      <Tabs tabs={[
        { key: 'all', label: 'All' }, { key: 'SUBMITTED', label: `Pending (${pending})` },
        { key: 'APPROVED', label: 'Approved' }, { key: 'REIMBURSED', label: 'Reimbursed' },
      ]} value={activeTab} onChange={setActiveTab} />

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id}
          emptyTitle="No expense reports" emptyMessage="Submit your first expense report." emptyIcon={<Receipt size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Expense Report" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary">Submit</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Report Title" placeholder="Client Visit - Chicago" required />
          <FormField label="Category" required>
            <Select><option value="Travel">Travel</option><option value="Meals">Meals & Entertainment</option><option value="Software">Software</option><option value="Supplies">Office Supplies</option><option value="Other">Other</option></Select>
          </FormField>
          <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer' }}>
            <Upload size={24} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-sm)' }}>Upload receipts (PDF, JPG, PNG)</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
