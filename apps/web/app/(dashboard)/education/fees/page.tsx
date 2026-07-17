'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { DollarSign, Plus, Search, CreditCard, TrendingUp } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function FeeManagementPage() {
  const client = useApiClient();
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
        const [fRes, sfRes] = await Promise.all([
          client.get<FeeStructure[] | { data?: FeeStructure[] }>('/ext/education/fee-structures'),
          client.get<StudentFee[] | { data?: StudentFee[] }>('/ext/education/student-fees'),
        ]);
        setStructures(Array.isArray(fRes) ? fRes : fRes.data || []);
        setStudentFees(Array.isArray(sfRes) ? sfRes : sfRes.data || []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreate = async () => {
    if (!form.name || !form.amount) return;
    setCreating(true);
    try {
      await client.post('/ext/education/fee-structures', { ...form, amount: Number(form.amount) });
      setCreateOpen(false);
      setForm({ name: '', description: '', amount: 0, dueDate: '' });
      const d = await client.get<FeeStructure[] | { data?: FeeStructure[] }>('/ext/education/fee-structures');
      setStructures(Array.isArray(d) ? d : d.data || []);
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
          <div className="ui-heading-sm">{row.name}</div>
          {row.description && <div className="ui-text-xs-tertiary">{row.description}</div>}
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', align: 'right' as const, render: (row) => <span className="font-semibold">{fmtCurrency(row.amount)}</span> },
    { key: 'dueDate', header: 'Due Date', render: (row) => <span className="text-sm">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="education.fee.read">
      <div className="ui-stack-6">
      <PageHeader title="Fee Management" description="Fee structures, student ledger, and payment tracking"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Fees' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Add Fee Structure</Button>}
      />

      <div className="ui-grid-auto">
        <KPICard title="Fee Structures" value={structures.length} icon={<CreditCard size={18} />} color="var(--color-primary)" />
        <KPICard title="Total Fees Value" value={fmtCurrency(totalFees)} icon={<DollarSign size={18} />} color="var(--color-info)" />
        <KPICard title="Total Collected" value={fmtCurrency(totalCollected)} icon={<TrendingUp size={18} />} color="var(--color-success)" />
      </div>

      <div className={styles.s1}>
        {(['structures', 'ledger'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s2}>
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
              { key: 'student', header: 'Student', render: (row: StudentFee) => <span className="ui-heading-sm">{row.student ? `${row.student.firstName} ${row.student.lastName}` : row.studentId}</span> },
              { key: 'fee', header: 'Fee', render: (row: StudentFee) => <span className="text-sm">{row.feeStructure?.name || row.feeStructureId}</span> },
              { key: 'amount', header: 'Amount', align: 'right' as const, render: (row: StudentFee) => <span>{fmtCurrency(row.amount)}</span> },
              { key: 'paid', header: 'Paid', align: 'right' as const, render: (row: StudentFee) => <span className="ui-text-success">{fmtCurrency(row.paidAmount)}</span> },
              { key: 'status', header: 'Status', render: (row: StudentFee) => <Badge variant={row.status === 'PAID' ? 'success' : row.status === 'PARTIAL' ? 'warning' : 'danger'}>{row.status}</Badge> },
            ] as Column<StudentFee>[]}
            data={studentFees} rowKey={r => r.id}
            emptyTitle="No student fees" emptyMessage="Student fee records will appear here." emptyIcon={<DollarSign size={48} />}
          />
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Fee Structure" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
        <div className="ui-stack-4">
          <TextField label="Fee Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tuition Fee - Fall 2026" />
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Amount ($)" type="number" value={String(form.amount)} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
            <TextField label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
      </Modal>
      </div>
    </RouteGuard>
  );
}
