'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge } from '@unerp/ui';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

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
  initialRecognition: number | null;
}

interface ScheduleRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  paymentAmount: number;
  interestExpense: number | null;
  principalRepayment: number | null;
  rouAmortization: number | null;
  journalPosted: boolean;
  journalEntryId: string | null;
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
const periodLabel = (s: string) => {
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const statusVariant = (s: string): 'success' | 'danger' | 'warning' | 'default' =>
  s === 'ACTIVE' ? 'success' : s === 'TERMINATED' ? 'danger' : s === 'EXPIRED' ? 'warning' : 'default';

export default function LeaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lease, setLease] = useState<Lease | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<string | null>(null);
  const [terminating, setTerminating] = useState(false);
  const [terminationDate, setTerminationDate] = useState('');
  const [renewEnd, setRenewEnd] = useState('');
  const [showTerminate, setShowTerminate] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, s] = await Promise.all([
        apiGet<Lease>(`/finance/leases/${id}`),
        apiGet<ScheduleRow[]>(`/finance/leases/${id}/schedule`),
      ]);
      setLease(l);
      setSchedule(s);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const postMonth = async (row: ScheduleRow) => {
    setPosting(row.id);
    setMsg(null);
    try {
      await apiPost(`/finance/leases/${id}/post-month`, { period: periodLabel(row.periodStart) });
      setMsg({ text: `Posted ${periodLabel(row.periodStart)} successfully.`, type: 'success' });
      load();
    } catch (e: any) {
      setMsg({ text: e?.message ?? 'Post failed', type: 'error' });
    } finally {
      setPosting(null);
    }
  };

  const terminate = async () => {
    if (!terminationDate) return;
    setTerminating(true);
    setMsg(null);
    try {
      await apiPost(`/finance/leases/${id}/terminate`, { terminationDate });
      setMsg({ text: 'Lease terminated and GL entry posted.', type: 'success' });
      setShowTerminate(false);
      load();
    } catch (e: any) {
      setMsg({ text: e?.message ?? 'Termination failed', type: 'error' });
    } finally {
      setTerminating(false);
    }
  };

  const renew = async () => {
    if (!renewEnd) return;
    setMsg(null);
    try {
      await apiPost(`/finance/leases/${id}/renew`, { newEndDate: renewEnd });
      setMsg({ text: 'Lease renewed and schedule extended.', type: 'success' });
      setShowRenew(false);
      load();
    } catch (e: any) {
      setMsg({ text: e?.message ?? 'Renewal failed', type: 'error' });
    }
  };

  if (loading) return <div className="p-6 frappe-text-muted">Loading…</div>;
  if (!lease) return <div className="p-6 text-red-600">Lease not found.</div>;

  const posted = schedule.filter(s => s.journalPosted).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/finance/advanced/leases" className="frappe-text-muted hover:frappe-text-primary">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs frappe-text-muted">Finance / Lease Accounting</p>
            <h1 className="text-xl font-bold frappe-text-primary">{lease.leaseRef ?? lease.id}</h1>
            {lease.description && <p className="text-sm frappe-text-muted">{lease.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {lease.status === 'ACTIVE' && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowRenew(true)}>Renew</Button>
              <Button variant="secondary" size="sm" className="text-red-600" onClick={() => setShowTerminate(true)}>Terminate</Button>
            </>
          )}
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-sm rounded p-3 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Type', value: lease.leaseType },
          { label: 'Status', value: <Badge variant={statusVariant(lease.status)}>{lease.status}</Badge> },
          { label: 'Initial Recognition', value: lease.initialRecognition != null ? fmt(Number(lease.initialRecognition)) : '—' },
          { label: 'Carrying Amount', value: lease.carryingAmount != null ? fmt(Number(lease.carryingAmount)) : '—' },
          { label: 'Start Date', value: fmtDate(lease.startDate) },
          { label: 'End Date', value: fmtDate(lease.endDate) },
          { label: 'Interest Rate', value: lease.interestRate != null ? `${(Number(lease.interestRate) * 100).toFixed(2)}%` : '—' },
          { label: 'Schedule Progress', value: `${posted} / ${schedule.length} periods posted` },
        ].map(({ label, value }) => (
          <Card key={label} className="p-4">
            <p className="text-xs frappe-text-muted mb-1">{label}</p>
            <p className="text-sm font-semibold frappe-text-primary">{value}</p>
          </Card>
        ))}
      </div>

      {showTerminate && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20 space-y-3">
          <p className="text-sm font-medium text-red-700">Early Termination</p>
          <p className="text-xs text-red-600">A GL entry will be posted to write off the remaining carrying amount.</p>
          <input type="date" className="frappe-input text-sm" value={terminationDate} onChange={e => setTerminationDate(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={terminate} disabled={terminating || !terminationDate} className="bg-red-600 hover:bg-red-700">
              {terminating ? 'Terminating…' : 'Confirm Termination'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowTerminate(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {showRenew && (
        <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 space-y-3">
          <p className="text-sm font-medium text-blue-700">Renew / Extend Lease</p>
          <label className="text-xs frappe-text-muted">New End Date</label>
          <input type="date" className="frappe-input text-sm" value={renewEnd} onChange={e => setRenewEnd(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={renew} disabled={!renewEnd}>Confirm Renewal</Button>
            <Button variant="secondary" size="sm" onClick={() => setShowRenew(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="text-sm font-semibold frappe-text-primary mb-4">Amortization Schedule</h2>
        {schedule.length === 0 ? (
          <p className="frappe-text-muted text-sm text-center py-4">No schedule generated — provide Present Value when creating a lease.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="frappe-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Period</th>
                  <th className="text-right">Payment</th>
                  <th className="text-right">Interest</th>
                  <th className="text-right">Principal</th>
                  <th className="text-right">ROU Amort.</th>
                  <th className="text-left">GL Status</th>
                  <th className="text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${row.journalPosted ? 'opacity-60' : ''}`}>
                    <td className="font-mono text-xs">{periodLabel(row.periodStart)}</td>
                    <td className="text-right">{fmt(Number(row.paymentAmount))}</td>
                    <td className="text-right">{row.interestExpense != null ? fmt(Number(row.interestExpense)) : '—'}</td>
                    <td className="text-right">{row.principalRepayment != null ? fmt(Number(row.principalRepayment)) : '—'}</td>
                    <td className="text-right">{row.rouAmortization != null ? fmt(Number(row.rouAmortization)) : '—'}</td>
                    <td>
                      {row.journalPosted ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={12} /> Posted</span>
                      ) : (
                        <span className="text-xs frappe-text-muted">Pending</span>
                      )}
                    </td>
                    <td>
                      {!row.journalPosted && lease.status === 'ACTIVE' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={posting === row.id}
                          onClick={() => postMonth(row)}
                          className="text-xs py-0.5 px-2"
                        >
                          {posting === row.id ? <RefreshCw size={12} className="animate-spin" /> : 'Post'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold border-t">
                  <td>Total</td>
                  <td className="text-right">{fmt(schedule.reduce((s, r) => s + Number(r.paymentAmount), 0))}</td>
                  <td className="text-right">{fmt(schedule.reduce((s, r) => s + Number(r.interestExpense ?? 0), 0))}</td>
                  <td className="text-right">{fmt(schedule.reduce((s, r) => s + Number(r.principalRepayment ?? 0), 0))}</td>
                  <td className="text-right">{fmt(schedule.reduce((s, r) => s + Number(r.rouAmortization ?? 0), 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
