'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard } from '@unerp/ui';
import { MapPin, Plus, Calendar, Clock } from 'lucide-react';

interface ServiceDispatch { id: string; ticketId: string; technicianId: string; scheduledTime: string; status: string; ticket?: { title: string; customerName: string; }; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function DispatchBoardPage() {
  const [dispatches, setDispatches] = useState<ServiceDispatch[]>([]); const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ticketId: '', technicianId: '', scheduledTime: '', status: 'SCHEDULED' });

  useEffect(() => { (async () => { try { const res = await fetch('/api/v1/field-service/dispatches', { headers: { Authorization: `Bearer ${getToken() || ''}` } }); if (res.ok) { const d = await res.json(); setDispatches(Array.isArray(d) ? d : d?.data || []); } } catch {} finally { setLoading(false); } })(); }, []);
  const handleCreate = async () => { if (!form.ticketId || !form.technicianId) return; setCreating(true); try { await fetch('/api/v1/field-service/dispatches', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` }, body: JSON.stringify(form) }); setCreateOpen(false); window.location.reload(); } catch {} finally { setCreating(false); } };

  const columns: Column<ServiceDispatch>[] = [
    { key: 'ticket', header: 'Ticket', render: (row) => (<div><span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.ticket?.title || row.ticketId.slice(0, 8)}</span><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.ticket?.customerName}</div></div>) },
    { key: 'tech', header: 'Technician', render: (row) => <Badge variant="info">Tech: {row.technicianId.slice(0, 8)}</Badge> },
    { key: 'time', header: 'Scheduled Time', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.scheduledTime ? new Date(row.scheduledTime).toLocaleString() : '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'COMPLETED' ? 'success' : 'warning'}>{row.status}</Badge> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Dispatch Board" description="Technician dispatch schedules and routing" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Dispatch' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Dispatch</Button>} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      <KPICard title="Total Dispatches" value={dispatches.length} icon={<MapPin size={18} />} color="var(--color-primary)" />
      <KPICard title="Scheduled" value={dispatches.filter(d => d.status === 'SCHEDULED').length} icon={<Clock size={18} />} color="var(--color-warning)" />
    </div>
    <Card padding="none"><DataTable columns={columns} data={dispatches} rowKey={r => r.id} emptyTitle="No dispatches" emptyMessage="Create a dispatch assignment." emptyIcon={<MapPin size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Dispatch" size="md" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Dispatch'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}><TextField label="Ticket ID" required value={form.ticketId} onChange={e => setForm({...form, ticketId: e.target.value})} /><TextField label="Technician ID" required value={form.technicianId} onChange={e => setForm({...form, technicianId: e.target.value})} /><TextField label="Scheduled Time" type="datetime-local" value={form.scheduledTime} onChange={e => setForm({...form, scheduledTime: e.target.value})} /></div>
    </Modal>
  </div>);
}
