'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Pause, Play, XCircle, Plus, Calendar,
  CreditCard, DollarSign, FileText, Activity, Clock
} from 'lucide-react';
import {
  Card, Button, Badge, DataTable, FormField, Input,
  Spinner, ChangeHistory, ListPageTemplate, type ListColumn
} from '@unerp/ui';
import { apiGet, apiPost } from '@/lib/api';

interface SubscriptionLine {
  id: string;
  description: string;
  unitAmount: string | number;
  quantity: number;
  taxRate: string | number;
  totalAmount: string | number;
}

interface SubscriptionInvoice {
  id: string;
  invoiceId: string;
  invoice: {
    invoiceNumber: string;
  };
  periodStart: string;
  periodEnd: string;
  amount: string | number;
  status: string;
  paidAt: string | null;
}

interface SubscriptionUsage {
  id: string;
  usageDate: string;
  metricName: string;
  quantity: number;
  unitAmount: string | number;
  totalAmount: string | number;
}

interface SubscriptionDetails {
  id: string;
  name: string;
  description: string | null;
  customerId: string | null;
  productId: string | null;
  currency: string;
  unitAmount: string | number;
  quantity: number;
  billingPeriod: string;
  billingCycles: number | null;
  status: string;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndDate: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  pausedAt: string | null;
  createdAt: string;
  lines: SubscriptionLine[];
  invoices: SubscriptionInvoice[];
  usage: SubscriptionUsage[];
}

const fmt = (n: number | string, currency = 'USD') =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency });

