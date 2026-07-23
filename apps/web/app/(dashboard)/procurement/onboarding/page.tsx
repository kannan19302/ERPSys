'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Modal, TextField, Badge, StatusBadge } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { Plus, Search, UserPlus } from 'lucide-react';

interface Onboarding {
  id: string; vendorId: string; vendorName: string | null; status: string; step: string | null;
  taxId: string | null; assignedTo: string | null; startedAt: string; completedAt: string | null;
}

export default function OnboardingPage() {
  const client = useApiClient();
  const [data, setData] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ vendorId: '', vendorName: '', taxId: '', notes: '' });
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await client.get('/procurement/supplier-onboarding')); }
    catch { /* empty */ }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.vendorId) return;
    setCreating(true);
    try {
      await client.post('/procurement/supplier-onboarding', form);
      setCreateOpen(false); setForm({ vendorId: '', vendorName: '', taxId: '', notes: '' }); fetchData();
    } catch { /* empty */ }
    finally { setCreating(false); }
  };

  const columns: Column<Onboarding>[] = [
    { key: 'vendorName', header: 'Vendor' },
    { key: 'taxId', header: 'Tax ID' },
    { key: 'step', header: 'Current Step', render: (r) => r.step ? <Badge>{r.step.replace(/_/g, ' ')}</Badge> : '—' },
    { key: 'assignedTo', header: 'Assigned To' },
    { key: 'startedAt', header: 'Started', render: (r) => new Date(r.startedAt).toLocaleDateString() },
    { key: 'completedAt', header: 'Completed', render: (r) => r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="ui-page">
      <PageHeader title="Supplier Onboarding" description="Manage supplier registration and qualification workflows"
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Onboarding</Button>} />
      <Card>
        <TextField placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '1rem' }} />
        <DataTable columns={columns} data={data} loading={loading} rowKey={r => r.id}
          emptyTitle="No onboarding workflows" emptyMessage="Start a supplier onboarding workflow." emptyIcon={<UserPlus size={48} />} />
      </Card>
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Start Supplier Onboarding" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <TextField label="Vendor ID" required value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })} />
          <TextField label="Vendor Name" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} />
          <TextField label="Tax ID" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} />
          <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}
