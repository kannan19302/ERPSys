'use client';
import styles from './page.module.css';
import React from 'react';
import { PageHeader, Card, KPICard } from '@unerp/ui';
import { Users, Wrench } from 'lucide-react';
import { RouteGuard } from '@unerp/framework';

export default function TechniciansPage() {
  const techs = [
    { id: '1', name: 'John Doe', skill: 'HVAC Specialist', workload: '3 Jobs', status: 'Active' },
    { id: '2', name: 'Mark Smith', skill: 'Plumbing Expert', workload: '1 Job', status: 'Active' },
    { id: '3', name: 'Sarah Connor', skill: 'Electrician', workload: '0 Jobs', status: 'Idle' },
  ];
  return (<RouteGuard permission="field-service.technician.read"><div className="ui-stack-6">
    <PageHeader title="Technician Directory" description="Skill profiles, availability, and active workloads" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Technicians' }]} />
    <div className="ui-grid-auto">
      <KPICard title="Total Techs" value={techs.length} icon={<Users size={18} />} color="var(--color-primary)" />
      <KPICard title="Active Techs" value={techs.filter(t => t.status === 'Active').length} icon={<Users size={18} />} color="var(--color-success)" />
    </div>
    <div className="ui-stack-3">
      {techs.map(t => (<Card key={t.id}><div className={styles.s1}>
        <div><div className="ui-heading-sm">{t.name}</div><div className="ui-text-xs-tertiary">{t.skill} · Workload: {t.workload}</div></div>
        <span style={{ background: t.status === 'Active' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: t.status === 'Active' ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s2}>{t.status}</span>
      </div></Card>))}
    </div>
  </div></RouteGuard>);
}
