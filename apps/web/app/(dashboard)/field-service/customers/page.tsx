'use client';
import React from 'react';
import { PageHeader, Card, KPICard } from '@unerp/ui';
import { Users, Clock } from 'lucide-react';

export default function CustomerPortalPage() {
  const clients = [
    { id: '1', name: 'Acme Corp', contact: 'Alice Smith', activeTickets: 2, responseTime: '15 mins', compliance: '98%' },
    { id: '2', name: 'Global Foods', contact: 'Bob Johnson', activeTickets: 0, responseTime: '22 mins', compliance: '95%' },
    { id: '3', name: 'Retail Partners', contact: 'Charlie Brown', activeTickets: 1, responseTime: '18 mins', compliance: '97%' },
  ];
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Customer Directory" description="Customer contacts, active support counts, and SLA metrics" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Customers' }]} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      <KPICard title="Total Clients" value={clients.length} icon={<Users size={18} />} color="var(--color-primary)" />
      <KPICard title="Average SLA Compliance" value="96.6%" icon={<Clock size={18} />} color="var(--color-success)" />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {clients.map(c => (<Card key={c.id}><div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{c.name}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Primary contact: {c.contact} · SLA: {c.compliance}</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><span style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-xs)' }}>Avg Response: {c.responseTime}</span><span style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', background: c.activeTickets > 0 ? 'var(--color-warning-light)' : 'var(--color-success-light)', color: c.activeTickets > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{c.activeTickets > 0 ? `${c.activeTickets} Active` : 'Clear'}</span></div>
      </div></Card>))}
    </div>
  </div>);
}
