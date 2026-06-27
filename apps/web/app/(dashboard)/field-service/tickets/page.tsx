'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard } from '@unerp/ui';
import { ClipboardList, Plus, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ServiceTicket { id: string; title: string; customerName: string; priority: string; status: string; slaDeadline?: string; description?: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function ServiceTicketsPage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', customerName: '', priority: 'MEDIUM', description: '', slaDeadline: '' });

  useEffect(() => { (async () => { try { const res = await fetch('/api/v1/field-service/tickets', { headers: { Authorization: `Bearer ${getToken() || ''}` } }); if (res.ok) { const d = await res.json(); setTickets(Array.isArray(d) ? d : d?.data || []); } } catch {} finally { setLoading(false); } })(); }, []);
  const handleCreate = async () => { if (!form.title || !form.customerName) return; setCreating(true); try { await fetch('/api/v1/field-service/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` }, body: JSON.stringify(form) }); setCreateOpen(false); window.location.reload(); } catch {} finally { setCreating(false); } };

  const filtered = tickets.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.customerName.toLowerCase().includes(search.toLowerCase()));
  const getPriorityVariant = (p: string) => p === 'CRITICAL' ? 'danger' : p === 'HIGH' ? 'warning' : 'info';
  const getStatusVariant = (s: string) => s === 'COMPLETED' || s === 'RESOLVED' ? 'success' : s === 'IN_PROGRESS' ? 'info' : 'warning';

  const columns: Column<ServiceTicket>[] = [
    { key: 'title', header: 'Ticket', render: (row) => (<div><Link href={`/field-service/tickets/${row.id}`} style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'none' }}>{row.title}</Link><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.customerName}</div></div>) },
    { key: 'priority', header: 'Priority', render: (row) => <Badge variant={getPriorityVariant(row.priority)}>{row.priority}</Badge> },
    { key: 'sla', header: 'SLA Deadline', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.slaDeadline ? new Date(row.slaDeadline).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Service Tickets" description="Customer service tickets, priority queues, and SLA management" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Tickets' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Ticket</Button>} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      <KPICard title="Total Tickets" value={tickets.length} icon={<ClipboardList size={18} />} color="var(--color-primary)" />
      <KPICard title="Open Tickets" value={tickets.filter(t => t.status !== 'COMPLETED').length} icon={<AlertTriangle size={18} />} color="var(--color-warning)" />
    </div>
    <Card><div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} /><input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} /></div></Card>
    <Card padding="none"><DataTable columns={columns} data={filtered} rowKey={r => r.id} emptyTitle="No tickets" emptyMessage="Create service tickets to start dispatching." emptyIcon={<ClipboardList size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Ticket" size="md" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}><TextField label="Ticket Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /><TextField label="Customer Name" required value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}><FormField label="Priority"><Select value={form.priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, priority: e.target.value})}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></Select></FormField><TextField label="SLA Deadline" type="date" value={form.slaDeadline} onChange={e => setForm({...form, slaDeadline: e.target.value})} /></div><TextField label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
    </Modal>
  </div>);
}
