'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, FileText, Calendar, TrendingDown, AlertCircle, Search } from 'lucide-react';
import { Card, Button, Badge, ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { apiGet } from '@/lib/api';

interface Lease {
  id: string;
  leaseRef: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  leaseType: string;
  presentValue: number | null;
  carryingAmount: number | null;
  interestRate: number | null;
  status: string;
}

interface Summary {
  totalROU: number;
  totalLiability: number;
  activeLeases: number;
  financeCount: number;
  operatingCount: number;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });


export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [leaseType, setLeaseType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (leaseType) params.set('leaseType', leaseType);
      if (status) params.set('status', status);
      const [res, sum] = await Promise.all([
        apiGet<{ data: Lease[]; totalPages: number }>(`/finance/leases?${params}`),
        apiGet<Summary>('/finance/leases/summary'),
      ]);
      setLeases(res.data ?? []);
      setTotalPages(res.totalPages ?? 1);
      setSummary(sum);
    } finally {
      setLoading(false);
    }
  }, [page, search, leaseType, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold ui-text-primary">Lease Accounting</h1>
          <p className="text-sm ui-text-muted mt-1">ASC 842 / IFRS 16 right-of-use asset &amp; liability management</p>
        </div>
        <Link href="/finance/advanced/leases/new">
          <Button variant="primary" size="sm" className="flex items-center gap-2">
            <Plus size={16} /> New Lease
          </Button>
        </Link>
      </div>

      {summary && (
        <StatCardRow stats={[
          { label: 'Total ROU Assets', value: fmt(summary.totalROU), icon: <FileText size={20} />, color: 'var(--color-primary)' },
          { label: 'Total Lease Liability', value: fmt(summary.totalLiability), icon: <TrendingDown size={20} />, color: '#ef4444' },
          { label: 'Active Leases', value: String(summary.activeLeases), icon: <Calendar size={20} />, color: '#22c55e' },
          { label: 'Finance / Operating', value: `${summary.financeCount} / ${summary.operatingCount}`, icon: <AlertCircle size={20} />, color: '#f59e0b' },
        ]} />
      )}

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 ui-text-muted" />
            <input
              className="ui-input pl-8 w-full text-sm"
              placeholder="Search by ref or description…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="ui-input text-sm" value={leaseType} onChange={(e) => { setLeaseType(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            <option value="FINANCE">Finance</option>
            <option value="OPERATING">Operating</option>
          </select>
          <select className="ui-input text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {(() => {
          const leaseColumns: ListColumn[] = [
            { key: 'leaseRef', header: 'Ref / Description', render: (v, row) => { const l = row as unknown as Lease; return <div><Link href={`/finance/advanced/leases/${l.id}`} className="font-medium text-blue-600 hover:underline">{(v as string | null) ?? '—'}</Link>{l.description && <p className="text-xs ui-text-muted">{l.description}</p>}</div>; } },
            { key: 'leaseType', header: 'Type', render: (v) => <Badge variant={(v as string) === 'FINANCE' ? 'primary' : 'info'}>{v as string}</Badge> },
            { key: 'startDate', header: 'Start', render: (v) => <span>{new Date(v as string).toLocaleDateString()}</span> },
            { key: 'endDate', header: 'End', render: (v) => <span>{new Date(v as string).toLocaleDateString()}</span> },
            { key: 'presentValue', header: 'Present Value', render: (v) => <span className={styles.s1}>{v != null ? fmt(Number(v)) : '—'}</span> },
            { key: 'carryingAmount', header: 'Carrying Amount', render: (v) => <span className={styles.s1}>{v != null ? fmt(Number(v)) : '—'}</span> },
            { key: 'status', header: 'Status', render: (v) => <Badge variant={(v as string) === 'ACTIVE' ? 'success' : (v as string) === 'TERMINATED' ? 'danger' : (v as string) === 'EXPIRED' ? 'warning' : 'default'}>{v as string}</Badge> },
            { key: 'id', header: 'Actions', render: (v) => <Link href={`/finance/advanced/leases/${v as string}`} className="text-blue-600 hover:underline text-xs">View</Link> },
          ];
          return (
            <ListPageTemplate
              columns={leaseColumns}
              data={leases as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No Leases Found"
              emptyDescription="No leases found."
              searchable
            />
          );
        })()}

        {totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-sm ui-text-muted self-center">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
