'use client';

import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, StatusBadge } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function BankReconMatchingPage() {
  const client = useApiClient();
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
      const body = await client.get<{ data: BankTransaction[] }>(`/advanced-finance/bank-feeds/transactions?status=${filterStatus}`);
        setTransactions(body.data);
        if (body.data.length > 0) {
          // Keep selection if it still exists in the list, otherwise select first
          const found = body.data.find(x => x.id === selectedTx?.id);
          setSelectedTx(found || body.data[0] || null);
        } else {
          setSelectedTx(null);
        }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [client, filterStatus, selectedTx?.id]);

  useEffect(() => {
    fetchTransactions();
    setMatchResultMsg(null);
  }, [filterStatus]);

  const handleAutoMatch = async () => {
    if (!selectedTx) return;
    setMatchingActionLoading(true);
    setMatchResultMsg(null);
    try {
      const result = await client.post<{ matched: boolean; type?: string; record?: { id: string }; message?: string }>(`/advanced-finance/bank-feeds/transactions/${selectedTx.id}/auto-match`);
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
    } catch {
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
      await client.post(`/advanced-finance/bank-feeds/transactions/${selectedTx.id}/manual-match`, {
          matchedEntityId: targetEntityId,
          matchedEntityType: targetEntityType,
        });
        setMatchResultMsg({
          type: 'success',
          text: `Successfully linked transaction to ${targetEntityType} ${targetEntityId}.`,
        });
        setTargetEntityId('');
        fetchTransactions();
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
      await client.post(`/advanced-finance/bank-feeds/transactions/${selectedTx.id}/ignore`);
      alert('Transaction ignored.');
      fetchTransactions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <RouteGuard permission="finance.treasury.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div className={styles.s1}>
        <div>
          <h1 className="text-3xl">Bank reconciliation & Matching</h1>
          <p className="ui-text-muted mt-1">
            Compare, match and reconcile downloaded bank transaction statements against GL entries and accounts receivable payments.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw size={16} className="mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.s2}>
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
            className={`${styles.filterTab} ${filterStatus === tab.key ? styles.filterTabActive : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`ui-grid-2 ${styles.s3}`}>

        {/* Left Side: Transactions List */}
        <Card className={`ui-card ${styles.s4}`}>
          <div className={styles.s5}>
            <h3 className="ui-heading-base">Statement Feed</h3>
          </div>

          {loading ? (
            <div className={styles.s6}>
              <Loader2 className="animate-spin h-6 w-6 ui-text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className={styles.s7}>
              <ShieldCheck size={36} className={styles.s8} />
              <p className="font-medium">No transactions found</p>
              <p className={styles.s9}>All feed downloads for this category are reconciled.</p>
            </div>
          ) : (
            <div className={styles.s10}>
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
                    className={`${styles.transaction} ${isSelected ? styles.transactionSelected : ''}`}
                  >
                    <div>
                      <p className="ui-heading-sm">{tx.description}</p>
                      <p className="ui-text-xs-muted mt-1">
                        {new Date(tx.date).toLocaleDateString()} • {tx.connection?.bankName || 'Direct Feed'}
                      </p>
                    </div>
                    <div className={styles.s11}>
                      <span className={`${styles.transactionAmount} ${amt > 0 ? styles.amountPositive : styles.amountNegative}`}>
                        {amt > 0 ? '+' : ''}{fmt(amt)}
                      </span>
                      <ChevronRight size={16} className={styles.s12} />
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
            <Card className={`ui-card ${styles.s13}`}>

              {/* Transaction Header Info */}
              <div className={styles.s14}>
                <p className={styles.s15}>Selected statement transaction</p>
                <h3 className={styles.s16}>{selectedTx.description}</h3>
                <div className={styles.s17}>
                  <div className="ui-flex ui-gap-3">
                    <div>
                      <p className="ui-text-xs-muted">Statement Date</p>
                      <p className={styles.s18}>{new Date(selectedTx.date).toLocaleDateString()}</p>
                    </div>
                    <div className={styles.s19}>
                      <p className="ui-text-xs-muted">Source Connection</p>
                      <p className={styles.s20}>{selectedTx.connection?.bankName || 'Connected bank feed'}</p>
                    </div>
                  </div>
                  <span className={`${styles.selectedAmount} ${Number(selectedTx.amount) > 0 ? styles.amountPositive : styles.amountNegative}`}>
                    {Number(selectedTx.amount) > 0 ? '+' : ''}{fmt(Number(selectedTx.amount))}
                  </span>
                </div>
              </div>

              {/* Status Display if already matched/ignored */}
              {filterStatus !== 'UNMATCHED' && (
                <div className={styles.s21}>
                  <p className="ui-heading-sm">Matching Log</p>
                  <p className="ui-text-xs-muted mt-1">
                    Reconciliation Status: <span className={styles.s22}>{selectedTx.status}</span>
                  </p>
                  {selectedTx.matchedEntityId && (
                    <p className="ui-text-xs-muted mt-1">
                      Linked Ledger: {selectedTx.matchedEntityType} ({selectedTx.matchedEntityId})
                    </p>
                  )}
                </div>
              )}

              {/* Matching Actions (Only for UNMATCHED) */}
              {filterStatus === 'UNMATCHED' && (
                <div className={styles.s23}>

                  {/* Action 1: Auto Match */}
                  <div>
                    <h4 className={styles.s24}>Option 1: Automated Smart Reconciliation</h4>
                    <p className={styles.s25}>
                      Scan our ledger journals and invoices to match by exact amount and date timeline (+/- 7 days).
                    </p>
                    <Button variant="primary" onClick={handleAutoMatch} disabled={matchingActionLoading} className="ui-hstack-2">
                      {matchingActionLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <GitCompare size={16} />
                      )}
                      Run Smart Match
                    </Button>
                  </div>

                  <div className={styles.s26} />

                  {/* Action 2: Manual match */}
                  <div>
                    <h4 className={styles.s27}>Option 2: Reference Linked Ledger Entry</h4>
                    <p className={styles.s28}>
                      Manually map the download statement entry to a specific Payment or GL Journal entry ID.
                    </p>
                    <form onSubmit={handleManualMatch} className="ui-stack-3">
                      <div className={`ui-grid-2 ${styles.s29}`}>
                        <div className="ui-form-group">
                          <label className={`ui-label ${styles.s30}`}>Link Entity Type</label>
                          <select
                            className="ui-input w-full"
                            value={targetEntityType}
                            onChange={e => setTargetEntityType(e.target.value as any)}
                          >
                            <option value="PAYMENT">Invoice Payment Record</option>
                            <option value="JOURNAL_ENTRY">Journal Transaction Entry</option>
                          </select>
                        </div>
                        <div className="ui-form-group">
                          <label className={`ui-label ${styles.s31}`}>Entity UUID</label>
                          <input
                            type="text"
                            className="ui-input w-full"
                            placeholder="e.g. clx123..."
                            value={targetEntityId}
                            onChange={e => setTargetEntityId(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <Button variant="outline" type="submit" disabled={matchingActionLoading}>Link & Reconcile</Button>
                    </form>
                  </div>

                  <div className={styles.s32} />

                  {/* Action 3: Ignore */}
                  <div>
                    <h4 className={styles.s33}>Option 3: Disregard transaction</h4>
                    <p className={styles.s34}>
                      Ignore transfers like internal inter-account cash movements that are reconciled elsewhere.
                    </p>
                    <Button variant="outline" onClick={handleIgnore} className={styles.s35}>
                      Ignore Transaction
                    </Button>
                  </div>

                  {/* Feedback Message */}
                  {matchResultMsg && (
                    <div className={`${styles.feedback} ${matchResultMsg.type === 'success' ? styles.feedbackSuccess : matchResultMsg.type === 'error' ? styles.feedbackError : styles.feedbackInfo}`}>
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
            <Card className={`ui-card ${styles.s36}`}>
              <p>Select a transaction from the feed list to match and reconcile.</p>
            </Card>
          )}
        </div>

      </div>
      </div>
    </RouteGuard>
  );
}
