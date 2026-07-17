'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, KPICard } from '@unerp/ui';
import { Pill, Plus, AlertTriangle, Package, Search } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Drug { id: string; name: string; batchNumber: string; expiryDate: string; isControlled?: boolean; quantity: number; createdAt?: string; }
export default function LabResultsPage() {
  const client = useApiClient();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const d = await client.get<Drug[] | { data?: Drug[] }>('/ext/healthcare/drugs');
        setDrugs(Array.isArray(d) ? d : d?.data || []);
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [client]);

  const filtered = drugs.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.batchNumber.toLowerCase().includes(search.toLowerCase()));
  const expiringSoon = drugs.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 90 * 86400000)).length;
  const controlled = drugs.filter(d => d.isControlled).length;

  const columns: Column<Drug>[] = [
    { key: 'drug', header: 'Drug', render: (row) => (
      <div className="ui-hstack-3">
        <div style={{ background: row.isControlled ? 'var(--color-danger-light)' : 'var(--color-info-light)', color: row.isControlled ? 'var(--color-danger)' : 'var(--color-info)' }} className={styles.s1}><Pill size={16} /></div>
        <div><div className="ui-heading-sm">{row.name}</div>{row.isControlled && <Badge variant="danger">Controlled</Badge>}</div>
      </div>
    ) },
    { key: 'batch', header: 'Batch #', render: (row) => <code className={styles.s2}>{row.batchNumber}</code> },
    { key: 'qty', header: 'Quantity', render: (row) => <span className="text-sm">{row.quantity}</span> },
    { key: 'expiry', header: 'Expiry', render: (row) => {
      const isExpiring = row.expiryDate && new Date(row.expiryDate) < new Date(Date.now() + 90 * 86400000);
      return <span style={{ color: isExpiring ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: isExpiring ? 'var(--weight-bold)' : 'var(--weight-normal)' }} className={styles.s3}>{row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—'}</span>;
    } },
    { key: 'status', header: 'Status', render: (row) => {
      const expired = row.expiryDate && new Date(row.expiryDate) < new Date();
      return <Badge variant={expired ? 'danger' : row.quantity <= 10 ? 'warning' : 'success'}>{expired ? 'Expired' : row.quantity <= 10 ? 'Low Stock' : 'Available'}</Badge>;
    } },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="healthcare.pharmacy.read">
    <div className="ui-stack-6">
      <PageHeader title="Pharmacy & Lab Results" description="Drug register, batch tracking, and expiry management"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Lab Results' }]} />

      <div className="ui-grid-auto-sm">
        <KPICard title="Total Drugs" value={drugs.length} icon={<Pill size={18} />} color="var(--color-primary)" />
        <KPICard title="Controlled" value={controlled} icon={<AlertTriangle size={18} />} color="var(--color-danger)" />
        <KPICard title="Expiring Soon" value={expiringSoon} icon={<AlertTriangle size={18} />} color="var(--color-warning)" />
        <KPICard title="Total Stock" value={drugs.reduce((a, d) => a + d.quantity, 0)} icon={<Package size={18} />} color="var(--color-info)" />
      </div>

      <Card>
        <div className={styles.s4}>
          <Search size={16} className={styles.s5} />
          <input type="text" placeholder="Search drugs..." value={search} onChange={e => setSearch(e.target.value)}
            className={styles.s6} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id} emptyTitle="No drugs registered" emptyMessage="Add drugs to your pharmacy register." emptyIcon={<Pill size={48} />} />
      </Card>
    </div>
    </RouteGuard>
  );
}
