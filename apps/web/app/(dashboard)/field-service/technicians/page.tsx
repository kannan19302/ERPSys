'use client';
import React from 'react';
import { PageHeader, Card, KPICard } from '@unerp/ui';
import { Users, Wrench } from 'lucide-react';

export default function TechniciansPage() {
  const techs = [
    { id: '1', name: 'John Doe', skill: 'HVAC Specialist', workload: '3 Jobs', status: 'Active' },
    { id: '2', name: 'Mark Smith', skill: 'Plumbing Expert', workload: '1 Job', status: 'Active' },
    { id: '3', name: 'Sarah Connor', skill: 'Electrician', workload: '0 Jobs', status: 'Idle' },
  ];
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Technician Directory" description="Skill profiles, availability, and active workloads" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Technicians' }]} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      <KPICard title="Total Techs" value={techs.length} icon={<Users size={18} />} color="var(--color-primary)" />
      <KPICard title="Active Techs" value={techs.filter(t => t.status === 'Active').length} icon={<Users size={18} />} color="var(--color-success)" />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {techs.map(t => (<Card key={t.id}><div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{t.name}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{t.skill} · Workload: {t.workload}</div></div>
        <span style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', background: t.status === 'Active' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: t.status === 'Active' ? 'var(--color-success)' : 'var(--color-warning)' }}>{t.status}</span>
      </div></Card>))}
    </div>
  </div>);
}
