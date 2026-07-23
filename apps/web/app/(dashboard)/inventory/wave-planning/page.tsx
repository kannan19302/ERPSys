'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, DataTable, type Column, Button, Modal, TextField, Select, FormField, Badge, StatusBadge, Spinner } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { Plus, Search, Waveform } from 'lucide-react';
import Link from 'next/link';

interface WavePlan {
  id: string; planNumber: string; planType: string; status: string; warehouseId: string | null;
  optimizationStrategy: string; totalOrders: number; totalLines: number; totalItems: number;
  startTime: string | null; endTime: string | null; actualDurationMin: number | null; createdAt: string;
  _count?: { tasks: number };
}

export default function WavePlanningPage() {
  const client = useApiClient();
  const [data, setData] = useState<WavePlan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ planType: 'PICK', optimizationStrategy: 'BATCH', sortMethod: 'ORDER', warehouseId: '', notes: '' });
  const [creating, setCreating] = useState(false);

  const limit = 20;
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<{ data: WavePlan[]; total: number }>(`/inventory/wave-plans?page=${page}&limit=${limit}`);
      setData(res.data); setTotal(res.total);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [client, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await client.post('/inventory/wave-plans', { ...form, tasks: [] });
      setCreateOpen(false);
      fetchData();
    } catch { /* empty */ }
    finally { setCreating(false); }
  };

  const filtered = data.filter(w => !search || w.planNumber.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<WavePlan>[] = [
    { key: 'planNumber', header: 'Plan #', render: (r) => <Link href={`/inventory/wave-planning/${r.id}`} className="ui-link">{r.planNumber}</Link> },
    { key: 'planType', header: 'Type', render: (r) => <Badge>{r.planType}</Badge> },
    { key: 'optimizationStrategy', header: 'Strategy' },
    { key: 'totalLines', header: 'Lines' },
    { key: 'totalItems', header: 'Items' },
    { key: 'tasks', header: 'Tasks', render: (r) => r._count?.tasks ?? 0 },
    { key: 'actualDurationMin', header: 'Duration (min)', render: (r) => r.actualDurationMin ? `${r.actualDurationMin}m` : '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: 'Created', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="ui-page">
      <PageHeader title="Wave Planning" description="Create and manage warehouse picking waves"
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Wave Plan</Button>} />
      <Card>
        <TextField placeholder="Search wave plans..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '1rem' }} />
        <DataTable columns={columns} data={filtered} loading={loading} rowKey={r => r.id}
          pagination={{ page, total, limit, onPageChange: setPage }}
          emptyTitle="No wave plans" emptyMessage="Create your first wave plan to start picking."
          emptyIcon={<Waveform size={48} />} />
      </Card>
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Wave Plan" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <FormField label="Plan Type"><Select value={form.planType} onChange={e => setForm({ ...form, planType: e.target.value })}>
            <option value="PICK">Pick</option><option value="PUTAWAY">Putaway</option><option value="REPLENISH">Replenish</option>
          </Select></FormField>
          <FormField label="Optimization"><Select value={form.optimizationStrategy} onChange={e => setForm({ ...form, optimizationStrategy: e.target.value })}>
            <option value="BATCH">Batch</option><option value="ZONE">Zone</option><option value="ORDER">Order</option><option value="WAVE">Wave</option>
          </Select></FormField>
          <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}
