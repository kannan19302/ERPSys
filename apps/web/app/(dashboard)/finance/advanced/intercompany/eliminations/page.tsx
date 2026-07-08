/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '@unerp/ui';
import {
  Loader2, RefreshCw, CheckCircle2, AlertCircle,
  FileSpreadsheet, ShieldCheck, Scale, FileText
} from 'lucide-react';

interface IntercompanyTransaction {
  id: string;
  fromOrgId: string;
  toOrgId: string;
  date: string;
  description: string;
  amount: number | string;
  currency: string;
  status: string;
  fromInvoiceId: string | null;
  toInvoiceId: string | null;
  eliminationJournalId: string | null;
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

export default function IntercompanyEliminationsPage() {
  const [txs, setTxs] = useState<IntercompanyTransaction[]>([]);
  const [stats, setStats] = useState<IntercompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/intercompany/transactions`, { headers: authHeaders() }),
        fetch(`${API_BASE}/intercompany/stats`, { headers: authHeaders() }),
      ]);

      if (txRes.ok) {
        const data = await txRes.json();
        setTxs(data.items || data);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json() as IntercompanyStats);
      }
    } catch (e) {
      console.error('Error loading intercompany transactions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEliminate = async (id: string) => {
    setActingId(id);
    try {
      const res = await fetch(`${API_BASE}/intercompany/eliminate/${id}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        alert('Netting elimination entry successfully posted to GL ledger.');
        loadData();
      } else {
        const err = await res.json();
        alert(`Failed to eliminate: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error posting elimination entry');
    } finally {
      setActingId(null);
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
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Intercompany Netting & Eliminations Ledger</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Compliance log of all matched intercompany AP/AR transaction pairs and generated General Ledger elimination entries.
          </p>
        </div>
        <div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {stats && (
        <div className="frappe-grid-3" style={{ gap: 'var(--space-4)' }}>
          {[
            { label: 'Total Netting Volume (Eliminated)', value: fmt(stats.totalNettedVolume), icon: <Scale size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            { label: 'Pending Netting Volume', value: fmt(stats.pendingNettingVolume), icon: <Loader2 size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Eliminated Transactions Count', value: `${stats.eliminatedCount} / ${stats.totalTransactionsCount}`, icon: <ShieldCheck size={20} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
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

      {/* Main compliance table */}
      <Card className="frappe-card">
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Intercompany Ledger Entries</h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Offset balances to prevent AP/AR double counting on consolidation books</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Transaction Date</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Description</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Seller Org</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Buyer Org</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Amount</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Status</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Elimination Journal</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {txs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No matched intercompany transactions found. Run Netting Match dashboard to match transaction pairs.
                  </td>
                </tr>
              ) : (
                txs.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-semibold)' }}>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{t.description}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{t.fromOrgId}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{t.toOrgId}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>{fmt(Number(t.amount))}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'var(--weight-semibold)',
                        background: t.status === 'ELIMINATED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: t.status === 'ELIMINATED' ? '#22c55e' : '#f59e0b'
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                      {t.eliminationJournalId ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={14} /> ID: {t.eliminationJournalId.substring(0,8)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      {t.status === 'MATCHED' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actingId !== null}
                          onClick={() => handleEliminate(t.id)}
                          style={{ padding: '2px 8px', fontSize: '12px' }}
                        >
                          {actingId === t.id ? <Loader2 size={12} className="animate-spin" /> : 'Eliminate'}
                        </Button>
                      ) : (
                        <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'semibold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> Post Eliminated
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
