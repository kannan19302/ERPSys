'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard } from '@unerp/ui';
import { Key, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link'; import { useParams } from 'next/navigation';
interface Lease { id: string; tenantName: string; startDate: string; endDate: string; rentAmount: number; securityDeposit?: number; billingFrequency?: string; status?: string; property?: { name: string }; propertyId: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }
const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function LeaseDetailPage() {
  const params = useParams(); const id = params?.id as string;
  const [lease, setLease] = useState<Lease | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!id) return; (async () => { try { const res = await fetch('/api/v1/real-estate/leases', { headers: { Authorization: `Bearer ${getToken() || ''}` } }); if (res.ok) { const d = await res.json(); const list = Array.isArray(d) ? d : d?.data || []; setLease(list.find((l: Lease) => l.id === id) || null); } } catch {} finally { setLoading(false); } })(); }, [id]);
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  if (!lease) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)' }}><Key size={64} style={{ color: 'var(--color-text-tertiary)' }} /><h2>Lease Not Found</h2><Link href="/real-estate/leases"><button style={{ padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', cursor: 'pointer' }}><ArrowLeft size={14} /> Back</button></Link></div>;

  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title={`Lease: ${lease.tenantName}`} description={`Property: ${lease.property?.name || lease.propertyId.slice(0,8)}`} breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Leases', href: '/real-estate/leases' }, { label: lease.tenantName }]} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      <KPICard title="Monthly Rent" value={fmtCurrency(lease.rentAmount)} icon={<DollarSign size={18} />} color="var(--color-primary)" />
      <KPICard title="Security Deposit" value={fmtCurrency(lease.securityDeposit || 0)} icon={<DollarSign size={18} />} color="var(--color-info)" />
      <KPICard title="Billing" value={lease.billingFrequency || 'Monthly'} icon={<Calendar size={18} />} color="var(--color-success)" />
    </div>
    <Card><div style={{ padding: 'var(--space-5)' }}><h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Lease Details</h3>
      {[['Tenant', lease.tenantName], ['Start', lease.startDate ? new Date(lease.startDate).toLocaleDateString() : '—'], ['End', lease.endDate ? new Date(lease.endDate).toLocaleDateString() : '—'], ['Rent', fmtCurrency(lease.rentAmount)], ['Status', lease.status || 'Active']].map(([l, v]) => (<div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}><span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{l}</span><span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{v}</span></div>))}
    </div></Card>
  </div>);
}
