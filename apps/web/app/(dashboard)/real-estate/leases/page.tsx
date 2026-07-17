'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Key, Plus, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface Lease { id: string; tenantName: string; startDate: string; endDate: string; rentAmount: number; securityDeposit?: number; billingFrequency?: string; status?: string; property?: { name: string }; propertyId: string; }
const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function LeasesPage() {
  const client = useApiClient();
  const [leases, setLeases] = useState<Lease[]>([]); const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ propertyId: '', tenantName: '', startDate: '', endDate: '', rentAmount: 0, securityDeposit: 0, billingFrequency: 'MONTHLY' });

  useEffect(() => { (async () => { try { const d = await client.get<Lease[] | { data?: Lease[] }>('/ext/real-estate/leases'); setLeases(Array.isArray(d) ? d : d.data || []); } catch {} finally { setLoading(false); } })(); }, [client]);
  const handleCreate = async () => { if (!form.propertyId || !form.tenantName) return; setCreating(true); try { await client.post('/ext/real-estate/leases', {...form, rentAmount: Number(form.rentAmount), securityDeposit: Number(form.securityDeposit)}); setCreateOpen(false); window.location.reload(); } catch {} finally { setCreating(false); } };

  const totalRent = leases.reduce((a, l) => a + Number(l.rentAmount || 0), 0);
  const columns: Column<Lease>[] = [
    { key: 'tenant', header: 'Tenant', render: (row) => (<div><Link href={`/real-estate/leases/${row.id}`} className={styles.s1}>{row.tenantName}</Link><div className="ui-text-xs-tertiary">{row.property?.name || row.propertyId.slice(0, 8)}</div></div>) },
    { key: 'dates', header: 'Lease Period', render: (row) => <span className="text-sm">{row.startDate ? new Date(row.startDate).toLocaleDateString() : '—'} → {row.endDate ? new Date(row.endDate).toLocaleDateString() : '—'}</span> },
    { key: 'rent', header: 'Rent', align: 'right' as const, render: (row) => <span className="font-semibold">{fmtCurrency(row.rentAmount)}</span> },
    { key: 'freq', header: 'Billing', render: (row) => <Badge variant="info">{row.billingFrequency || 'Monthly'}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'EXPIRED' ? 'danger' : 'success'}>{row.status || 'Active'}</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (<RouteGuard permission="real-estate.leases.read"><div className="ui-stack-6">
    <PageHeader title="Leases" description="Active lease agreements and rent tracking" breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Leases' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Lease</Button>} />
    <div className="ui-grid-auto">
      <KPICard title="Active Leases" value={leases.length} icon={<Key size={18} />} color="var(--color-primary)" />
      <KPICard title="Monthly Rent" value={fmtCurrency(totalRent)} icon={<DollarSign size={18} />} color="var(--color-success)" />
    </div>
    <Card padding="none"><DataTable columns={columns} data={leases} rowKey={r => r.id} emptyTitle="No leases" emptyMessage="Create leases to track tenants." emptyIcon={<Key size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Lease" size="md" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
      <div className="ui-stack-4"><TextField label="Property ID" required value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})} /><TextField label="Tenant Name" required value={form.tenantName} onChange={e => setForm({...form, tenantName: e.target.value})} /><div className="ui-grid-2 ui-gap-3"><TextField label="Start Date" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /><TextField label="End Date" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} /></div><div className="ui-grid-2 ui-gap-3"><TextField label="Monthly Rent ($)" type="number" value={String(form.rentAmount)} onChange={e => setForm({...form, rentAmount: Number(e.target.value)})} /><TextField label="Security Deposit ($)" type="number" value={String(form.securityDeposit)} onChange={e => setForm({...form, securityDeposit: Number(e.target.value)})} /></div></div>
    </Modal>
  </div></RouteGuard>);
}
