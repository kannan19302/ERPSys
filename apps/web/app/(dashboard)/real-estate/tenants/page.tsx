'use client';
import styles from './page.module.css';
import React from 'react';
import { PageHeader, Card, KPICard } from '@unerp/ui';
import { Users, Key } from 'lucide-react';

export default function TenantsPage() {
  const tenants = [
    { id: '1', name: 'Acme Corp', unit: 'Suite 401', leaseEnd: '2027-03-31', rent: 5200, status: 'Active' },
    { id: '2', name: 'TechStart Inc', unit: 'Suite 203', leaseEnd: '2026-12-31', rent: 3800, status: 'Active' },
    { id: '3', name: 'Global Foods', unit: 'Ground Floor', leaseEnd: '2026-09-15', rent: 8500, status: 'Expiring' },
  ];
  return (<div className="ui-stack-6">
    <PageHeader title="Tenant Directory" description="Contact information and lease status for all tenants" breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Tenants' }]} />
    <div className="ui-grid-auto">
      <KPICard title="Total Tenants" value={tenants.length} icon={<Users size={18} />} color="var(--color-primary)" />
      <KPICard title="Active Leases" value={tenants.filter(t => t.status === 'Active').length} icon={<Key size={18} />} color="var(--color-success)" />
    </div>
    <div className="ui-stack-3">
      {tenants.map(t => (<Card key={t.id}><div className={styles.s1}>
        <div><div className="ui-heading-sm">{t.name}</div><div className="ui-text-xs-tertiary">{t.unit} · Lease ends {new Date(t.leaseEnd).toLocaleDateString()}</div></div>
        <div className="ui-hstack-3"><span className="ui-heading-sm">${t.rent.toLocaleString()}/mo</span><span style={{ background: t.status === 'Active' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: t.status === 'Active' ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s2}>{t.status}</span></div>
      </div></Card>))}
    </div>
  </div>);
}
