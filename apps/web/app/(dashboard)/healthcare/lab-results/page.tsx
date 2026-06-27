'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, KPICard } from '@unerp/ui';
import { Pill, Plus, AlertTriangle, Package, Search } from 'lucide-react';

interface Drug { id: string; name: string; batchNumber: string; expiryDate: string; isControlled?: boolean; quantity: number; createdAt?: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function LabResultsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/healthcare/drugs', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) { const d = await res.json(); setDrugs(Array.isArray(d) ? d : d?.data || []); }
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const filtered = drugs.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.batchNumber.toLowerCase().includes(search.toLowerCase()));
  const expiringSoon = drugs.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 90 * 86400000)).length;
  const controlled = drugs.filter(d => d.isControlled).length;

  const columns: Column<Drug>[] = [
    { key: 'drug', header: 'Drug', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: row.isControlled ? 'var(--color-danger-light)' : 'var(--color-info-light)', color: row.isControlled ? 'var(--color-danger)' : 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Pill size={16} /></div>
        <div><div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>{row.isControlled && <Badge variant="danger">Controlled</Badge>}</div>
      </div>
    ) },
    { key: 'batch', header: 'Batch #', render: (row) => <code style={{ fontSize: '11px' }}>{row.batchNumber}</code> },
    { key: 'qty', header: 'Quantity', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.quantity}</span> },
    { key: 'expiry', header: 'Expiry', render: (row) => {
      const isExpiring = row.expiryDate && new Date(row.expiryDate) < new Date(Date.now() + 90 * 86400000);
      return <span style={{ fontSize: 'var(--text-sm)', color: isExpiring ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: isExpiring ? 'var(--weight-bold)' : 'var(--weight-normal)' }}>{row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—'}</span>;
    } },
    { key: 'status', header: 'Status', render: (row) => {
      const expired = row.expiryDate && new Date(row.expiryDate) < new Date();
      return <Badge variant={expired ? 'danger' : row.quantity <= 10 ? 'warning' : 'success'}>{expired ? 'Expired' : row.quantity <= 10 ? 'Low Stock' : 'Available'}</Badge>;
    } },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Pharmacy & Lab Results" description="Drug register, batch tracking, and expiry management"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Lab Results' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Drugs" value={drugs.length} icon={<Pill size={18} />} color="var(--color-primary)" />
        <KPICard title="Controlled" value={controlled} icon={<AlertTriangle size={18} />} color="var(--color-danger)" />
        <KPICard title="Expiring Soon" value={expiringSoon} icon={<AlertTriangle size={18} />} color="var(--color-warning)" />
        <KPICard title="Total Stock" value={drugs.reduce((a, d) => a + d.quantity, 0)} icon={<Package size={18} />} color="var(--color-info)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input type="text" placeholder="Search drugs..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id} emptyTitle="No drugs registered" emptyMessage="Add drugs to your pharmacy register." emptyIcon={<Pill size={48} />} />
      </Card>
    </div>
  );
}
