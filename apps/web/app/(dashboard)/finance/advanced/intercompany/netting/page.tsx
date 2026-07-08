/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '@unerp/ui';
import {
  Loader2, RefreshCw, Zap, Link2, CheckCircle2,
  AlertCircle, ShieldCheck, ArrowRightLeft, Info
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  orgId: string;
  customerId: string;
  dueDate: string;
  totalAmount: number | string;
  currency: string;
}

interface PaymentSchedule {
  id: string;
  orgId: string;
  vendorId: string;
  dueDate: string;
  amount: number | string;
  status: string;
}

interface IntercompanyStats {
  totalTransactionsCount: number;
  eliminatedCount: number;
  matchedCount: number;
  pendingCount: number;
  totalNettedVolume: number;
  pendingNettingVolume: number;
  pendingMatchVolume: number;
}

const API_BASE = 'http://localhost:3001/api/v1/advanced-finance';

function authHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function IntercompanyNettingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [stats, setStats] = useState<IntercompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  // Manual matching selection
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [matchDescription, setMatchDescription] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch AR Invoices for mapping
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const invoiceRes = await fetch('http://localhost:3001/api/v1/finance/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 2. Fetch Payment Schedules for mapping
      const scheduleRes = await fetch(`${API_BASE}/treasury/payment-schedules`, {
        headers: authHeaders(),
      });
      // 3. Fetch Netting stats
      const statsRes = await fetch(`${API_BASE}/intercompany/stats`, {
        headers: authHeaders(),
      });

      if (invoiceRes.ok) {
        const data = await invoiceRes.json();
        setInvoices((data.items || data).filter((inv: any) => inv.status !== 'PAID'));
      }
      if (scheduleRes.ok) {
        const data = await scheduleRes.json();
        setSchedules((data.items || data).filter((s: any) => s.status !== 'PAID'));
      }
      if (statsRes.ok) {
        setStats(await statsRes.json() as IntercompanyStats);
      }
    } catch (e) {
      console.error('Error loading intercompany datasets:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAutoMatch = async () => {
    setMatching(true);
    try {
      const res = await fetch(`${API_BASE}/intercompany/auto-match`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Auto-matching completed successfully! Matched ${result.matchCount} pairs.`);
        loadData();
      } else {
        alert('Auto-matching failed.');
      }
    } catch (e) {
      console.error(e);
      alert('Error running auto-match');
    } finally {
      setMatching(false);
    }
  };

  const handleManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !selectedScheduleId) {
      alert('Please select both an AR Invoice and an AP Schedule.');
      return;
    }
    setMatching(true);
    try {
      const res = await fetch(`${API_BASE}/intercompany/manual-match`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          fromInvoiceId: selectedInvoiceId,
          toInvoiceId: selectedScheduleId,
          description: matchDescription,
        }),
      });
      if (res.ok) {
        alert('Transactions successfully matched.');
        setSelectedInvoiceId('');
        setSelectedScheduleId('');
        setMatchDescription('');
        loadData();
      } else {
        const err = await res.json();
        alert(`Failed to match: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error manual matching transactions');
    } finally {
      setMatching(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Intercompany AP/AR Netting Match</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Match internal sales (AR Receivables) in seller subsidiaries with internal purchases (AP Payables) in buyer subsidiaries.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="primary" onClick={handleAutoMatch} disabled={matching}>
            {matching ? <Loader2 size={16} className="animate-spin mr-2" /> : <Zap size={16} style={{ marginRight: 'var(--space-2)' }} />}
            Run Auto-Net Match
          </Button>
        </div>
      </div>

      {stats && (
        <div className="frappe-grid-3" style={{ gap: 'var(--space-4)' }}>
          {[
            { label: 'Unmatched AR Invoices', value: invoices.length, icon: <Info size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
            { label: 'Unmatched AP Schedules', value: schedules.length, icon: <ArrowRightLeft size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Matched Pairs (Pending Netting)', value: stats.matchedCount, icon: <ShieldCheck size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
          ].map(kpi => (
            <Card key={kpi.label} className="frappe-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{kpi.label}</p>
                  <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: kpi.color, marginTop: 'var(--space-2)' }}>{kpi.value}</p>
                </div>
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: kpi.bg, color: kpi.color }}>{kpi.icon}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Manual matchmaking form panel */}
      <Card className="frappe-card">
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Manual Matchmaker Board</h3>
        </div>
        <form onSubmit={handleManualMatch} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            {/* Left selector */}
            <div className="frappe-form-group">
              <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                Select AR Invoice (Sales Side)
              </label>
              <select
                className="frappe-input"
                value={selectedInvoiceId}
                onChange={e => setSelectedInvoiceId(e.target.value)}
                style={{ width: '100%' }}
                required
              >
                <option value="">-- Choose Invoice --</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {fmt(Number(inv.totalAmount))} ({inv.orgId})
                  </option>
                ))}
              </select>
            </div>

            {/* Right selector */}
            <div className="frappe-form-group">
              <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                Select AP Payment Schedule (Purchase Side)
              </label>
              <select
                className="frappe-input"
                value={selectedScheduleId}
                onChange={e => setSelectedScheduleId(e.target.value)}
                style={{ width: '100%' }}
                required
              >
                <option value="">-- Choose Schedule --</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>
                    Schedule ID: {s.id.substring(0,8)} — {fmt(Number(s.amount))} ({s.orgId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="frappe-form-group">
            <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
              Matching Notes / Description
            </label>
            <input
              type="text"
              className="frappe-input"
              value={matchDescription}
              onChange={e => setMatchDescription(e.target.value)}
              placeholder="e.g. Netting for intercompany service fee invoice"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <Button variant="primary" type="submit" disabled={matching || !selectedInvoiceId || !selectedScheduleId}>
              <Link2 size={16} style={{ marginRight: 'var(--space-2)' }} /> Link Pair
            </Button>
          </div>
        </form>
      </Card>

      {/* Datasets Listing columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* AR Receivables */}
        <Card className="frappe-card">
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <h4 style={{ fontWeight: 'var(--weight-bold)' }}>Open AR Sales Invoices</h4>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
            <table style={{ width: '100%', fontSize: 'var(--text-xs)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Invoice #</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Subsidiary</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No open intercompany invoices.</td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2)', fontWeight: 'var(--weight-semibold)' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{inv.orgId}</td>
                      <td style={{ padding: 'var(--space-2)', textAlign: 'right', color: '#22c55e' }}>{fmt(Number(inv.totalAmount))}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AP Payables */}
        <Card className="frappe-card">
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <h4 style={{ fontWeight: 'var(--weight-bold)' }}>Open AP Purchases Schedules</h4>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
            <table style={{ width: '100%', fontSize: 'var(--text-xs)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Schedule ID</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Subsidiary</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No open payment schedules.</td>
                  </tr>
                ) : (
                  schedules.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2)' }}>{s.id.substring(0,8)}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{s.orgId}</td>
                      <td style={{ padding: 'var(--space-2)', textAlign: 'right', color: '#ef4444' }}>{fmt(Number(s.amount))}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{new Date(s.dueDate).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
