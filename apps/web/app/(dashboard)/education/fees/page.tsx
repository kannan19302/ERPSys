'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { DollarSign, Plus, Search, CreditCard, TrendingUp } from 'lucide-react';

interface FeeStructure {
  id: string;
  name: string;
  description?: string;
  amount: number;
  dueDate: string;
  status?: string;
}

interface StudentFee {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  paidAmount: number;
  status: string;
  student?: { firstName: string; lastName: string };
  feeStructure?: { name: string };
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function FeeManagementPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', amount: 0, dueDate: '' });
  const [activeTab, setActiveTab] = useState<'structures' | 'ledger'>('structures');

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        const [fRes, sfRes] = await Promise.all([
          fetch('/api/v1/ext/education/fee-structures', { headers }),
          fetch('/api/v1/ext/education/student-fees', { headers }),
        ]);
        if (fRes.ok) { const d = await fRes.json(); setStructures(Array.isArray(d) ? d : d?.data || []); }
        if (sfRes.ok) { const d = await sfRes.json(); setStudentFees(Array.isArray(d) ? d : d?.data || []); }
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.amount) return;
    setCreating(true);
    try {
      await fetch('/api/v1/ext/education/fee-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      setCreateOpen(false);
      window.location.reload();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const totalFees = structures.reduce((a, s) => a + Number(s.amount || 0), 0);
  const totalCollected = studentFees.reduce((a, f) => a + Number(f.paidAmount || 0), 0);

  const structureColumns: Column<FeeStructure>[] = [
    {
      key: 'name', header: 'Fee Structure',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>
          {row.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.description}</div>}
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', align: 'right' as const, render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmtCurrency(row.amount)}</span> },
    { key: 'dueDate', header: 'Due Date', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Fee Management" description="Fee structures, student ledger, and payment tracking"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Fees' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Fee Structure</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Fee Structures" value={structures.length} icon={<CreditCard size={18} />} color="var(--color-primary)" />
        <KPICard title="Total Fees Value" value={fmtCurrency(totalFees)} icon={<DollarSign size={18} />} color="var(--color-info)" />
        <KPICard title="Total Collected" value={fmtCurrency(totalCollected)} icon={<TrendingUp size={18} />} color="var(--color-success)" />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-1)' }}>
        {(['structures', 'ledger'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
            border: 'none', borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none', cursor: 'pointer',
            color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}>
            {tab === 'structures' ? 'Fee Structures' : 'Student Ledger'}
          </button>
        ))}
      </div>

      {activeTab === 'structures' && (
        <Card padding="none">
          <DataTable columns={structureColumns} data={structures} rowKey={r => r.id}
            emptyTitle="No fee structures" emptyMessage="Create fee structures to start managing academic fees." emptyIcon={<DollarSign size={48} />} />
        </Card>
      )}

      {activeTab === 'ledger' && (
        <Card padding="none">
          <DataTable
            columns={[
              { key: 'student', header: 'Student', render: (row: StudentFee) => <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{row.student ? `${row.student.firstName} ${row.student.lastName}` : row.studentId}</span> },
              { key: 'fee', header: 'Fee', render: (row: StudentFee) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.feeStructure?.name || row.feeStructureId}</span> },
              { key: 'amount', header: 'Amount', align: 'right' as const, render: (row: StudentFee) => <span>{fmtCurrency(row.amount)}</span> },
              { key: 'paid', header: 'Paid', align: 'right' as const, render: (row: StudentFee) => <span style={{ color: 'var(--color-success)' }}>{fmtCurrency(row.paidAmount)}</span> },
              { key: 'status', header: 'Status', render: (row: StudentFee) => <Badge variant={row.status === 'PAID' ? 'success' : row.status === 'PARTIAL' ? 'warning' : 'danger'}>{row.status}</Badge> },
            ] as Column<StudentFee>[]}
            data={studentFees} rowKey={r => r.id}
            emptyTitle="No student fees" emptyMessage="Student fee records will appear here." emptyIcon={<DollarSign size={48} />}
          />
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Fee Structure" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Fee Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tuition Fee - Fall 2026" />
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Amount ($)" type="number" value={String(form.amount)} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
            <TextField label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
