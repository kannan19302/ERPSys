/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Loader2, RefreshCw, Download, Search, User,
  TrendingDown, CheckCircle2, AlertCircle, DollarSign
} from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface Customer { id: string; name: string; email?: string | null; }
interface StatementLine {
  date: string;
  invoiceNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
  dueDate: string;
}
interface Statement {
  customer: Customer;
  periodStart: string | null;
  periodEnd: string | null;
  openingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
  closingBalance: number;
  lines: StatementLine[];
  generatedAt: string;
}

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function CustomerStatementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingCustomers, setFetchingCustomers] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState('');

  const fetchCustomers = useCallback(async () => {
    setFetchingCustomers(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/crm/customers?limit=200', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json() as { data?: Customer[]; customers?: Customer[] } | Customer[];
        const list = Array.isArray(data) ? data : ((data as { data?: Customer[] }).data || (data as { customers?: Customer[] }).customers || []);
        setCustomers(list);
      }
    } catch (e) { console.error(e); }
    finally { setFetchingCustomers(false); }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (periodStart) params.set('periodStart', periodStart);
      if (periodEnd) params.set('periodEnd', periodEnd);
      const res = await fetch(`${API}/customer-statement/${customerId}?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setStatement(await res.json() as Statement);
      else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        alert('Error generating statement: ' + (err.message || 'Unknown error'));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleExportCsv = () => {
    if (!statement) return;
    const rows = ['Date,Invoice #,Description,Debit,Credit,Balance,Status,Due Date'];
    statement.lines.forEach((l) => {
      rows.push(`"${new Date(l.date).toLocaleDateString()}","${l.invoiceNumber}","${l.description}",${l.debit},${l.credit},${l.balance},"${l.status}","${new Date(l.dueDate).toLocaleDateString()}"`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `statement-${statement.customer.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchCustomer.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Customer Statement</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          Generate a full invoice/payment ledger for any customer within a period.
        </p>
      </div>

      {/* Filter Form */}
      <Card className="frappe-card">
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Statement Parameters</h3>
        </div>
        <form onSubmit={handleGenerate} style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="frappe-grid-3" style={{ gap: 'var(--space-4)', alignItems: 'end' }}>
              <div className="frappe-form-group">
                <label className="frappe-label">Customer *</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
                  <input
                    className="frappe-input"
                    placeholder="Search customers..."
                    value={searchCustomer}
                    onChange={e => setSearchCustomer(e.target.value)}
                    style={{ paddingLeft: '32px' }}
                  />
                </div>
                {fetchingCustomers ? (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Loading customers...</p>
                ) : (
                  <select
                    className="frappe-input"
                    required
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    style={{ marginTop: 'var(--space-2)' }}
                  >
                    <option value="">— Select customer —</option>
                    {filteredCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ''}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Period Start (optional)</label>
                <input className="frappe-input" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Period End (optional)</label>
                <input className="frappe-input" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button type="submit" variant="primary" disabled={loading || !customerId}>
                {loading ? <Loader2 className="animate-spin" size={16} style={{ marginRight: 'var(--space-2)' }} /> : <FileText size={16} style={{ marginRight: 'var(--space-2)' }} />}
                Generate Statement
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Statement Output */}
      {statement && (
        <>
          {/* Customer Summary */}
          <Card className="frappe-card">
            <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: 'rgba(79,70,229,0.08)' }}>
                  <User size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>{statement.customer.name}</h2>
                  {statement.customer.email && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{statement.customer.email}</p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="outline" size="sm" onClick={() => setStatement(null)}><RefreshCw size={14} style={{ marginRight: 'var(--space-1)' }} />New Statement</Button>
                <Button variant="outline" size="sm" onClick={handleExportCsv}><Download size={14} style={{ marginRight: 'var(--space-1)' }} />Export CSV</Button>
              </div>
            </div>
            <div style={{ padding: 'var(--space-5)' }}>
              <div className="frappe-grid-3" style={{ gap: 'var(--space-4)' }}>
                {[
                  { label: 'Total Invoiced', value: fmt(statement.totalInvoiced), icon: <DollarSign size={18} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
                  { label: 'Total Paid', value: fmt(statement.totalPaid), icon: <CheckCircle2 size={18} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
                  { label: 'Closing Balance', value: fmt(statement.closingBalance), icon: statement.closingBalance > 0 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />, color: statement.closingBalance > 0 ? '#ef4444' : '#22c55e', bg: statement.closingBalance > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', background: kpi.bg, color: kpi.color }}>{kpi.icon}</div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{kpi.label}</p>
                      <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: kpi.color }}>{kpi.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {(statement.periodStart || statement.periodEnd) && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)' }}>
                  Period: {statement.periodStart ? new Date(statement.periodStart).toLocaleDateString() : 'All time'} — {statement.periodEnd ? new Date(statement.periodEnd).toLocaleDateString() : 'Present'}
                </p>
              )}
            </div>
          </Card>

          {/* Statement Lines */}
          <Card className="frappe-card">
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Transaction Ledger</h3>
            </div>
            {statement.lines.length === 0 ? (
              <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <TrendingDown size={40} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
                <p>No transactions found for this period.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Date</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Invoice #</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Description</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Status</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Due Date</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Charges</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Payments</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.lines.map((line, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{new Date(line.date).toLocaleDateString()}</td>
                        <td style={{ padding: 'var(--space-3)', fontFamily: 'monospace', fontWeight: 'var(--weight-medium)' }}>{line.invoiceNumber}</td>
                        <td style={{ padding: 'var(--space-3)' }}>{line.description}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '1px 8px', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                            background: line.status === 'PAID' ? 'rgba(34,197,94,0.1)' : line.status === 'OVERDUE' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                            color: line.status === 'PAID' ? '#16a34a' : line.status === 'OVERDUE' ? '#ef4444' : '#d97706',
                          }}>{line.status}</span>
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{new Date(line.dueDate).toLocaleDateString()}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: '#ef4444' }}>{line.debit > 0 ? fmt(line.debit) : '—'}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: '#22c55e' }}>{line.credit > 0 ? fmt(line.credit) : '—'}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: line.balance > 0 ? '#ef4444' : '#16a34a' }}>{fmt(line.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                      <td colSpan={5} style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-bold)' }}>Closing Balance</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-bold)', color: '#ef4444' }}>{fmt(statement.totalInvoiced)}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-bold)', color: '#22c55e' }}>{fmt(statement.totalPaid)}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-bold)', color: statement.closingBalance > 0 ? '#ef4444' : '#16a34a' }}>{fmt(statement.closingBalance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
