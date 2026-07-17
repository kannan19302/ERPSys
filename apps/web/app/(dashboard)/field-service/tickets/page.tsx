'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard } from '@unerp/ui';
import { ClipboardList, Plus, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface ServiceTicket { id: string; title: string; customerName: string; priority: string; status: string; slaDeadline?: string; description?: string; }
export default function ServiceTicketsPage() {
  const client = useApiClient();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', customerName: '', priority: 'MEDIUM', description: '', slaDeadline: '' });

  useEffect(() => { (async () => { try { const d = await client.get<ServiceTicket[] | { data?: ServiceTicket[] }>('/ext/field-service/tickets'); setTickets(Array.isArray(d) ? d : d.data || []); } catch {} finally { setLoading(false); } })(); }, [client]);
  const handleCreate = async () => { if (!form.title || !form.customerName) return; setCreating(true); try { await client.post('/ext/field-service/tickets', form); setCreateOpen(false); const d = await client.get<ServiceTicket[] | { data?: ServiceTicket[] }>('/ext/field-service/tickets'); setTickets(Array.isArray(d) ? d : d.data || []); } catch {} finally { setCreating(false); } };

  const filtered = tickets.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.customerName.toLowerCase().includes(search.toLowerCase()));
  const getPriorityVariant = (p: string) => p === 'CRITICAL' ? 'danger' : p === 'HIGH' ? 'warning' : 'info';
  const getStatusVariant = (s: string) => s === 'COMPLETED' || s === 'RESOLVED' ? 'success' : s === 'IN_PROGRESS' ? 'info' : 'warning';

  const columns: Column<ServiceTicket>[] = [
    { key: 'title', header: 'Ticket', render: (row) => (<div><Link href={`/field-service/tickets/${row.id}`} className={styles.s1}>{row.title}</Link><div className="ui-text-xs-tertiary">{row.customerName}</div></div>) },
    { key: 'priority', header: 'Priority', render: (row) => <Badge variant={getPriorityVariant(row.priority)}>{row.priority}</Badge> },
    { key: 'sla', header: 'SLA Deadline', render: (row) => <span className="text-sm">{row.slaDeadline ? new Date(row.slaDeadline).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (<RouteGuard permission="field-service.ticket.read"><div className="ui-stack-6">
    <PageHeader title="Service Tickets" description="Customer service tickets, priority queues, and SLA management" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Tickets' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Ticket</Button>} />
    <div className="ui-grid-auto">
      <KPICard title="Total Tickets" value={tickets.length} icon={<ClipboardList size={18} />} color="var(--color-primary)" />
      <KPICard title="Open Tickets" value={tickets.filter(t => t.status !== 'COMPLETED').length} icon={<AlertTriangle size={18} />} color="var(--color-warning)" />
    </div>
    <Card><div className={styles.s2}><Search size={16} className={styles.s3} /><input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className={styles.s4} /></div></Card>
    <Card padding="none"><DataTable columns={columns} data={filtered} rowKey={r => r.id} emptyTitle="No tickets" emptyMessage="Create service tickets to start dispatching." emptyIcon={<ClipboardList size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Ticket" size="md" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
      <div className="ui-stack-4"><TextField label="Ticket Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /><TextField label="Customer Name" required value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} /><div className="ui-grid-2 ui-gap-3"><FormField label="Priority"><Select value={form.priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, priority: e.target.value})}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></Select></FormField><TextField label="SLA Deadline" type="date" value={form.slaDeadline} onChange={e => setForm({...form, slaDeadline: e.target.value})} /></div><TextField label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
    </Modal>
  </div></RouteGuard>);
}
