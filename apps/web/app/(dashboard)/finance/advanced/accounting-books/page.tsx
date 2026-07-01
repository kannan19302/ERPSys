'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, BarChart2, ArrowLeftRight, CheckCircle } from 'lucide-react';
import { Card, Button, Badge } from '@unerp/ui';

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || res.statusText);
  }
  return res.json();
}

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

  const loadBooks = useCallback(async () => {
    try {
      const d = await apiFetch('/accounting-books');
      setBooks(Array.isArray(d) ? d : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load books');
    }
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const createBook = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await apiFetch('/accounting-books', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), standard: newStandard, isPrimary: newPrimary }),
      });
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
      const d = await apiFetch(`/accounting-books/${book.id}/trial-balance`);
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
      const d = await apiFetch(`/accounting-books/variance?book1=${book1Id}&book2=${book2Id}`);
      setVariance(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run variance report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <BookOpen size={28} style={{ color: 'var(--color-primary)' }} />
            Accounting Books
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Manage parallel GAAP ledgers — post journals per book, view trial balances, and compare book-to-book variances.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button onClick={() => setShowCreate(s => !s)}>
            <Plus size={14} style={{ marginRight: 'var(--space-1)' }} /> New Book
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-light)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <Card>
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>New Accounting Book</h3>
            <div className="frappe-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', display: 'block', marginBottom: 'var(--space-1)' }}>Book Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. IFRS 2025"
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', display: 'block', marginBottom: 'var(--space-1)' }}>Accounting Standard</label>
                <select
                  value={newStandard}
                  onChange={e => setNewStandard(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                >
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
              <input type="checkbox" checked={newPrimary} onChange={e => setNewPrimary(e.target.checked)} />
              Set as primary book for this organization
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button onClick={createBook} disabled={creating || !newName.trim()}>
                {creating ? 'Creating…' : 'Create Book'}
              </Button>
              <button onClick={() => setShowCreate(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Books grid */}
      {books.length === 0 ? (
        <Card>
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            <BookOpen size={40} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No accounting books yet. Create your first book above.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {books.map(b => (
            <Card key={b.id}>
              <div style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <BookOpen size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{b.name}</span>
                  </div>
                  <Badge variant={STANDARD_BADGE[b.standard] || 'default'} size="sm">{b.standard}</Badge>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
                  {b.organization.name}
                  {b.isPrimary && <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-success-text)' }}><CheckCircle size={12} style={{ display: 'inline', marginRight: 2 }} />Primary</span>}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    onClick={() => viewTrialBalance(b)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}
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
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ArrowLeftRight size={16} style={{ color: 'var(--color-primary)' }} /> Cross-Book Variance Report
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-3)', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', display: 'block', marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>Book A</label>
                <select value={book1Id} onChange={e => setBook1Id(e.target.value)} style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                  <option value="">Select…</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.name} ({b.standard})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', display: 'block', marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>Book B</label>
                <select value={book2Id} onChange={e => setBook2Id(e.target.value)} style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
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
          <div style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                Trial Balance — {selectedBook.name} <Badge variant={STANDARD_BADGE[selectedBook.standard] || 'default'} size="sm">{selectedBook.standard}</Badge>
              </h3>
              <button onClick={() => setView('list')} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Close</button>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading…</div>
            ) : trialBalance ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      {['Code', 'Account', 'Type', 'Debit', 'Credit', 'Balance'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Code' || h === 'Account' || h === 'Type' ? 'left' : 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalance.rows.map(r => (
                      <tr key={r.accountId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{r.code}</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{r.name}</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>{r.type}</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>{r.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>{r.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)', color: r.balance >= 0 ? 'var(--color-text-primary)' : 'var(--color-danger)' }}>
                          {r.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 'var(--weight-semibold)' }}>
                      <td colSpan={3} style={{ padding: 'var(--space-2) var(--space-3)' }}>Totals</td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>{trialBalance.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>{trialBalance.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </>
            ) : null}
          </div>
        </Card>
      )}

      {/* Variance View */}
      {view === 'variance' && variance && (
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                Variance: {variance.book1.name} vs {variance.book2.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  Total variance: <strong style={{ color: 'var(--color-warning-text)' }}>{variance.totalVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
                <button onClick={() => setView('list')} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Close</button>
              </div>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading…</div>
            ) : variance.variances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-success-text)', fontSize: 'var(--text-sm)' }}>
                <CheckCircle size={24} style={{ margin: '0 auto var(--space-3)' }} />
                No variances found — books are in agreement.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    {['Code', 'Account', `${variance.book1.name}`, `${variance.book2.name}`, 'Variance'].map(h => (
                      <th key={h} style={{ textAlign: h === 'Code' || h === 'Account' ? 'left' : 'right', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variance.variances.map(v => (
                    <tr key={v.accountId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{v.code}</td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{v.name}</td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>{v.book1Balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>{v.book2Balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: v.variance > 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                        {v.variance > 0 ? '+' : ''}{v.variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
