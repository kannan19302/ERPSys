'use client';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, Pagination,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Plus, DollarSign, Wallet } from 'lucide-react';
import Link from 'next/link';

interface Budget {
  id: string;
  budgetNumber: string;
  fiscalYear: string;
  category: string;
  totalBudget: number;
  spent: number;
  status: string;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function BudgetsPage() {
  const client = useApiClient();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [sortBy, setSortBy] = useState('budgetNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ budgetNumber: '', fiscalYear: '2026', category: 'MATERIALS', totalBudget: 0 });
  const [saving, setSaving] = useState(false);

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', sortBy, sortOrder });
      if (fiscalYear !== 'ALL') params.set('fiscalYear', fiscalYear);
      const res = await client.get<{ data: Budget[]; total: number; page: number; pageCount: number }>(`/supply-chain/budgets?${params}`);
      setBudgets(res.data ?? []);
      setPageCount(res.pageCount ?? 1);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, sortBy, sortOrder, fiscalYear]);

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.budgetNumber) return;
    setSaving(true);
    try {
      await client.post('/supply-chain/budgets', form);
      setCreateOpen(false);
      setForm({ budgetNumber: '', fiscalYear: '2026', category: 'MATERIALS', totalBudget: 0 });
      setPage(1);
      fetchData(1);
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const columns: Column<Budget>[] = [
    {
      key: 'budgetNumber', header: 'Budget #', sortable: true,
      render: (row) => <Link href={`/supply-chain/budgets/${row.id}`} className="ui-link">{row.budgetNumber}</Link>,
    },
    { key: 'fiscalYear', header: 'Fiscal Year', sortable: true },
    { key: 'category', header: 'Category', sortable: true, render: (row) => <Badge variant="info">{row.category}</Badge> },
    { key: 'totalBudget', header: 'Total Budget', sortable: true, render: (row) => fmtCurrency(row.totalBudget) },
    { key: 'spent', header: 'Spent', sortable: true, render: (row) => fmtCurrency(row.spent) },
    {
      key: 'remaining', header: 'Remaining %', sortable: true,
      render: (row) => {
        const pct = row.totalBudget > 0 ? Math.round((row.spent / row.totalBudget) * 100) : 0;
        const barColor = pct > 90 ? 'var(--danger-500)' : pct > 75 ? 'var(--warning-500)' : 'var(--success-500)';
        return (
          <div className="ui-flex ui-gap-2 ui-items-center">
            <div style={{ width: 80, height: 6, background: 'var(--neutral-200)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor, borderRadius: 3 }} />
            </div>
            <span className="ui-text-xs-muted">{100 - pct}%</span>
          </div>
        );
      },
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <RouteGuard permission="supply-chain.budgets.read">
    <div className="ui-stack-6">
      <PageHeader title="Supply Chain Budgets" description="Track and manage supply chain spending across categories"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Budgets' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Budget</Button>}
      />

      <Card>
        <div className="ui-flex ui-gap-3 ui-items-center">
          <Wallet size={18} className="ui-text-secondary" />
          <Select value={fiscalYear} onChange={(e) => { setFiscalYear(e.target.value); setPage(1); }}>
            <option value="ALL">All Fiscal Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </Select>
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={budgets} loading={loading} rowKey={r => r.id}
          sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSort}
          emptyTitle="No budgets" emptyMessage="Create your first supply chain budget." emptyIcon={<DollarSign size={48} />} />
      </Card>

      {pageCount > 1 && (
        <div className="ui-flex ui-justify-center">
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Budget" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={saving}>{saving ? 'Saving...' : 'Create Budget'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <TextField label="Budget #" required placeholder="BGT-2026-001" value={form.budgetNumber} onChange={e => setForm({ ...form, budgetNumber: e.target.value })} />
          <div className="ui-grid-2 ui-gap-3">
            <FormField label="Fiscal Year"><Select value={form.fiscalYear} onChange={e => setForm({ ...form, fiscalYear: e.target.value })}>
              <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
            </Select></FormField>
            <FormField label="Category"><Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="MATERIALS">Materials</option><option value="TRANSPORTATION">Transportation</option><option value="WAREHOUSING">Warehousing</option><option value="CUSTOMS">Customs & Duties</option><option value="LABOR">Labor</option>
            </Select></FormField>
          </div>
          <TextField label="Total Budget ($)" type="number" min={0} step={0.01} value={form.totalBudget || ''} onChange={e => setForm({ ...form, totalBudget: parseFloat(e.target.value) || 0 })} />
        </form>
      </Modal>
    </div>
    </RouteGuard>
  );
}
