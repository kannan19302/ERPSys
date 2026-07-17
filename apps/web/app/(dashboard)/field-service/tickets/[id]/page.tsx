'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard } from '@unerp/ui';
import { ClipboardList, Clock, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link'; import { useParams } from 'next/navigation';
import { RouteGuard, useApiClient } from '@unerp/framework';
interface ServiceTicket { id: string; title: string; customerName: string; priority: string; status: string; slaDeadline?: string; description?: string; createdAt?: string; }

export default function ServiceTicketDetailPage() {
  const client = useApiClient();
  const params = useParams(); const id = params?.id as string;
  const [ticket, setTicket] = useState<ServiceTicket | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!id) return; (async () => { try { const d = await client.get<ServiceTicket[] | { data?: ServiceTicket[] }>('/ext/field-service/tickets'); const list = Array.isArray(d) ? d : d.data || []; setTicket(list.find((t) => t.id === id) || null); } catch {} finally { setLoading(false); } })(); }, [client, id]);

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  if (!ticket) return (<div className={styles.s1}><ClipboardList size={64} className="ui-text-tertiary" /><h2>Ticket Not Found</h2><Link href="/field-service/tickets"><button className={styles.s2}><ArrowLeft size={14} /> Back</button></Link></div>);

  return (<RouteGuard permission="field-service.ticket.read"><div className="ui-stack-6">
    <PageHeader title={ticket.title} description={`Customer: ${ticket.customerName}`} breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Tickets', href: '/field-service/tickets' }, { label: ticket.title }]} />
    <div className="ui-grid-auto">
      <KPICard title="Priority" value={ticket.priority} icon={<ShieldAlert size={18} />} color="var(--color-danger)" />
      <KPICard title="Status" value={ticket.status} icon={<Clock size={18} />} color="var(--color-primary)" />
      <KPICard title="SLA Deadline" value={ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleDateString() : '—'} icon={<Clock size={18} />} color="var(--color-warning)" />
    </div>
    <Card><div className="p-5"><h3 className="ui-heading-base mb-4">Ticket Details</h3>
      {[['Title', ticket.title], ['Customer', ticket.customerName], ['Priority', ticket.priority], ['Status', ticket.status], ['Description', ticket.description || 'No description provided']].map(([l, v]) => (<div key={l as string} className={styles.s3}><span className="ui-text-sm-muted">{l}</span><span className="ui-heading-sm">{v}</span></div>))}
    </div></Card>
  </div></RouteGuard>);
}
