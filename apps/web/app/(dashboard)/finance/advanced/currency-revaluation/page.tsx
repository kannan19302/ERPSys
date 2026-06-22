/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, TrendingUp, TrendingDown, Play, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface RevalLine {
  source: string;
  ref: string;
  currency: string;
  foreignAmount: number;
  bookRate: number;
  currentRate: number;
  bookValue: number;
  currentValue: number;
  delta: number;
}

interface Revaluation {
  id: string;
  runNumber: string;
  asOfDate: string;
  baseCurrency: string;
  status: string;
  totalGain: number | string;
  totalLoss: number | string;
  netAdjustment: number | string;
  journalId: string | null;
  lines: RevalLine[];
}

const API = 'http://localhost:3001/api/v1/advanced-finance';

export default function CurrencyRevaluationPage() {
  const [history, setHistory] = useState<Revaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [baseCurrency, setBaseCurrency] = useState('USD');

  const token = () => (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('admin_token') || '') : '');

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/currency-revaluations`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) setHistory((await res.json()) as Revaluation[]);
      else setError('Could not load revaluation history.');
    } catch (e) {
      console.error(e);
      setError('Could not reach the finance service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const runRevaluation = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`${API}/currency-revaluations/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ asOfDate: new Date(asOfDate).toISOString(), baseCurrency }),
      });
      if (!res.ok) { setError('Revaluation run failed. Check that exchange rates exist for open balances.'); return; }
      await fetchHistory();
    } catch (e) {
      console.error(e);
      setError('Could not reach the finance service.');
    } finally {
      setRunning(false);
    }
  };

  const money = (v: number | string) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  const latest = history[0];

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Currency Revaluation</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Revalue open foreign-currency AR balances and recognise unrealized FX gain/loss.</p>
        </div>
      </div>

      {error && (
        <div className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-4)', paddingBlock: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>{error}</div>
      )}

      {/* Run panel */}
      <Card className="border-primary/20">
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>As-of Date</label>
            <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)}
              style={{ display: 'flex', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Base Currency</label>
            <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}
              className="h-10 w-44 border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Button onClick={runRevaluation} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" style={{ marginRight: 'var(--space-2)' }} /> : <Play style={{ marginRight: 'var(--space-2)' }} />}
            Run Revaluation
          </Button>
        </div>
      </Card>

      {/* Latest summary KPIs */}
      {latest && (
        <div className="frappe-grid-3">
          <Card><div style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}><TrendingUp style={{ color: 'var(--color-success)' }} /> Latest Unrealized Gain</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)', marginTop: 'var(--space-2)' }}>{latest.baseCurrency} {money(latest.totalGain)}</div>
          </div></Card>
          <Card><div style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}><TrendingDown style={{ color: 'var(--color-danger)' }} /> Latest Unrealized Loss</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-danger)', marginTop: 'var(--space-2)' }}>{latest.baseCurrency} {money(latest.totalLoss)}</div>
          </div></Card>
          <Card><div style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}><RefreshCw style={{ color: 'var(--color-primary)' }} /> Net Adjustment</div>
            <div className={`text-2xl font-bold mt-2 ${Number(latest.netAdjustment) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{latest.baseCurrency} {money(latest.netAdjustment)}</div>
          </div></Card>
        </div>
      )}

      {/* History */}
      <Card>
        <div style={{ padding: 'var(--space-6)' }}><h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Revaluation History</h3></div>
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {history.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
              <RefreshCw style={{ marginBottom: 'var(--space-4)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-1)' }}>No revaluation runs yet</h3>
              <p>Run a revaluation above to recognise unrealized FX gains and losses.</p>
            </div>
          )}
          {history.map((r) => {
            const isOpen = expanded === r.id;
            const net = Number(r.netAdjustment);
            return (
              <div key={r.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <button onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="hover:bg-muted/30" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', paddingInline: 'var(--space-4)', paddingBlock: 'var(--space-3)', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{r.runNumber}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>As of {new Date(r.asOfDate).toLocaleDateString()} · base {r.baseCurrency} · {r.lines?.length || 0} items</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <span className={`font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{net >= 0 ? '+' : ''}{money(r.netAdjustment)}</span>
                    {r.journalId && <span style={{ fontSize: 'var(--text-xs)', paddingInline: 'var(--space-2)', borderRadius: '9999px' }}>Posted</span>}
                  </div>
                </button>
                {isOpen && (
                  <div style={{ paddingInline: 'var(--space-4)', paddingBottom: 'var(--space-4)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderTop: '1px solid var(--color-border)' }}>
                      <thead>
                        <tr style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          <th style={{ textAlign: 'left', paddingBlock: 'var(--space-2)' }}>Source</th>
                          <th style={{ textAlign: 'left' }}>Reference</th>
                          <th style={{ textAlign: 'right' }}>Outstanding</th>
                          <th style={{ textAlign: 'right' }}>Book Rate</th>
                          <th style={{ textAlign: 'right' }}>Current Rate</th>
                          <th style={{ textAlign: 'right' }}>Book Value</th>
                          <th style={{ textAlign: 'right' }}>Current Value</th>
                          <th style={{ textAlign: 'right' }}>FX Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(r.lines || []).map((l, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                            <td style={{ paddingBlock: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>{l.source}</td>
                            <td className="font-mono">{l.ref}</td>
                            <td style={{ textAlign: 'right' }}>{l.currency} {money(l.foreignAmount)}</td>
                            <td style={{ textAlign: 'right' }}>{Number(l.bookRate).toFixed(4)}</td>
                            <td style={{ textAlign: 'right' }}>{Number(l.currentRate).toFixed(4)}</td>
                            <td style={{ textAlign: 'right' }}>{money(l.bookValue)}</td>
                            <td style={{ textAlign: 'right' }}>{money(l.currentValue)}</td>
                            <td className={`text-right font-semibold ${l.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{l.delta >= 0 ? '+' : ''}{money(l.delta)}</td>
                          </tr>
                        ))}
                        {(!r.lines || r.lines.length === 0) && (
                          <tr><td colSpan={8} style={{ paddingBlock: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No revaluable balances in this run.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
