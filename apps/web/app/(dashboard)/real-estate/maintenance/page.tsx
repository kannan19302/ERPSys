'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Wrench, Plus, DollarSign, AlertTriangle } from 'lucide-react';
interface Maintenance { id: string; propertyId: string; description: string; vendorId?: string; cost?: number; status?: string; property?: { name: string }; createdAt?: string; }
const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function MaintenancePage() {
  const client = useApiClient();
  const [items, setItems] = useState<Maintenance[]>([]); const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ propertyId: '', description: '', vendorId: '', cost: 0 });
  useEffect(() => { (async () => { try { const d = await client.get<Maintenance[] | { data?: Maintenance[] }>('/ext/real-estate/maintenances'); setItems(Array.isArray(d) ? d : d.data || []); } catch {} finally { setLoading(false); } })(); }, [client]);
  const handleCreate = async () => { if (!form.propertyId) return; setCreating(true); try { await client.post('/ext/real-estate/maintenances', {...form, cost: Number(form.cost)}); setCreateOpen(false); window.location.reload(); } catch {} finally { setCreating(false); } };
  const totalCost = items.reduce((a, m) => a + Number(m.cost || 0), 0);
  const columns: Column<Maintenance>[] = [
    { key: 'desc', header: 'Work Order', render: (row) => (<div><div className="ui-heading-sm">{row.description}</div><div className="ui-text-xs-tertiary">{row.property?.name || row.propertyId.slice(0, 8)}</div></div>) },
    { key: 'cost', header: 'Cost', align: 'right' as const, render: (row) => <span className="font-semibold">{row.cost ? fmtCurrency(row.cost) : '—'}</span> },
    { key: 'date', header: 'Date', render: (row) => <span className="text-xs">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={(row.status || 'OPEN') === 'COMPLETED' ? 'success' : 'warning'}>{row.status || 'Open'}</Badge> },
  ];
  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  return (<RouteGuard permission="real-estate.maintenance.read"><div className="ui-stack-6">
    <PageHeader title="Maintenance" description="Work orders and property maintenance tracking" breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Maintenance' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Work Order</Button>} />
    <div className="ui-grid-auto">
      <KPICard title="Work Orders" value={items.length} icon={<Wrench size={18} />} color="var(--color-primary)" />
      <KPICard title="Total Cost" value={fmtCurrency(totalCost)} icon={<DollarSign size={18} />} color="var(--color-warning)" />
    </div>
    <Card padding="none"><DataTable columns={columns} data={items} rowKey={r => r.id} emptyTitle="No work orders" emptyMessage="Create maintenance work orders." emptyIcon={<Wrench size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Work Order" size="md" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
      <div className="ui-stack-4"><TextField label="Property ID" required value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})} /><TextField label="Description" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} /><div className="ui-grid-2 ui-gap-3"><TextField label="Vendor ID" value={form.vendorId} onChange={e => setForm({...form, vendorId: e.target.value})} /><TextField label="Est. Cost ($)" type="number" value={String(form.cost)} onChange={e => setForm({...form, cost: Number(e.target.value)})} /></div></div>
    </Modal>
  </div></RouteGuard>);
}
