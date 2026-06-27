'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard } from '@unerp/ui';
import { Building2, Plus, Search } from 'lucide-react';
import Link from 'next/link';

interface Property { id: string; name: string; type: string; portfolio: string; address?: string; status?: string; parentId?: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'RESIDENTIAL', portfolio: '', address: '' });

  useEffect(() => { (async () => { try { const res = await fetch('/api/v1/real-estate/properties', { headers: { Authorization: `Bearer ${getToken() || ''}` } }); if (res.ok) { const d = await res.json(); setProperties(Array.isArray(d) ? d : d?.data || []); } } catch {} finally { setLoading(false); } })(); }, []);

  const handleCreate = async () => { if (!form.name) return; setCreating(true); try { await fetch('/api/v1/real-estate/properties', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` }, body: JSON.stringify(form) }); setCreateOpen(false); window.location.reload(); } catch {} finally { setCreating(false); } };

  const filtered = properties.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));
  const columns: Column<Property>[] = [
    { key: 'name', header: 'Property', render: (row) => (<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={18} /></div><div><Link href={`/real-estate/properties/${row.id}`} style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'none' }}>{row.name}</Link><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.portfolio}</div></div></div>) },
    { key: 'type', header: 'Type', render: (row) => <Badge variant="info">{row.type}</Badge> },
    { key: 'address', header: 'Address', render: (row) => <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{row.address || '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'OCCUPIED' ? 'success' : 'warning'}>{row.status || 'Available'}</Badge> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Properties" description="Manage your property portfolio" breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Properties' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Property</Button>} />
    <KPICard title="Total Properties" value={properties.length} icon={<Building2 size={18} />} color="var(--color-primary)" />
    <Card><div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} /><input type="text" placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} /></div></Card>
    <Card padding="none"><DataTable columns={columns} data={filtered} rowKey={r => r.id} emptyTitle="No properties" emptyMessage="Add properties to your portfolio." emptyIcon={<Building2 size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Property" size="md" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}><TextField label="Property Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}><FormField label="Type"><Select value={form.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, type: e.target.value})}><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option><option value="INDUSTRIAL">Industrial</option></Select></FormField><TextField label="Portfolio" value={form.portfolio} onChange={e => setForm({...form, portfolio: e.target.value})} /></div><TextField label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
    </Modal>
  </div>);
}
