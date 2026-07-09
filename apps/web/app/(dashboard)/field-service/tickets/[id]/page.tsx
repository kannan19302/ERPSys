'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard } from '@unerp/ui';
import { ClipboardList, Clock, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link'; import { useParams } from 'next/navigation';
interface ServiceTicket { id: string; title: string; customerName: string; priority: string; status: string; slaDeadline?: string; description?: string; createdAt?: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function ServiceTicketDetailPage() {
  const params = useParams(); const id = params?.id as string;
  const [ticket, setTicket] = useState<ServiceTicket | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!id) return; (async () => { try { const res = await fetch('/api/v1/ext/field-service/tickets', { headers: { Authorization: `Bearer ${getToken() || ''}` } }); if (res.ok) { const d = await res.json(); const list = Array.isArray(d) ? d : d?.data || []; setTicket(list.find((t: ServiceTicket) => t.id === id) || null); } } catch {} finally { setLoading(false); } })(); }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  if (!ticket) return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)' }}><ClipboardList size={64} style={{ color: 'var(--color-text-tertiary)' }} /><h2>Ticket Not Found</h2><Link href="/field-service/tickets"><button style={{ padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', cursor: 'pointer' }}><ArrowLeft size={14} /> Back</button></Link></div>);

  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title={ticket.title} description={`Customer: ${ticket.customerName}`} breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Tickets', href: '/field-service/tickets' }, { label: ticket.title }]} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      <KPICard title="Priority" value={ticket.priority} icon={<ShieldAlert size={18} />} color="var(--color-danger)" />
      <KPICard title="Status" value={ticket.status} icon={<Clock size={18} />} color="var(--color-primary)" />
      <KPICard title="SLA Deadline" value={ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleDateString() : '—'} icon={<Clock size={18} />} color="var(--color-warning)" />
    </div>
    <Card><div style={{ padding: 'var(--space-5)' }}><h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Ticket Details</h3>
      {[['Title', ticket.title], ['Customer', ticket.customerName], ['Priority', ticket.priority], ['Status', ticket.status], ['Description', ticket.description || 'No description provided']].map(([l, v]) => (<div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}><span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{l}</span><span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{v}</span></div>))}
    </div></Card>
  </div>);
}
