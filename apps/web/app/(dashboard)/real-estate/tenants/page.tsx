'use client';
import React from 'react';
import { PageHeader, Card, KPICard } from '@unerp/ui';
import { Users, Key } from 'lucide-react';

export default function TenantsPage() {
  const tenants = [
    { id: '1', name: 'Acme Corp', unit: 'Suite 401', leaseEnd: '2027-03-31', rent: 5200, status: 'Active' },
    { id: '2', name: 'TechStart Inc', unit: 'Suite 203', leaseEnd: '2026-12-31', rent: 3800, status: 'Active' },
    { id: '3', name: 'Global Foods', unit: 'Ground Floor', leaseEnd: '2026-09-15', rent: 8500, status: 'Expiring' },
  ];
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Tenant Directory" description="Contact information and lease status for all tenants" breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Tenants' }]} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      <KPICard title="Total Tenants" value={tenants.length} icon={<Users size={18} />} color="var(--color-primary)" />
      <KPICard title="Active Leases" value={tenants.filter(t => t.status === 'Active').length} icon={<Key size={18} />} color="var(--color-success)" />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {tenants.map(t => (<Card key={t.id}><div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{t.name}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{t.unit} · Lease ends {new Date(t.leaseEnd).toLocaleDateString()}</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>${t.rent.toLocaleString()}/mo</span><span style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', background: t.status === 'Active' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: t.status === 'Active' ? 'var(--color-success)' : 'var(--color-warning)' }}>{t.status}</span></div>
      </div></Card>))}
    </div>
  </div>);
}
