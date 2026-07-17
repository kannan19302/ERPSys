'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard } from '@unerp/ui';
import { MapPin, Plus, Calendar, Clock } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface ServiceDispatch { id: string; ticketId: string; technicianId: string; scheduledTime: string; status: string; ticket?: { title: string; customerName: string; }; }
export default function DispatchBoardPage() {
  const client = useApiClient();
  const [dispatches, setDispatches] = useState<ServiceDispatch[]>([]); const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ticketId: '', technicianId: '', scheduledTime: '', status: 'SCHEDULED' });

  useEffect(() => { (async () => { try { const d = await client.get<ServiceDispatch[] | { data?: ServiceDispatch[] }>('/ext/field-service/dispatches'); setDispatches(Array.isArray(d) ? d : d.data || []); } catch {} finally { setLoading(false); } })(); }, [client]);
  const handleCreate = async () => { if (!form.ticketId || !form.technicianId) return; setCreating(true); try { await client.post('/ext/field-service/dispatches', form); setCreateOpen(false); const d = await client.get<ServiceDispatch[] | { data?: ServiceDispatch[] }>('/ext/field-service/dispatches'); setDispatches(Array.isArray(d) ? d : d.data || []); } catch {} finally { setCreating(false); } };

  const columns: Column<ServiceDispatch>[] = [
    { key: 'ticket', header: 'Ticket', render: (row) => (<div><span className="ui-heading-sm">{row.ticket?.title || row.ticketId.slice(0, 8)}</span><div className="ui-text-xs-tertiary">{row.ticket?.customerName}</div></div>) },
    { key: 'tech', header: 'Technician', render: (row) => <Badge variant="info">Tech: {row.technicianId.slice(0, 8)}</Badge> },
    { key: 'time', header: 'Scheduled Time', render: (row) => <span className="text-sm">{row.scheduledTime ? new Date(row.scheduledTime).toLocaleString() : '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'COMPLETED' ? 'success' : 'warning'}>{row.status}</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (<RouteGuard permission="field-service.dispatch.read"><div className="ui-stack-6">
    <PageHeader title="Dispatch Board" description="Technician dispatch schedules and routing" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Dispatch' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Dispatch</Button>} />
    <div className="ui-grid-auto">
      <KPICard title="Total Dispatches" value={dispatches.length} icon={<MapPin size={18} />} color="var(--color-primary)" />
      <KPICard title="Scheduled" value={dispatches.filter(d => d.status === 'SCHEDULED').length} icon={<Clock size={18} />} color="var(--color-warning)" />
    </div>
    <Card padding="none"><DataTable columns={columns} data={dispatches} rowKey={r => r.id} emptyTitle="No dispatches" emptyMessage="Create a dispatch assignment." emptyIcon={<MapPin size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Dispatch" size="md" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Dispatch'}</Button></>}>
      <div className="ui-stack-4"><TextField label="Ticket ID" required value={form.ticketId} onChange={e => setForm({...form, ticketId: e.target.value})} /><TextField label="Technician ID" required value={form.technicianId} onChange={e => setForm({...form, technicianId: e.target.value})} /><TextField label="Scheduled Time" type="datetime-local" value={form.scheduledTime} onChange={e => setForm({...form, scheduledTime: e.target.value})} /></div>
    </Modal>
  </div></RouteGuard>);
}