export default function SubscriptionDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [sub, setSub] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Usage form state
  const [usageForm, setUsageForm] = useState({
    usageDate: new Date().toISOString().split('T')[0],
    metricName: '',
    quantity: 1,
    unitAmount: 0,
  });
  const [recordingUsage, setRecordingUsage] = useState(false);

  const loadSub = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<SubscriptionDetails>(`/subscriptions/${id}`);
      setSub(data);
    } catch (err) {
      console.error('Failed to load subscription', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSub();
  }, [loadSub]);

  const handlePause = async () => {
    if (!sub) return;
    try {
      await apiPost(`/subscriptions/${sub.id}/pause`);
      loadSub();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResume = async () => {
    if (!sub) return;
    try {
      await apiPost(`/subscriptions/${sub.id}/resume`);
      loadSub();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async () => {
    if (!sub) return;
    if (!confirm('Are you sure you want to cancel this subscription immediately?')) return;
    try {
      await apiPost(`/subscriptions/${sub.id}/cancel?immediate=true`);
      loadSub();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sub) return;
    if (!usageForm.metricName || usageForm.quantity <= 0) {
      alert('Please fill out all usage details.');
      return;
    }
    setRecordingUsage(true);
    try {
      await apiPost(`/subscriptions/${sub.id}/usage`, {
        ...usageForm,
        quantity: Number(usageForm.quantity),
        unitAmount: Number(usageForm.unitAmount),
      });
      alert('Usage recorded.');
      setUsageForm({
        usageDate: new Date().toISOString().split('T')[0],
        metricName: '',
        quantity: 1,
        unitAmount: 0,
      });
      loadSub();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRecordingUsage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Subscription not found.</p>
        <Link href="/finance/advanced/subscriptions">
          <Button variant="secondary" className="mt-4">Back to List</Button>
        </Link>
      </div>
    );
  }

  const invoiceColumns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice Number',
      render: (row: SubscriptionInvoice) => (
        <span className="font-mono text-sm font-semibold">{row.invoice?.invoiceNumber}</span>
      )
    },
    {
      key: 'period',
      header: 'Billing Period',
      render: (row: SubscriptionInvoice) => (
        <span className="text-xs text-slate-500">
          {new Date(row.periodStart).toLocaleDateString()} - {new Date(row.periodEnd).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: SubscriptionInvoice) => (
        <span className="text-sm font-medium">{fmt(row.amount, sub.currency)}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: SubscriptionInvoice) => (
        <Badge variant={row.status === 'PAID' ? 'success' : row.status === 'FAILED' ? 'danger' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'paidAt',
      header: 'Paid At',
      render: (row: SubscriptionInvoice) => (
        <span className="text-xs text-slate-500">
          {row.paidAt ? new Date(row.paidAt).toLocaleDateString() : 'Pending'}
        </span>
      )
    }
  ];

  const usageColumns = [
    {
      key: 'usageDate',
      header: 'Date',
      render: (row: SubscriptionUsage) => (
        <span className="text-sm">{new Date(row.usageDate).toLocaleDateString()}</span>
      )
    },
    {
      key: 'metricName',
      header: 'Metric',
      render: (row: SubscriptionUsage) => (
        <Badge variant="info">{row.metricName}</Badge>
      )
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row: SubscriptionUsage) => <span className="text-sm">{row.quantity}</span>
    },
    {
      key: 'unitAmount',
      header: 'Unit Rate',
      render: (row: SubscriptionUsage) => (
        <span className="text-sm text-slate-500">{fmt(row.unitAmount, sub.currency)}</span>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total Charge',
      render: (row: SubscriptionUsage) => (
        <span className="text-sm font-semibold">{fmt(row.totalAmount, sub.currency)}</span>
      )
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/finance/advanced/subscriptions">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{sub.name}</h1>
              <Badge variant={sub.status === 'ACTIVE' ? 'success' : sub.status === 'PAUSED' ? 'warning' : 'danger'}>
                {sub.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">ID: {sub.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sub.status === 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={handlePause} className="flex items-center gap-1">
              <Pause size={14} /> Pause
            </Button>
          )}
          {sub.status === 'PAUSED' && (
            <Button variant="primary" size="sm" onClick={handleResume} className="flex items-center gap-1">
              <Play size={14} /> Resume
            </Button>
          )}
          {(sub.status === 'ACTIVE' || sub.status === 'PAUSED' || sub.status === 'TRIALING') && (
            <Button variant="secondary" size="sm" onClick={handleCancel} className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50">
              <XCircle size={14} /> Cancel Subscription
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-md font-semibold text-slate-800 border-b pb-3 mb-4">Subscription Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Customer ID</p>
                <p className="text-sm font-semibold text-slate-800 font-mono mt-0.5">{sub.customerId || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Product ID</p>
                <p className="text-sm font-semibold text-slate-800 font-mono mt-0.5">{sub.productId || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Pricing Rate</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {fmt(Number(sub.unitAmount) * sub.quantity, sub.currency)} / {sub.billingPeriod.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Billing Cycles</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {sub.billingCycles !== null ? `${sub.billingCycles} Cycles Remaining` : 'Infinite'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Start Date</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{new Date(sub.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Trial Period End</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {sub.trialEndDate ? new Date(sub.trialEndDate).toLocaleDateString() : 'No Trial'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 font-medium">Current Period Interval</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {new Date(sub.currentPeriodStart).toLocaleDateString()} to {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {sub.lines.length > 0 && (
            <Card className="p-6">
              <h2 className="text-md font-semibold text-slate-800 border-b pb-3 mb-4">Detailed Plan Lines</h2>
              <ListPageTemplate
                columns={[
                  { key: 'description', header: 'Description' },
                  { key: 'unitAmount', header: 'Unit Price', render: (v) => fmt(Number(v), sub.currency) },
                  { key: 'quantity', header: 'Qty' },
                  { key: 'taxRate', header: 'Tax Rate', render: (v) => `${v}%` },
                  { key: 'totalAmount', header: 'Total', render: (v) => fmt(Number(v), sub.currency) },
                ] as ListColumn[]}
                data={sub.lines as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No lines"
                emptyDescription="No plan lines."
              />
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-md font-semibold text-slate-800 border-b pb-3 mb-4">Invoice History</h2>
            {sub.invoices.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No invoices generated yet for this subscription.</p>
            ) : (
              <DataTable data={sub.invoices} columns={invoiceColumns} />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-md font-semibold text-slate-800 border-b pb-3">Log Usage</h2>
            <form onSubmit={handleRecordUsage} className="space-y-3">
              <FormField label="Usage Date" required>
                <Input
                  type="date"
                  value={usageForm.usageDate}
                  onChange={(e) => setUsageForm({ ...usageForm, usageDate: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Metric Name" required>
                <Input
                  type="text"
                  placeholder="e.g. api_calls"
                  value={usageForm.metricName}
                  onChange={(e) => setUsageForm({ ...usageForm, metricName: e.target.value })}
                  required
                />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Quantity" required>
                  <Input
                    type="number"
                    min="1"
                    value={usageForm.quantity}
                    onChange={(e) => setUsageForm({ ...usageForm, quantity: Number(e.target.value) })}
                    required
                  />
                </FormField>
                <FormField label="Unit Amount" required>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={usageForm.unitAmount}
                    onChange={(e) => setUsageForm({ ...usageForm, unitAmount: Number(e.target.value) })}
                    required
                  />
                </FormField>
              </div>
              <Button type="submit" variant="primary" disabled={recordingUsage} className="w-full flex justify-center mt-2">
                {recordingUsage ? 'Recording...' : 'Record Usage'}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-md font-semibold text-slate-800 border-b pb-3 mb-4">Usage History</h2>
            {sub.usage.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No usage logged yet.</p>
            ) : (
              <DataTable data={sub.usage} columns={usageColumns} />
            )}
          </Card>
        </div>
      </div>

      <div className="mt-12 border-t pt-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Audit Trail &amp; History</h3>
        <ChangeHistory entityType="Subscription" entityId={id} />
      </div>
    </div>
  );
}
