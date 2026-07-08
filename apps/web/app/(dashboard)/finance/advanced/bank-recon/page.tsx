/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, StatusBadge } from '@unerp/ui';
import {
  RefreshCw, Loader2, CheckCircle2, AlertCircle,
  GitCompare, ArrowRight, CornerDownRight, ShieldAlert,
  Search, ShieldCheck, XCircle, ChevronRight
} from 'lucide-react';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number | string;
  status: string;
  matchedEntityId: string | null;
  matchedEntityType: string | null;
  connection?: {
    bankName: string;
    accountNumber: string;
  };
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

export default function BankReconMatchingPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('UNMATCHED');
  const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);

  // Manual Link Input Form
  const [targetEntityId, setTargetEntityId] = useState('');
  const [targetEntityType, setTargetEntityType] = useState<'PAYMENT' | 'JOURNAL_ENTRY'>('PAYMENT');
  const [matchingActionLoading, setMatchingActionLoading] = useState(false);
  const [matchResultMsg, setMatchResultMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bank-feeds/transactions?status=${filterStatus}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const body = await res.json() as { data: BankTransaction[] };
        setTransactions(body.data);
        if (body.data.length > 0) {
          // Keep selection if it still exists in the list, otherwise select first
          const found = body.data.find(x => x.id === selectedTx?.id);
          setSelectedTx(found || body.data[0] || null);
        } else {
          setSelectedTx(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, selectedTx?.id]);

  useEffect(() => {
    fetchTransactions();
    setMatchResultMsg(null);
  }, [filterStatus]);

  const handleAutoMatch = async () => {
    if (!selectedTx) return;
    setMatchingActionLoading(true);
    setMatchResultMsg(null);
    try {
      const res = await fetch(`${API_BASE}/bank-feeds/transactions/${selectedTx.id}/auto-match`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const result = await res.json() as { matched: boolean; type?: string; record?: { id: string }; message?: string };
        if (result.matched) {
          setMatchResultMsg({
            type: 'success',
            text: `Perfect Match Found! Auto-linked transaction to ${result.type} ID ${result.record?.id}.`,
          });
          // Refresh list
          fetchTransactions();
        } else {
          setMatchResultMsg({
            type: 'info',
            text: result.message || 'No automatic match found in the general ledger matching window.',
          });
        }
      } else {
        setMatchResultMsg({
          type: 'error',
          text: 'Auto-match execution failed.',
        });
      }
    } catch (e) {
      console.error(e);
      setMatchResultMsg({ type: 'error', text: 'Error executing auto-match algorithm.' });
    } finally {
      setMatchingActionLoading(false);
    }
  };

  const handleManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !targetEntityId) return;
    setMatchingActionLoading(true);
    setMatchResultMsg(null);
    try {
      const res = await fetch(`${API_BASE}/bank-feeds/transactions/${selectedTx.id}/manual-match`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          matchedEntityId: targetEntityId,
          matchedEntityType: targetEntityType,
        }),
      });

      if (res.ok) {
        setMatchResultMsg({
          type: 'success',
          text: `Successfully linked transaction to ${targetEntityType} ${targetEntityId}.`,
        });
        setTargetEntityId('');
        fetchTransactions();
      } else {
        const err = await res.json() as { message?: string };
        setMatchResultMsg({
          type: 'error',
          text: err.message || 'Manual matching failed. Please verify entity ID exists.',
        });
      }
    } catch (e) {
      console.error(e);
      setMatchResultMsg({ type: 'error', text: 'Manual matching error.' });
    } finally {
      setMatchingActionLoading(false);
    }
  };

  const handleIgnore = async () => {
    if (!selectedTx) return;
    try {
      const res = await fetch(`${API_BASE}/bank-feeds/transactions/${selectedTx.id}/ignore`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        alert('Transaction ignored.');
        fetchTransactions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Bank reconciliation & Matching</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Compare, match and reconcile downloaded bank transaction statements against GL entries and accounts receivable payments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: '1px' }}>
        {[
          { key: 'UNMATCHED', label: 'Unmatched Transactions' },
          { key: 'MATCHED', label: 'Matched Records' },
          { key: 'IGNORED', label: 'Ignored / Suppressed' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setFilterStatus(tab.key);
              setSelectedTx(null);
            }}
            style={{
              padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)', border: 'none', background: 'none',
              borderBottom: filterStatus === tab.key ? '2px solid var(--color-primary)' : 'none',
              color: filterStatus === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="frappe-grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start', gridTemplateColumns: '1fr 1.2fr' }}>
        
        {/* Left Side: Transactions List */}
        <Card className="frappe-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Statement Feed</h3>
          </div>

          {loading ? (
            <div style={{ padding: 'var(--space-10)', display: 'flex', justifyContent: 'center' }}>
              <Loader2 className="animate-spin h-6 w-6" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <ShieldCheck size={36} style={{ margin: '0 auto var(--space-3)', opacity: 0.4, color: '#22c55e' }} />
              <p style={{ fontWeight: 'var(--weight-medium)' }}>No transactions found</p>
              <p style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>All feed downloads for this category are reconciled.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '550px', overflowY: 'auto' }}>
              {transactions.map(tx => {
                const amt = Number(tx.amount);
                const isSelected = selectedTx?.id === tx.id;
                return (
                  <div
                    key={tx.id}
                    onClick={() => {
                      setSelectedTx(tx);
                      setMatchResultMsg(null);
                    }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(79,70,229,0.04)' : 'transparent',
                      borderLeft: isSelected ? '4px solid var(--color-primary)' : '4px solid transparent'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{tx.description}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                        {new Date(tx.date).toLocaleDateString()} • {tx.connection?.bankName || 'Direct Feed'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{
                        fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)',
                        color: amt > 0 ? '#22c55e' : '#ef4444'
                      }}>
                        {amt > 0 ? '+' : ''}{fmt(amt)}
                      </span>
                      <ChevronRight size={16} style={{ color: 'var(--color-border)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right Side: Matching Panel */}
        <div>
          {selectedTx ? (
            <Card className="frappe-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-5)' }}>
              
              {/* Transaction Header Info */}
              <div style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>Selected statement transaction</p>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-2)' }}>{selectedTx.description}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Statement Date</p>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginTop: '2px' }}>{new Date(selectedTx.date).toLocaleDateString()}</p>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-3)' }}>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Source Connection</p>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginTop: '2px' }}>{selectedTx.connection?.bankName || 'Connected bank feed'}</p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-extrabold)',
                    color: Number(selectedTx.amount) > 0 ? '#22c55e' : '#ef4444'
                  }}>
                    {Number(selectedTx.amount) > 0 ? '+' : ''}{fmt(Number(selectedTx.amount))}
                  </span>
                </div>
              </div>

              {/* Status Display if already matched/ignored */}
              {filterStatus !== 'UNMATCHED' && (
                <div style={{
                  padding: 'var(--space-4)', background: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)'
                }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Matching Log</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                    Reconciliation Status: <span style={{ textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{selectedTx.status}</span>
                  </p>
                  {selectedTx.matchedEntityId && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                      Linked Ledger: {selectedTx.matchedEntityType} ({selectedTx.matchedEntityId})
                    </p>
                  )}
                </div>
              )}

              {/* Matching Actions (Only for UNMATCHED) */}
              {filterStatus === 'UNMATCHED' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                  
                  {/* Action 1: Auto Match */}
                  <div>
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>Option 1: Automated Smart Reconciliation</h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                      Scan our ledger journals and invoices to match by exact amount and date timeline (+/- 7 days).
                    </p>
                    <Button variant="primary" onClick={handleAutoMatch} disabled={matchingActionLoading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {matchingActionLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <GitCompare size={16} />
                      )}
                      Run Smart Match
                    </Button>
                  </div>

                  <div style={{ height: '1px', background: 'var(--color-border)' }} />

                  {/* Action 2: Manual match */}
                  <div>
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>Option 2: Reference Linked Ledger Entry</h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                      Manually map the download statement entry to a specific Payment or GL Journal entry ID.
                    </p>
                    <form onSubmit={handleManualMatch} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <div className="frappe-grid-2" style={{ gap: 'var(--space-3)' }}>
                        <div className="frappe-form-group">
                          <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>Link Entity Type</label>
                          <select
                            className="frappe-input"
                            value={targetEntityType}
                            onChange={e => setTargetEntityType(e.target.value as any)}
                            style={{ width: '100%' }}
                          >
                            <option value="PAYMENT">Invoice Payment Record</option>
                            <option value="JOURNAL_ENTRY">Journal Transaction Entry</option>
                          </select>
                        </div>
                        <div className="frappe-form-group">
                          <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>Entity UUID</label>
                          <input
                            type="text"
                            className="frappe-input"
                            placeholder="e.g. clx123..."
                            value={targetEntityId}
                            onChange={e => setTargetEntityId(e.target.value)}
                            style={{ width: '100%' }}
                            required
                          />
                        </div>
                      </div>
                      <Button variant="outline" type="submit" disabled={matchingActionLoading}>Link & Reconcile</Button>
                    </form>
                  </div>

                  <div style={{ height: '1px', background: 'var(--color-border)' }} />

                  {/* Action 3: Ignore */}
                  <div>
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>Option 3: Disregard transaction</h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                      Ignore transfers like internal inter-account cash movements that are reconciled elsewhere.
                    </p>
                    <Button variant="outline" onClick={handleIgnore} style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                      Ignore Transaction
                    </Button>
                  </div>

                  {/* Feedback Message */}
                  {matchResultMsg && (
                    <div style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: matchResultMsg.type === 'success' ? 'rgba(34,197,94,0.08)' : matchResultMsg.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
                      border: `1px solid ${matchResultMsg.type === 'success' ? 'rgba(34,197,94,0.2)' : matchResultMsg.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                      color: matchResultMsg.type === 'success' ? '#16a34a' : matchResultMsg.type === 'error' ? '#ef4444' : '#1d4ed8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      fontSize: 'var(--text-sm)'
                    }}>
                      {matchResultMsg.type === 'success' ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                      <span>{matchResultMsg.text}</span>
                    </div>
                  )}

                </div>
              )}
            </Card>
          ) : (
            <Card className="frappe-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--color-text-secondary)' }}>
              <p>Select a transaction from the feed list to match and reconcile.</p>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
