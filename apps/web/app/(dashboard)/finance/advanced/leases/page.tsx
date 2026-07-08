'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, FileText, Calendar, TrendingDown, AlertCircle, Search } from 'lucide-react';
import { Card, Button, Badge } from '@unerp/ui';
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
          <h1 className="text-2xl font-bold frappe-text-primary">Lease Accounting</h1>
          <p className="text-sm frappe-text-muted mt-1">ASC 842 / IFRS 16 right-of-use asset &amp; liability management</p>
        </div>
        <Link href="/finance/advanced/leases/new">
          <Button variant="primary" size="sm" className="flex items-center gap-2">
            <Plus size={16} /> New Lease
          </Button>
        </Link>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total ROU Assets', value: fmt(summary.totalROU), icon: FileText },
            { label: 'Total Lease Liability', value: fmt(summary.totalLiability), icon: TrendingDown },
            { label: 'Active Leases', value: String(summary.activeLeases), icon: Calendar },
            { label: 'Finance / Operating', value: `${summary.financeCount} / ${summary.operatingCount}`, icon: AlertCircle },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center gap-3">
                <Icon size={18} className="frappe-text-muted" />
                <div>
                  <p className="text-xs frappe-text-muted">{label}</p>
                  <p className="text-lg font-semibold frappe-text-primary">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 frappe-text-muted" />
            <input
              className="frappe-input pl-8 w-full text-sm"
              placeholder="Search by ref or description…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="frappe-input text-sm" value={leaseType} onChange={(e) => { setLeaseType(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            <option value="FINANCE">Finance</option>
            <option value="OPERATING">Operating</option>
          </select>
          <select className="frappe-input text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {loading ? (
          <p className="frappe-text-muted text-sm text-center py-8">Loading…</p>
        ) : leases.length === 0 ? (
          <p className="frappe-text-muted text-sm text-center py-8">No leases found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="frappe-table w-full text-sm">
              <thead>
                <tr>
                  <th className="dt-sort-th text-left">Ref / Description</th>
                  <th className="dt-sort-th text-left">Type</th>
                  <th className="dt-sort-th text-left">Start</th>
                  <th className="dt-sort-th text-left">End</th>
                  <th className="dt-sort-th text-right">Present Value</th>
                  <th className="dt-sort-th text-right">Carrying Amount</th>
                  <th className="dt-sort-th text-left">Status</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td>
                      <Link href={`/finance/advanced/leases/${l.id}`} className="font-medium text-blue-600 hover:underline">
                        {l.leaseRef ?? '—'}
                      </Link>
                      {l.description && <p className="text-xs frappe-text-muted">{l.description}</p>}
                    </td>
                    <td>
                      <Badge variant={l.leaseType === 'FINANCE' ? 'primary' : 'info'}>{l.leaseType}</Badge>
                    </td>
                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td className="text-right">{l.presentValue != null ? fmt(Number(l.presentValue)) : '—'}</td>
                    <td className="text-right">{l.carryingAmount != null ? fmt(Number(l.carryingAmount)) : '—'}</td>
                    <td>
                      <Badge variant={l.status === 'ACTIVE' ? 'success' : l.status === 'TERMINATED' ? 'danger' : l.status === 'EXPIRED' ? 'warning' : 'default'}>{l.status}</Badge>
                    </td>
                    <td>
                      <Link href={`/finance/advanced/leases/${l.id}`} className="text-blue-600 hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-sm frappe-text-muted self-center">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
