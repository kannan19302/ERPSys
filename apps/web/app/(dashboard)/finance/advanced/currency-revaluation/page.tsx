'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, TrendingUp, TrendingDown, Play, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

export default function CurrencyRevaluationPage() {
  const client = useApiClient();
  const [history, setHistory] = useState<Revaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [baseCurrency, setBaseCurrency] = useState('USD');

  const fetchHistory = async () => {
    try {
      setHistory(await client.get<Revaluation[]>('/advanced-finance/currency-revaluations'));
    } catch {
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
      await client.post('/advanced-finance/currency-revaluations/run', { asOfDate: new Date(asOfDate).toISOString(), baseCurrency });
      await fetchHistory();
    } catch {
      setError('Could not reach the finance service.');
    } finally {
      setRunning(false);
    }
  };

  const money = (v: number | string) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="p-8 ui-flex-center"><Loader2 className="animate-spin h-8 w-8 ui-text-primary" /></div>;

  const latest = history[0];

  return (
    <RouteGuard permission="finance.treasury.read">
      <div className="p-8 ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className="text-3xl">Currency Revaluation</h1>
          <p className="ui-text-muted mt-1">Revalue open foreign-currency AR balances and recognise unrealized FX gain/loss.</p>
        </div>
      </div>

      {error && (
        <div className={`border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 ${styles.s1}`} >{error}</div>
      )}

      {/* Run panel */}
      <Card className="border-primary/20">
        <div className={styles.s2}>
          <div className="ui-stack-2">
            <label className="ui-heading-sm">As-of Date</label>
            <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)}
              className={styles.s3} />
          </div>
          <div className="ui-stack-2">
            <label className="ui-heading-sm">Base Currency</label>
            <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}
              className={`h-10 w-44 border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring ${styles.s4}`} >
              {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Button onClick={runRevaluation} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="mr-2" />}
            Run Revaluation
          </Button>
        </div>
      </Card>

      {/* Latest summary KPIs */}
      {latest && (
        <div className="ui-grid-3">
          <Card><div className="p-5">
            <div className={styles.s5}><TrendingUp className="ui-text-success" /> Latest Unrealized Gain</div>
            <div className={styles.s6}>{latest.baseCurrency} {money(latest.totalGain)}</div>
          </div></Card>
          <Card><div className="p-5">
            <div className={styles.s5}><TrendingDown className="ui-text-danger" /> Latest Unrealized Loss</div>
            <div className={styles.s7}>{latest.baseCurrency} {money(latest.totalLoss)}</div>
          </div></Card>
          <Card><div className="p-5">
            <div className={styles.s5}><RefreshCw className="ui-text-primary" /> Net Adjustment</div>
            <div className={`text-2xl font-bold mt-2 ${Number(latest.netAdjustment) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{latest.baseCurrency} {money(latest.netAdjustment)}</div>
          </div></Card>
        </div>
      )}

      {/* History */}
      <Card>
        <div className="p-6"><h3 className={styles.s8}>Revaluation History</h3></div>
        <div className={styles.s9}>
          {history.length === 0 && (
            <div className={styles.s10}>
              <RefreshCw className="mb-4" />
              <h3 className={styles.s11}>No revaluation runs yet</h3>
              <p>Run a revaluation above to recognise unrealized FX gains and losses.</p>
            </div>
          )}
          {history.map((r) => {
            const isOpen = expanded === r.id;
            const net = Number(r.netAdjustment);
            return (
              <div key={r.id} className={styles.s12}>
                <button onClick={() => setExpanded(isOpen ? null : r.id)}
                  className={`hover:bg-muted/30 ${styles.s13}`} >
                  <div className="ui-hstack-3">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <div className="ui-heading-sm">{r.runNumber}</div>
                      <div className="ui-text-xs-muted">As of {new Date(r.asOfDate).toLocaleDateString()} · base {r.baseCurrency} · {r.lines?.length || 0} items</div>
                    </div>
                  </div>
                  <div className="ui-hstack-4">
                    <span className={`font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{net >= 0 ? '+' : ''}{money(r.netAdjustment)}</span>
                    {r.journalId && <span className={styles.s14}>Posted</span>}
                  </div>
                </button>
                {isOpen && (
                  <div className={styles.s15}>
                    <ListPageTemplate
                      columns={[
                        { key: 'source', header: 'Source', render: (v) => <span className="ui-text-muted">{String(v)}</span> },
                        { key: 'ref', header: 'Reference', render: (v) => <span className="font-mono">{String(v)}</span> },
                        { key: 'foreignAmount', header: 'Outstanding', render: (v, row) => `${String(row.currency)} ${money(Number(v))}` },
                        { key: 'bookRate', header: 'Book Rate', render: (v) => Number(v).toFixed(4) },
                        { key: 'currentRate', header: 'Current Rate', render: (v) => Number(v).toFixed(4) },
                        { key: 'bookValue', header: 'Book Value', render: (v) => money(Number(v)) },
                        { key: 'currentValue', header: 'Current Value', render: (v) => money(Number(v)) },
                        { key: 'delta', header: 'FX Δ', render: (v) => <span className={`font-semibold ${Number(v) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Number(v) >= 0 ? '+' : ''}{money(Number(v))}</span> },
                      ] as ListColumn[]}
                      data={((r.lines || []) as unknown as Record<string, unknown>[])}
                      loading={false}
                      emptyTitle="No lines"
                      emptyDescription="No revaluable balances in this run."
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      </div>
    </RouteGuard>
  );
}
