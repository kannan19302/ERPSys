'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Key, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link'; import { useParams } from 'next/navigation';
interface Lease { id: string; tenantName: string; startDate: string; endDate: string; rentAmount: number; securityDeposit?: number; billingFrequency?: string; status?: string; property?: { name: string }; propertyId: string; }
const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function LeaseDetailPage() {
  const client = useApiClient();
  const params = useParams(); const id = params?.id as string;
  const [lease, setLease] = useState<Lease | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!id) return; (async () => { try { const d = await client.get<Lease[] | { data?: Lease[] }>('/ext/real-estate/leases'); const list = Array.isArray(d) ? d : d.data || []; setLease(list.find((l) => l.id === id) || null); } catch {} finally { setLoading(false); } })(); }, [id, client]);
  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  if (!lease) return <RouteGuard permission="real-estate.leases.read"><div className={styles.s1}><Key size={64} className="ui-text-tertiary" /><h2>Lease Not Found</h2><Link href="/real-estate/leases"><button className={styles.s2}><ArrowLeft size={14} /> Back</button></Link></div></RouteGuard>;

  return (<RouteGuard permission="real-estate.leases.read"><div className="ui-stack-6">
    <PageHeader title={`Lease: ${lease.tenantName}`} description={`Property: ${lease.property?.name || lease.propertyId.slice(0,8)}`} breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Leases', href: '/real-estate/leases' }, { label: lease.tenantName }]} />
    <div className="ui-grid-auto">
      <KPICard title="Monthly Rent" value={fmtCurrency(lease.rentAmount)} icon={<DollarSign size={18} />} color="var(--color-primary)" />
      <KPICard title="Security Deposit" value={fmtCurrency(lease.securityDeposit || 0)} icon={<DollarSign size={18} />} color="var(--color-info)" />
      <KPICard title="Billing" value={lease.billingFrequency || 'Monthly'} icon={<Calendar size={18} />} color="var(--color-success)" />
    </div>
    <Card><div className="p-5"><h3 className="ui-heading-base mb-4">Lease Details</h3>
      {[['Tenant', lease.tenantName], ['Start', lease.startDate ? new Date(lease.startDate).toLocaleDateString() : '—'], ['End', lease.endDate ? new Date(lease.endDate).toLocaleDateString() : '—'], ['Rent', fmtCurrency(lease.rentAmount)], ['Status', lease.status || 'Active']].map(([l, v]) => (<div key={l as string} className={styles.s3}><span className="ui-text-sm-muted">{l}</span><span className="ui-heading-sm">{v}</span></div>))}
    </div></Card>
  </div></RouteGuard>);
}
