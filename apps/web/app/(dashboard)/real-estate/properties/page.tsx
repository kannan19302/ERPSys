'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Building2, Plus, Search } from 'lucide-react';
import Link from 'next/link';

interface Property { id: string; name: string; type: string; portfolio: string; address?: string; status?: string; parentId?: string; }
export default function PropertiesPage() {
  const client = useApiClient();
  const [properties, setProperties] = useState<Property[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'RESIDENTIAL', portfolio: '', address: '' });

  useEffect(() => { (async () => { try { const d = await client.get<Property[] | { data?: Property[] }>('/ext/real-estate/properties'); setProperties(Array.isArray(d) ? d : d.data || []); } catch {} finally { setLoading(false); } })(); }, [client]);

  const handleCreate = async () => { if (!form.name) return; setCreating(true); try { await client.post('/ext/real-estate/properties', form); setCreateOpen(false); window.location.reload(); } catch {} finally { setCreating(false); } };

  const filtered = properties.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));
  const columns: Column<Property>[] = [
    { key: 'name', header: 'Property', render: (row) => (<div className="ui-hstack-3"><div className={styles.s1}><Building2 size={18} /></div><div><Link href={`/real-estate/properties/${row.id}`} className={styles.s2}>{row.name}</Link><div className="ui-text-xs-tertiary">{row.portfolio}</div></div></div>) },
    { key: 'type', header: 'Type', render: (row) => <Badge variant="info">{row.type}</Badge> },
    { key: 'address', header: 'Address', render: (row) => <span className="ui-text-sm-muted">{row.address || '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'OCCUPIED' ? 'success' : 'warning'}>{row.status || 'Available'}</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (<RouteGuard permission="real-estate.properties.read"><div className="ui-stack-6">
    <PageHeader title="Properties" description="Manage your property portfolio" breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Properties' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Add Property</Button>} />
    <KPICard title="Total Properties" value={properties.length} icon={<Building2 size={18} />} color="var(--color-primary)" />
    <Card><div className={styles.s3}><Search size={16} className={styles.s4} /><input type="text" placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} className={styles.s5} /></div></Card>
    <Card padding="none"><DataTable columns={columns} data={filtered} rowKey={r => r.id} emptyTitle="No properties" emptyMessage="Add properties to your portfolio." emptyIcon={<Building2 size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Property" size="md" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add'}</Button></>}>
      <div className="ui-stack-4"><TextField label="Property Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /><div className="ui-grid-2 ui-gap-3"><FormField label="Type"><Select value={form.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, type: e.target.value})}><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option><option value="INDUSTRIAL">Industrial</option></Select></FormField><TextField label="Portfolio" value={form.portfolio} onChange={e => setForm({...form, portfolio: e.target.value})} /></div><TextField label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
    </Modal>
  </div></RouteGuard>);
}
