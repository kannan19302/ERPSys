'use client';

import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, BarChart2, ArrowLeftRight, CheckCircle, Trash2, Settings, HelpCircle, AlertCircle } from 'lucide-react';
import { Card, Button, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface AccountingBook {
  id: string;
  name: string;
  standard: string;
  isPrimary: boolean;
  isActive: boolean;
  organization: { id: string; name: string };
}

interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface VarianceRow {
  accountId: string;
  code: string;
  name: string;
  book1Balance: number;
  book2Balance: number;
  variance: number;
}

const STANDARDS = ['LOCAL_GAAP', 'IFRS', 'TAX', 'MANAGEMENT'];

const STANDARD_BADGE: Record<string, 'default' | 'primary' | 'info' | 'warning'> = {
  LOCAL_GAAP: 'default',
  IFRS: 'primary',
  TAX: 'warning',
  MANAGEMENT: 'info',
};

type View = 'list' | 'trial-balance' | 'variance';

export default function AccountingBooksPage() {
  const client = useApiClient();
  const [books, setBooks] = useState<AccountingBook[]>([]);
  const [view, setView] = useState<View>('list');
  const [selectedBook, setSelectedBook] = useState<AccountingBook | null>(null);
  const [trialBalance, setTrialBalance] = useState<{ book: { name: string; standard: string }; rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number } | null>(null);
  const [variance, setVariance] = useState<{ book1: { name: string }; book2: { name: string }; variances: VarianceRow[]; totalVariance: number } | null>(null);
  const [book1Id, setBook1Id] = useState('');
  const [book2Id, setBook2Id] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStandard, setNewStandard] = useState('LOCAL_GAAP');
  const [newPrimary, setNewPrimary] = useState(false);
  const [creating, setCreating] = useState(false);

  // Mapping rules states
  const [rules, setRules] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [creatingRule, setCreatingRule] = useState(false);
  const [newRule, setNewRule] = useState({
    sourceBookId: '',
    destinationBookId: '',
    sourceAccountId: '',
    destinationAccountId: '',
    ruleType: 'MAP_ACCOUNT',
    multiplier: 1.0,
  });

  const loadRules = useCallback(async () => {
    try {
      const d = await client.get<unknown>('/advanced-finance/accounting-books/rules');
      setRules(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error('Failed to load mapping rules', e);
    }
  }, [client]);

  const loadAccounts = useCallback(async () => {
    try {
      const d = await client.get<unknown>('/advanced-finance/accounts');
      setAccounts(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
  }, [client]);

  const loadBooks = useCallback(async () => {
    try {
      const d = await client.get<AccountingBook[]>('/advanced-finance/accounting-books');
      setBooks(Array.isArray(d) ? d : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load books');
    }
  }, [client]);

  useEffect(() => {
    loadBooks();
    loadRules();
    loadAccounts();
  }, [loadBooks, loadRules, loadAccounts]);

  const createBook = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await client.post('/advanced-finance/accounting-books', { name: newName.trim(), standard: newStandard, isPrimary: newPrimary });
      setShowCreate(false);
      setNewName('');
      setNewPrimary(false);
      loadBooks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const viewTrialBalance = async (book: AccountingBook) => {
    setLoading(true);
    setError(null);
    setSelectedBook(book);
    setView('trial-balance');
    try {
      const d = await client.get<{ book: { name: string; standard: string }; rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number }>(`/advanced-finance/accounting-books/${book.id}/trial-balance`);
      setTrialBalance(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  const runVariance = async () => {
    if (!book1Id || !book2Id) return;
    setLoading(true);
    setError(null);
    setView('variance');
    try {
      const d = await client.get<{ book1: { name: string }; book2: { name: string }; variances: VarianceRow[]; totalVariance: number }>(`/advanced-finance/accounting-books/variance?book1=${book1Id}&book2=${book2Id}`);
      setVariance(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run variance report');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.sourceBookId || !newRule.destinationBookId) {
      alert('Please select both source and destination books.');
      return;
    }
    if (newRule.sourceBookId === newRule.destinationBookId) {
      alert('Source and destination books cannot be the same.');
      return;
    }
    setCreatingRule(true);
    setError(null);
    try {
      await client.post('/advanced-finance/accounting-books/rules', {
          sourceBookId: newRule.sourceBookId,
          destinationBookId: newRule.destinationBookId,
          sourceAccountId: newRule.sourceAccountId || null,
          destinationAccountId: newRule.destinationAccountId || null,
          ruleType: newRule.ruleType,
          multiplier: Number(newRule.multiplier) || 1.0,
        });
      setShowCreateRule(false);
      setNewRule({
        sourceBookId: '',
        destinationBookId: '',
        sourceAccountId: '',
        destinationAccountId: '',
        ruleType: 'MAP_ACCOUNT',
        multiplier: 1.0,
      });
      loadRules();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create rule');
    } finally {
      setCreatingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mapping rule?')) return;
    try {
      await client.delete(`/advanced-finance/accounting-books/rules/${id}`);
      loadRules();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete rule');
    }
  };

  return (
    <RouteGuard permission="finance.accounting.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div className={styles.s1}>
        <div>
          <h1 className={styles.s2}>
            <BookOpen size={28} className="ui-text-primary" />
            Accounting Books
          </h1>
          <p className="ui-text-muted mt-1">
            Manage parallel GAAP ledgers — post journals per book, view trial balances, and compare book-to-book variances.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <Button onClick={() => setShowCreateRule(s => !s)} variant="secondary">
            <Settings size={14} className={styles.s3} /> Mapping Rules
          </Button>
          <Button onClick={() => setShowCreate(s => !s)}>
            <Plus size={14} className={styles.s4} /> New Book
          </Button>
        </div>
      </div>

      {error && (
        <div className={styles.s5}>
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <Card>
          <div className="p-5 ui-stack-4">
            <h3 className="ui-heading-base">New Accounting Book</h3>
            <div className="ui-grid-2 ui-grid-2">
              <div>
                <label className={styles.s6}>Book Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. IFRS 2025" className={styles.s7}
                />
              </div>
              <div>
                <label className={styles.s8}>Accounting Standard</label>
                <select
                  value={newStandard}
                  onChange={e => setNewStandard(e.target.value)} className={styles.s9}
                >
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <label className={styles.s10}>
              <input type="checkbox" checked={newPrimary} onChange={e => setNewPrimary(e.target.checked)} />
              Set as primary book for this organization
            </label>
            <div className="ui-flex ui-gap-2">
              <Button onClick={createBook} disabled={creating || !newName.trim()}>
                {creating ? 'Creating…' : 'Create Book'}
              </Button>
              <button onClick={() => setShowCreate(false)} className={styles.s11}>
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Rule Form */}
      {showCreateRule && (
        <Card>
          <div className="p-5 ui-stack-4">
            <h3 className={styles.s12}>
              <Settings size={18} className="ui-text-primary" /> Configure Multi-Book Parallel Mapping Rule
            </h3>
            <div className={styles.s13}>
              <div>
                <label className={styles.s14}>Source Book (From)</label>
                <select
                  value={newRule.sourceBookId}
                  onChange={e => setNewRule({ ...newRule, sourceBookId: e.target.value })} className={styles.s15}
                >
                  <option value="">Select source book…</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.standard})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.s16}>Destination Book (To)</label>
                <select
                  value={newRule.destinationBookId}
                  onChange={e => setNewRule({ ...newRule, destinationBookId: e.target.value })} className={styles.s17}
                >
                  <option value="">Select destination book…</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.standard})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.s18}>Rule Type</label>
                <select
                  value={newRule.ruleType}
                  onChange={e => setNewRule({ ...newRule, ruleType: e.target.value })} className={styles.s19}
                >
                  <option value="MAP_ACCOUNT">Map to specific Account</option>
                  <option value="POST_DIRECTLY">Post directly to same Account Code</option>
                  <option value="EXCLUDE_ACCOUNT">Exclude Account (Do not post)</option>
                </select>
              </div>

              {newRule.ruleType === 'MAP_ACCOUNT' && (
                <>
                  <div>
                    <label className={styles.s20}>Source Account</label>
                    <select
                      value={newRule.sourceAccountId}
                      onChange={e => setNewRule({ ...newRule, sourceAccountId: e.target.value })} className={styles.s21}
                    >
                      <option value="">Select source account (optional)…</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={styles.s22}>Destination Account</label>
                    <select
                      value={newRule.destinationAccountId}
                      onChange={e => setNewRule({ ...newRule, destinationAccountId: e.target.value })} className={styles.s23}
                    >
                      <option value="">Select destination account…</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className={styles.s24}>Multiplier (Amount Scale)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newRule.multiplier}
                  onChange={e => setNewRule({ ...newRule, multiplier: parseFloat(e.target.value) || 1.0 })} className={styles.s25}
                />
              </div>
            </div>

            <div className={styles.s26}>
              <Button onClick={handleCreateRule} disabled={creatingRule}>
                {creatingRule ? 'Saving Rule…' : 'Save Rule'}
              </Button>
              <button onClick={() => setShowCreateRule(false)} className={styles.s27}>
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Books grid */}
      {books.length === 0 ? (
        <Card>
          <div className={styles.s28}>
            <BookOpen size={40} className={styles.s29} />
            <p className="text-sm">No accounting books yet. Create your first book above.</p>
          </div>
        </Card>
      ) : (
        <div className={styles.s30}>
          {books.map(b => (
            <Card key={b.id}>
              <div className="p-5">
                <div className={styles.s31}>
                  <div className="ui-hstack-2">
                    <BookOpen size={16} className={styles.s32} />
                    <span className="ui-heading-sm">{b.name}</span>
                  </div>
                  <Badge variant={STANDARD_BADGE[b.standard] || 'default'} size="sm">{b.standard}</Badge>
                </div>
                <p className={styles.s33}>
                  {b.organization.name}
                  {b.isPrimary && <span className={styles.s34}><CheckCircle size={12} className={styles.s35} />Primary</span>}
                </p>
                <div className="ui-flex ui-gap-2">
                  <button
                    onClick={() => viewTrialBalance(b)} className={styles.s36}
                  >
                    <BarChart2 size={12} /> Trial Balance
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Variance Report Tool */}
      {books.length >= 2 && (
        <Card>
          <div className="p-5">
            <h3 className={styles.s37}>
              <ArrowLeftRight size={16} className="ui-text-primary" /> Cross-Book Variance Report
            </h3>
            <div className={styles.s38}>
              <div>
                <label className={styles.s39}>Book A</label>
                <select value={book1Id} onChange={e => setBook1Id(e.target.value)} className={styles.s40}>
                  <option value="">Select…</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.name} ({b.standard})</option>)}
                </select>
              </div>
              <div>
                <label className={styles.s41}>Book B</label>
                <select value={book2Id} onChange={e => setBook2Id(e.target.value)} className={styles.s42}>
                  <option value="">Select…</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.name} ({b.standard})</option>)}
                </select>
              </div>
              <Button onClick={runVariance} disabled={!book1Id || !book2Id || book1Id === book2Id || loading}>
                Run Report
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Trial Balance View */}
      {view === 'trial-balance' && selectedBook && (
        <Card>
          <div className="p-5">
            <div className="ui-flex-between mb-4">
              <h3 className="ui-heading-base">
                Trial Balance — {selectedBook.name} <Badge variant={STANDARD_BADGE[selectedBook.standard] || 'default'} size="sm">{selectedBook.standard}</Badge>
              </h3>
              <button onClick={() => setView('list')} className={styles.s43}>✕ Close</button>
            </div>
            {loading ? (
              <div className={styles.s44}>Loading…</div>
            ) : trialBalance ? (
              <>
                <ListPageTemplate
                  columns={[
                    { key: 'code', header: 'Code', render: (v) => <span className={styles.s45}>{String(v)}</span> },
                    { key: 'name', header: 'Account' },
                    { key: 'type', header: 'Type', render: (v) => <span className={styles.s46}>{String(v)}</span> },
                    { key: 'debit', header: 'Debit', render: (v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                    { key: 'credit', header: 'Credit', render: (v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                    { key: 'balance', header: 'Balance', render: (v) => <span className={`${styles.balance} ${Number(v) >= 0 ? styles.balancePositive : styles.balanceNegative}`}>{Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                  ] as ListColumn[]}
                  data={(trialBalance.rows as unknown as Record<string, unknown>[])}
                  loading={false}
                  emptyTitle="No trial balance data"
                  emptyDescription="No accounts found for trial balance."
                />
              </>
            ) : null}
          </div>
        </Card>
      )}

      {/* Variance View */}
      {view === 'variance' && variance && (
        <Card>
          <div className="p-5">
            <div className="ui-flex-between mb-4">
              <h3 className="ui-heading-base">
                Variance: {variance.book1.name} vs {variance.book2.name}
              </h3>
              <div className="ui-hstack-4">
                <span className="ui-text-sm-muted">
                  Total variance: <strong className={styles.s47}>{variance.totalVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
                <button onClick={() => setView('list')} className={styles.s48}>✕ Close</button>
              </div>
            </div>
            {loading ? (
              <div className={styles.s49}>Loading…</div>
            ) : variance.variances.length === 0 ? (
              <div className={styles.s50}>
                <CheckCircle size={24} className={styles.s51} />
                No variances found — books are in agreement.
              </div>
            ) : (
              <ListPageTemplate
                columns={[
                  { key: 'code', header: 'Code', render: (v) => <span className={styles.s52}>{String(v)}</span> },
                  { key: 'name', header: 'Account' },
                  { key: 'book1Balance', header: variance.book1.name, render: (v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                  { key: 'book2Balance', header: variance.book2.name, render: (v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                  { key: 'variance', header: 'Variance', render: (v) => <span className={`${styles.variance} ${Number(v) > 0 ? styles.variancePositive : styles.varianceNegative}`}>{Number(v) > 0 ? '+' : ''}{Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                ] as ListColumn[]}
                data={(variance.variances as unknown as Record<string, unknown>[])}
                loading={false}
                emptyTitle="No variances"
                emptyDescription="Books are in agreement."
              />
            )}
          </div>
        </Card>
      )}

      {/* Mapping Rules List */}
      {view === 'list' && (
        <Card>
          <div className="p-5">
            <h3 className={styles.s53}>
              <Settings size={16} className="ui-text-primary" /> Parallel Ledger Posting & Mapping Rules
            </h3>
            {rules.length === 0 ? (
              <div className={styles.s54}>
                <HelpCircle size={32} className={styles.s55} />
                <p className="text-xs">No mapping rules configured yet. Create one to automatically map journal entries across books.</p>
              </div>
            ) : (
              <div className="builder-table-wrapper">
                <ListPageTemplate
                  columns={[
                    { key: 'sourceBook', header: 'Source Book', render: (v) => <span><strong>{(v as any)?.name}</strong> <span className={styles.s56}>({(v as any)?.standard})</span></span> },
                    { key: 'destinationBook', header: 'Destination Book', render: (v) => <span><strong>{(v as any)?.name}</strong> <span className={styles.s57}>({(v as any)?.standard})</span></span> },
                    { key: 'ruleType', header: 'Rule Type', render: (v) => <Badge variant="info" size="sm">{String(v)}</Badge> },
                    { key: 'sourceAccount', header: 'Source Account', render: (v) => <span className={styles.s58}>{(v as any) ? `${(v as any).code} - ${(v as any).name}` : 'All Accounts (Fallback)'}</span> },
                    { key: 'destinationAccount', header: 'Destination Account', render: (v, row) => <span className={styles.s59}>{(v as any) ? `${(v as any).code} - ${(v as any).name}` : (row.ruleType === 'EXCLUDE_ACCOUNT' ? '—' : 'Same Account Code')}</span> },
                    { key: 'multiplier', header: 'Multiplier', render: (v) => <span className="font-mono">{Number(v)}x</span> },
                    { key: 'id', header: 'Actions', render: (v) => (
                      <button onClick={() => handleDeleteRule(String(v))} className={styles.s60} title="Delete Mapping Rule">
                        <Trash2 size={14} />
                      </button>
                    ) },
                  ] as ListColumn[]}
                  data={(rules as unknown as Record<string, unknown>[])}
                  loading={false}
                  emptyTitle="No mapping rules configured"
                  emptyDescription="Create one to automatically map journal entries across books."
                />
              </div>
            )}
          </div>
        </Card>
      )}
      </div>
    </RouteGuard>
  );
}
