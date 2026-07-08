'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Eye, Play, Pause, XCircle, RefreshCw,
  TrendingUp, CreditCard, Users, Percent, Search
} from 'lucide-react';
import {
  Card, Button, Badge, DataTable, PageHeader,
  Spinner, ConfirmDialog, KPICard
} from '@unerp/ui';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface Subscription {
  id: string;
  name: string;
  customerId: string | null;
  productId: string | null;
  currency: string;
  unitAmount: string | number;
  quantity: number;
  billingPeriod: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Metrics {
  mrr: number;
  arr: number;
  totalActiveSubs: number;
  newSubsThisMonth: number;
  churnedThisMonth: number;
  churnRate: number;
  avgRevenuePerSub: number;
}

const fmt = (n: number, currency = 'USD') =>
  n.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });

export default function SubscriptionsListPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / Confirm state
  const [confirmPauseId, setConfirmPauseId] = useState<string | null>(null);
  const [confirmResumeId, setConfirmResumeId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);

      const [res, met] = await Promise.all([
        apiGet<{ data: Subscription[]; meta: { totalPages: number } }>(`/subscriptions?${params}`),
        apiGet<Metrics>('/subscriptions/metrics')
      ]);

      setSubs(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
      setMetrics(met);
    } catch (err) {
      console.error('Failed to load subscriptions data', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunBilling = async () => {
    setRunningBilling(true);
    try {
      const res = await apiPost<{ processed: number; billed: number }>('/subscriptions/billing/run');
      alert(`Billing run completed. Processed: ${res.processed}, Billed: ${res.billed}`);
      loadData();
    } catch (err: any) {
      alert(`Error during billing run: ${err.message}`);
    } finally {
      setRunningBilling(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await apiPost(`/subscriptions/${id}/pause`);
      setConfirmPauseId(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await apiPost(`/subscriptions/${id}/resume`);
      setConfirmResumeId(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiPost(`/subscriptions/${id}/cancel?immediate=true`);
      setConfirmCancelId(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Plan Name',
      render: (row: Subscription) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">ID: {row.id.slice(-8)}</p>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer ID',
      render: (row: Subscription) => (
        <span className="text-sm text-slate-600 font-mono">{row.customerId || '—'}</span>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: Subscription) => (
        <span className="text-sm font-medium">
          {fmt(Number(row.unitAmount) * row.quantity, row.currency)}
        </span>
      )
    },
    {
      key: 'period',
      header: 'Billing Period',
      render: (row: Subscription) => (
        <Badge variant="info">{row.billingPeriod}</Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Subscription) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' = 'success';
        if (row.status === 'PAUSED') variant = 'warning';
        if (row.status === 'CANCELED') variant = 'danger';
        if (row.status === 'TRIALING') variant = 'info';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
    {
      key: 'periodRange',
      header: 'Current Period',
      render: (row: Subscription) => (
        <span className="text-xs text-slate-500">
          {new Date(row.currentPeriodStart).toLocaleDateString()} - {new Date(row.currentPeriodEnd).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Subscription) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/finance/advanced/subscriptions/${row.id}`}>
            <Button size="sm" variant="secondary" className="p-1">
              <Eye size={14} />
            </Button>
          </Link>
          {row.status === 'ACTIVE' && (
            <Button size="sm" variant="secondary" className="p-1" onClick={() => setConfirmPauseId(row.id)}>
              <Pause size={14} className="text-yellow-600" />
            </Button>
          )}
          {row.status === 'PAUSED' && (
            <Button size="sm" variant="secondary" className="p-1" onClick={() => setConfirmResumeId(row.id)}>
              <Play size={14} className="text-green-600" />
            </Button>
          )}
          {(row.status === 'ACTIVE' || row.status === 'PAUSED' || row.status === 'TRIALING') && (
            <Button size="sm" variant="secondary" className="p-1" onClick={() => setConfirmCancelId(row.id)}>
              <XCircle size={14} className="text-red-600" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold frappe-text-primary">Subscription Billing</h1>
          <p className="text-sm frappe-text-muted mt-1">Manage plans, automated recurring schedules, and ARR/MRR metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleRunBilling} disabled={runningBilling} className="flex items-center gap-2">
            <RefreshCw size={16} className={runningBilling ? 'animate-spin' : ''} />
            Run Billing
          </Button>
          <Link href="/finance/advanced/subscriptions/new">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus size={16} /> New Subscription
            </Button>
          </Link>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Monthly Recurring Revenue (MRR)</p>
              <p className="text-xl font-bold text-slate-900">{fmt(metrics.mrr)}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Annual Recurring Revenue (ARR)</p>
              <p className="text-xl font-bold text-slate-900">{fmt(metrics.arr)}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Subscriptions</p>
              <p className="text-xl font-bold text-slate-900">{metrics.totalActiveSubs}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <Percent size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Churn Rate (This Month)</p>
              <p className="text-xl font-bold text-slate-900">{metrics.churnRate}%</p>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-slate-200 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CANCELED">Canceled</option>
              <option value="TRIALING">Trialing</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable
              data={subs}
              columns={columns}
            />
            {totalPages > 1 && (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-sm text-slate-500 self-center">Page {page} of {totalPages}</span>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {confirmPauseId && (
        <ConfirmDialog
          open={true}
          title="Pause Subscription"
          message="Are you sure you want to pause this subscription? Billing runs will skip this subscription until it is resumed."
          confirmLabel="Pause"
          cancelLabel="Cancel"
          onConfirm={() => handlePause(confirmPauseId)}
          onClose={() => setConfirmPauseId(null)}
        />
      )}

      {confirmResumeId && (
        <ConfirmDialog
          open={true}
          title="Resume Subscription"
          message="Are you sure you want to resume this subscription? Automated billing runs will resume on the next due date."
          confirmLabel="Resume"
          cancelLabel="Cancel"
          onConfirm={() => handleResume(confirmResumeId)}
          onClose={() => setConfirmResumeId(null)}
        />
      )}

      {confirmCancelId && (
        <ConfirmDialog
          open={true}
          title="Cancel Subscription"
          message="Are you sure you want to immediately cancel this subscription? This action cannot be undone."
          confirmLabel="Cancel Subscription"
          cancelLabel="Keep Subscription"
          onConfirm={() => handleCancel(confirmCancelId)}
          onClose={() => setConfirmCancelId(null)}
        />
      )}
    </div>
  );
}
