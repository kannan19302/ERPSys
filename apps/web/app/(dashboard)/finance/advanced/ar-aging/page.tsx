/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Loader2, RefreshCw, Download, AlertCircle, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface AgingEntry {
  id: string;
  invoiceNumber: string;
  customer: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
}

interface AgingBucket {
  total: number;
  count: number;
  invoices: AgingEntry[];
}

interface AgingReport {
  buckets: {
    current: AgingBucket;
    '1-30': AgingBucket;
    '31-60': AgingBucket;
    '61-90': AgingBucket;
    '90+': AgingBucket;
  };
  grandTotal: number;
  generatedAt: string;
}

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

const BUCKET_CONFIG = [
  { key: 'current' as const, label: 'Current', sublabel: 'Not yet due', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: <Clock size={18} /> },
  { key: '1-30' as const, label: '1–30 Days', sublabel: 'Slightly overdue', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: <AlertCircle size={18} /> },
  { key: '31-60' as const, label: '31–60 Days', sublabel: 'Overdue', color: '#f97316', bg: 'rgba(249,115,22,0.08)', icon: <AlertCircle size={18} /> },
  { key: '61-90' as const, label: '61–90 Days', sublabel: 'Seriously overdue', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: <TrendingUp size={18} /> },
  { key: '90+' as const, label: '90+ Days', sublabel: 'Critical', color: '#7f1d1d', bg: 'rgba(127,29,29,0.08)', icon: <BarChart3 size={18} /> },
];

export default function ARAgingPage() {
  const [report, setReport] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ar-aging`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setReport(await res.json() as AgingReport);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleExportCsv = () => {
    if (!report) return;
    const rows: string[] = ['Bucket,Invoice #,Customer,Due Date,Amount,Days Overdue'];
    BUCKET_CONFIG.forEach(({ key, label }) => {
      const bucket = report.buckets[key];
      bucket.invoices.forEach((inv) => {
        rows.push(`"${label}","${inv.invoiceNumber}","${inv.customer}","${new Date(inv.dueDate).toLocaleDateString()}",${inv.amount},${inv.daysOverdue}`);
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ar-aging-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
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
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>AR Aging Report</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Outstanding receivables by aging bucket — Current, 1–30, 31–60, 61–90, 90+ days overdue.
          </p>
          {report && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={fetchReport}><RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />Refresh</Button>
          <Button variant="outline" onClick={handleExportCsv}><Download size={16} style={{ marginRight: 'var(--space-2)' }} />Export CSV</Button>
        </div>
      </div>

      {!report ? (
        <Card className="frappe-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <BarChart3 size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>No aging data available.</p>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="frappe-grid-3" style={{ gap: 'var(--space-4)' }}>
            <Card className="frappe-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Total Outstanding AR</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)', marginTop: 'var(--space-1)' }}>{fmt(report.grandTotal)}</p>
                </div>
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: 'rgba(79,70,229,0.1)' }}>
                  <DollarSign size={22} style={{ color: 'var(--color-primary)' }} />
                </div>
              </div>
            </Card>
            <Card className="frappe-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Overdue (1–90+ days)</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: '#ef4444', marginTop: 'var(--space-1)' }}>
                    {fmt(report.buckets['1-30'].total + report.buckets['31-60'].total + report.buckets['61-90'].total + report.buckets['90+'].total)}
                  </p>
                </div>
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: 'rgba(239,68,68,0.1)' }}>
                  <AlertCircle size={22} style={{ color: '#ef4444' }} />
                </div>
              </div>
            </Card>
            <Card className="frappe-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Critical (90+ Days)</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: '#7f1d1d', marginTop: 'var(--space-1)' }}>{fmt(report.buckets['90+'].total)}</p>
                </div>
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: 'rgba(127,29,29,0.1)' }}>
                  <TrendingUp size={22} style={{ color: '#7f1d1d' }} />
                </div>
              </div>
            </Card>
          </div>

          {/* Visual Aging Bar */}
          {report.grandTotal > 0 && (
            <Card className="frappe-card" style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Portfolio Distribution
              </h3>
              <div style={{ display: 'flex', height: '32px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', gap: '2px' }}>
                {BUCKET_CONFIG.map(({ key, color }) => {
                  const bucket = report.buckets[key];
                  const pct = report.grandTotal > 0 ? (bucket.total / report.grandTotal) * 100 : 0;
                  if (pct < 0.5) return null;
                  return (
                    <div
                      key={key}
                      style={{ width: `${pct}%`, background: color, transition: 'width 0.5s ease', cursor: 'pointer' }}
                      title={`${key}: ${fmt(bucket.total)} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                {BUCKET_CONFIG.map(({ key, label, color }) => {
                  const bucket = report.buckets[key];
                  const pct = report.grandTotal > 0 ? (bucket.total / report.grandTotal) * 100 : 0;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{label} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Bucket Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {BUCKET_CONFIG.map(({ key, label, sublabel, color, bg, icon }) => {
              const bucket = report.buckets[key];
              const isExpanded = expandedBucket === key;
              const pct = report.grandTotal > 0 ? (bucket.total / report.grandTotal) * 100 : 0;
              return (
                <Card key={key} className="frappe-card" style={{ overflow: 'hidden' }}>
                  <div
                    style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? bg : undefined }}
                    onClick={() => setExpandedBucket(isExpanded ? null : key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', background: bg, color }}>
                        {icon}
                      </div>
                      <div>
                        <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>{label}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{sublabel}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color }}>{fmt(bucket.total)}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{bucket.count} invoice{bucket.count !== 1 ? 's' : ''} · {pct.toFixed(1)}% of total</p>
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        {isExpanded ? '▲' : '▼'}
                      </div>
                    </div>
                  </div>

                  {isExpanded && bucket.invoices.length > 0 && (
                    <div style={{ borderTop: `2px solid ${color}20` }}>
                      <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                            <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Invoice #</th>
                            <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Customer</th>
                            <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Due Date</th>
                            <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Days Overdue</th>
                            <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bucket.invoices.map((inv) => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: 'var(--space-3)', fontFamily: 'monospace', fontWeight: 'var(--weight-medium)' }}>{inv.invoiceNumber}</td>
                              <td style={{ padding: 'var(--space-3)' }}>{inv.customer || '—'}</td>
                              <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                              <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                                {inv.daysOverdue > 0 ? (
                                  <span style={{ color, fontWeight: 'var(--weight-semibold)' }}>{inv.daysOverdue}d</span>
                                ) : (
                                  <span style={{ color: '#22c55e' }}>Current</span>
                                )}
                              </td>
                              <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>{fmt(inv.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {isExpanded && bucket.invoices.length === 0 && (
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)' }}>
                      No invoices in this bucket.
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
