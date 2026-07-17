'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Loader2, RefreshCw, Download, Search, User,
  TrendingDown, CheckCircle2, AlertCircle, DollarSign
} from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function CustomerStatementPage() {
  const client = useApiClient();
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
      const data = await client.get<{ data?: Customer[]; customers?: Customer[] } | Customer[]>('/crm/customers?limit=200');
        const list = Array.isArray(data) ? data : ((data as { data?: Customer[] }).data || (data as { customers?: Customer[] }).customers || []);
        setCustomers(list);
    } catch { alert('Unable to load customers.'); }
    finally { setFetchingCustomers(false); }
  }, [client]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (periodStart) params.set('periodStart', periodStart);
      if (periodEnd) params.set('periodEnd', periodEnd);
      setStatement(await client.get<Statement>(`/advanced-finance/customer-statement/${customerId}?${params}`));
    } catch { alert('Unable to generate the customer statement.'); }
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
    <RouteGuard permission="finance.receivable.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl">Customer Statement</h1>
        <p className="ui-text-muted mt-1">
          Generate a full invoice/payment ledger for any customer within a period.
        </p>
      </div>

      {/* Filter Form */}
      <Card className="ui-card">
        <div className={styles.s1}>
          <h3 className="ui-heading-base">Statement Parameters</h3>
        </div>
        <form onSubmit={handleGenerate} className="p-5">
          <div className="ui-stack-4">
            <div className={`ui-grid-3 ${styles.s2}`} >
              <div className="ui-form-group">
                <label className="ui-label">Customer *</label>
                <div className="relative">
                  <Search size={14} className={styles.s3} />
                  <input
                    className={`ui-input ${styles.s4}`}
                    placeholder="Search customers..."
                    value={searchCustomer}
                    onChange={e => setSearchCustomer(e.target.value)}

                  />
                </div>
                {fetchingCustomers ? (
                  <p className="ui-text-xs-muted mt-1">Loading customers...</p>
                ) : (
                  <select
                    className={`ui-input ${styles.s5}`}
                    required
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}

                  >
                    <option value="">— Select customer —</option>
                    {filteredCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ''}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Period Start (optional)</label>
                <input className="ui-input" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Period End (optional)</label>
                <input className="ui-input" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
              </div>
            </div>
            <div className="ui-flex-end ui-gap-2">
              <Button type="submit" variant="primary" disabled={loading || !customerId}>
                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <FileText size={16} className="mr-2" />}
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
          <Card className="ui-card">
            <div className={styles.s6}>
              <div className="ui-hstack-3">
                <div className={styles.s7}>
                  <User size={20} className="ui-text-primary" />
                </div>
                <div>
                  <h2 className="ui-heading-lg">{statement.customer.name}</h2>
                  {statement.customer.email && (
                    <p className="ui-text-sm-muted">{statement.customer.email}</p>
                  )}
                </div>
              </div>
              <div className="ui-flex ui-gap-2">
                <Button variant="outline" size="sm" onClick={() => setStatement(null)}><RefreshCw size={14} className={styles.s8} />New Statement</Button>
                <Button variant="outline" size="sm" onClick={handleExportCsv}><Download size={14} className={styles.s8} />Export CSV</Button>
              </div>
            </div>
            <div className="p-5">
              <div className={`ui-grid-3 ${styles.s9}`} >
                {[
                  { label: 'Total Invoiced', value: fmt(statement.totalInvoiced), icon: <DollarSign size={18} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
                  { label: 'Total Paid', value: fmt(statement.totalPaid), icon: <CheckCircle2 size={18} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
                  { label: 'Closing Balance', value: fmt(statement.closingBalance), icon: statement.closingBalance > 0 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />, color: statement.closingBalance > 0 ? '#ef4444' : '#22c55e', bg: statement.closingBalance > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' },
                ].map(kpi => (
                  <div key={kpi.label} className={styles.s10}>
                    <div style={{ background: kpi.bg, color: kpi.color }} className={styles.s11}>{kpi.icon}</div>
                    <div>
                      <p className="ui-text-xs-muted">{kpi.label}</p>
                      <p style={{ color: kpi.color }} className={styles.s12}>{kpi.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {(statement.periodStart || statement.periodEnd) && (
                <p className={styles.s13}>
                  Period: {statement.periodStart ? new Date(statement.periodStart).toLocaleDateString() : 'All time'} — {statement.periodEnd ? new Date(statement.periodEnd).toLocaleDateString() : 'Present'}
                </p>
              )}
            </div>
          </Card>

          {/* Statement Lines */}
          <Card className="ui-card">
            <div className={styles.s14}>
              <h3 className="ui-heading-base">Transaction Ledger</h3>
            </div>
            {statement.lines.length === 0 ? (
              <div className={styles.s15}>
                <TrendingDown size={40} className={styles.s16} />
                <p>No transactions found for this period.</p>
              </div>
            ) : (
              <ListPageTemplate
                columns={[
                  { key: 'date', header: 'Date', render: (v) => <span className="ui-text-muted">{new Date(String(v)).toLocaleDateString()}</span> },
                  { key: 'invoiceNumber', header: 'Invoice #', render: (v) => <span className={styles.s17}>{String(v)}</span> },
                  { key: 'description', header: 'Description' },
                  { key: 'status', header: 'Status', render: (v) => (
                    <span style={{ background: v === 'PAID' ? 'rgba(34,197,94,0.1)' : v === 'OVERDUE' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: v === 'PAID' ? '#16a34a' : v === 'OVERDUE' ? '#ef4444' : '#d97706' }} className={styles.s18}>{String(v)}</span>
                  ) },
                  { key: 'dueDate', header: 'Due Date', render: (v) => new Date(String(v)).toLocaleDateString() },
                  { key: 'debit', header: 'Charges', render: (v) => <span className={styles.s19}>{Number(v) > 0 ? fmt(Number(v)) : '—'}</span> },
                  { key: 'credit', header: 'Payments', render: (v) => <span className={styles.s20}>{Number(v) > 0 ? fmt(Number(v)) : '—'}</span> },
                  { key: 'balance', header: 'Balance', render: (v) => <span style={{ color: Number(v) > 0 ? '#ef4444' : '#16a34a' }} className={styles.s21}>{fmt(Number(v))}</span> },
                ] as ListColumn[]}
                data={(statement.lines as unknown as Record<string, unknown>[])}
                loading={false}
                emptyTitle="No transactions"
                emptyDescription="No transactions found for this period."
              />
            )}
          </Card>
        </>
      )}
      </div>
    </RouteGuard>
  );
}
