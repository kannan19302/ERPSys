'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Building2, Key, DollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link'; import { useParams } from 'next/navigation';

interface Property { id: string; name: string; type: string; portfolio: string; address?: string; status?: string; }
export default function PropertyDetailPage() {
  const client = useApiClient();
  const params = useParams(); const id = params?.id as string;
  const [property, setProperty] = useState<Property | null>(null); const [loading, setLoading] = useState(true);

  useEffect(() => { if (!id) return; (async () => { try { const d = await client.get<Property[] | { data?: Property[] }>('/ext/real-estate/properties'); const list = Array.isArray(d) ? d : d.data || []; setProperty(list.find((p) => p.id === id) || null); } catch {} finally { setLoading(false); } })(); }, [id, client]);

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  if (!property) return (<RouteGuard permission="real-estate.properties.read"><div className={styles.s1}><Building2 size={64} className="ui-text-tertiary" /><h2 className={styles.s2}>Property Not Found</h2><Link href="/real-estate/properties"><button className={styles.s3}><ArrowLeft size={14} /> Back</button></Link></div></RouteGuard>);

  return (<RouteGuard permission="real-estate.properties.read"><div className="ui-stack-6">
    <PageHeader title={property.name} description={`${property.type} · ${property.portfolio}`} breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Properties', href: '/real-estate/properties' }, { label: property.name }]} />
    <div className="ui-grid-auto">
      <KPICard title="Type" value={property.type} icon={<Building2 size={18} />} color="var(--color-primary)" />
      <KPICard title="Portfolio" value={property.portfolio || '—'} icon={<Key size={18} />} color="var(--color-info)" />
      <KPICard title="Status" value={property.status || 'Available'} icon={<DollarSign size={18} />} color="var(--color-success)" />
    </div>
    <Card><div className="p-5"><h3 className="ui-heading-base mb-4">Property Details</h3>
      {[['Name', property.name], ['Type', property.type], ['Portfolio', property.portfolio || '—'], ['Address', property.address || '—']].map(([l, v]) => (<div key={l as string} className={styles.s4}><span className="ui-text-sm-muted">{l}</span><span className="ui-heading-sm">{v}</span></div>))}
    </div></Card>
  </div></RouteGuard>);
}
