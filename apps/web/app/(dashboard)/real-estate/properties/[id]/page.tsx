'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard } from '@unerp/ui';
import { Building2, Key, DollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link'; import { useParams } from 'next/navigation';

interface Property { id: string; name: string; type: string; portfolio: string; address?: string; status?: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function PropertyDetailPage() {
  const params = useParams(); const id = params?.id as string;
  const [property, setProperty] = useState<Property | null>(null); const [loading, setLoading] = useState(true);

  useEffect(() => { if (!id) return; (async () => { try { const res = await fetch('/api/v1/ext/real-estate/properties', { headers: { Authorization: `Bearer ${getToken() || ''}` } }); if (res.ok) { const d = await res.json(); const list = Array.isArray(d) ? d : d?.data || []; setProperty(list.find((p: Property) => p.id === id) || null); } } catch {} finally { setLoading(false); } })(); }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  if (!property) return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)' }}><Building2 size={64} style={{ color: 'var(--color-text-tertiary)' }} /><h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Property Not Found</h2><Link href="/real-estate/properties"><button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}><ArrowLeft size={14} /> Back</button></Link></div>);

  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title={property.name} description={`${property.type} · ${property.portfolio}`} breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Properties', href: '/real-estate/properties' }, { label: property.name }]} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      <KPICard title="Type" value={property.type} icon={<Building2 size={18} />} color="var(--color-primary)" />
      <KPICard title="Portfolio" value={property.portfolio || '—'} icon={<Key size={18} />} color="var(--color-info)" />
      <KPICard title="Status" value={property.status || 'Available'} icon={<DollarSign size={18} />} color="var(--color-success)" />
    </div>
    <Card><div style={{ padding: 'var(--space-5)' }}><h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Property Details</h3>
      {[['Name', property.name], ['Type', property.type], ['Portfolio', property.portfolio || '—'], ['Address', property.address || '—']].map(([l, v]) => (<div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}><span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{l}</span><span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{v}</span></div>))}
    </div></Card>
  </div>);
}
