'use client';

import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Loader2, RefreshCw, Download, AlertCircle, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

const BUCKET_CONFIG = [
  { key: 'current' as const, label: 'Current', sublabel: 'Not yet due', color: 'var(--color-success)', bg: 'var(--color-success-light)', icon: <Clock size={18} /> },
  { key: '1-30' as const, label: '1–30 Days', sublabel: 'Slightly overdue', color: 'var(--color-warning)', bg: 'var(--color-warning-light)', icon: <AlertCircle size={18} /> },
  { key: '31-60' as const, label: '31–60 Days', sublabel: 'Overdue', color: 'var(--color-warning)', bg: 'var(--color-warning-light)', icon: <AlertCircle size={18} /> },
  { key: '61-90' as const, label: '61–90 Days', sublabel: 'Seriously overdue', color: 'var(--color-danger)', bg: 'var(--color-danger-light)', icon: <TrendingUp size={18} /> },
  { key: '90+' as const, label: '90+ Days', sublabel: 'Critical', color: 'var(--color-danger)', bg: 'var(--color-danger-light)', icon: <BarChart3 size={18} /> },
];

export default function ARAgingPage() {
  const client = useApiClient();
  const [report, setReport] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await client.get<AgingReport>('/advanced-finance/ar-aging'));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [client]);

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
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.receivable.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between ui-items-start">
        <div>
          <h1 className="text-3xl">AR Aging Report</h1>
          <p className="ui-text-muted mt-1">
            Outstanding receivables by aging bucket — Current, 1–30, 31–60, 61–90, 90+ days overdue.
          </p>
          {report && (
            <p className="ui-text-xs-muted mt-1">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="ui-flex ui-gap-2">
          <Button variant="outline" onClick={fetchReport}><RefreshCw size={16} className="mr-2" />Refresh</Button>
          <Button variant="outline" onClick={handleExportCsv}><Download size={16} className="mr-2" />Export CSV</Button>
        </div>
      </div>

      {!report ? (
        <Card className={`ui-card ${styles.s1}`}>
          <BarChart3 size={48} className={styles.s2} />
          <p className="ui-text-muted">No aging data available.</p>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className={`ui-grid-3 ${styles.s3}`}>
            <Card className="ui-card p-5">
              <div className="ui-flex-between">
                <div>
                  <p className="ui-text-sm-muted">Total Outstanding AR</p>
                  <p className={styles.s4}>{fmt(report.grandTotal)}</p>
                </div>
                <div className={styles.s5}>
                  <DollarSign size={22} className="ui-text-primary" />
                </div>
              </div>
            </Card>
            <Card className="ui-card p-5">
              <div className="ui-flex-between">
                <div>
                  <p className="ui-text-sm-muted">Overdue (1–90+ days)</p>
                  <p className={styles.s6}>
                    {fmt(report.buckets['1-30'].total + report.buckets['31-60'].total + report.buckets['61-90'].total + report.buckets['90+'].total)}
                  </p>
                </div>
                <div className={styles.s7}>
                  <AlertCircle size={22} className={styles.s8} />
                </div>
              </div>
            </Card>
            <Card className="ui-card p-5">
              <div className="ui-flex-between">
                <div>
                  <p className="ui-text-sm-muted">Critical (90+ Days)</p>
                  <p className={styles.s9}>{fmt(report.buckets['90+'].total)}</p>
                </div>
                <div className={styles.s10}>
                  <TrendingUp size={22} className={styles.s11} />
                </div>
              </div>
            </Card>
          </div>

          {/* Visual Aging Bar */}
          {report.grandTotal > 0 && (
            <Card className="ui-card p-5">
              <h3 className={styles.s12}>
                Portfolio Distribution
              </h3>
              <div className={styles.s13}>
                {BUCKET_CONFIG.map(({ key, color }) => {
                  const bucket = report.buckets[key];
                  const pct = report.grandTotal > 0 ? (bucket.total / report.grandTotal) * 100 : 0;
                  if (pct < 0.5) return null;
                  return (
                    <div
                      key={key}
                      className={styles.segment}
                      style={{ width: `${pct}%`, background: color }}
                      title={`${key}: ${fmt(bucket.total)} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
              <div className={styles.s14}>
                {BUCKET_CONFIG.map(({ key, label, color }) => {
                  const bucket = report.buckets[key];
                  const pct = report.grandTotal > 0 ? (bucket.total / report.grandTotal) * 100 : 0;
                  return (
                    <div key={key} className="ui-hstack-2">
                      <div className={styles.legendMarker} style={{ background: color }} />
                      <span className="ui-text-xs-muted">{label} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Bucket Breakdown */}
          <div className="ui-stack-4">
            {BUCKET_CONFIG.map(({ key, label, sublabel, color, bg, icon }) => {
              const bucket = report.buckets[key];
              const isExpanded = expandedBucket === key;
              const pct = report.grandTotal > 0 ? (bucket.total / report.grandTotal) * 100 : 0;
              return (
                <Card key={key} className={`ui-card ${styles.s15}`}>
                  <div
                    className={styles.bucketHeader}
                    style={{ background: isExpanded ? bg : undefined }}
                    onClick={() => setExpandedBucket(isExpanded ? null : key)}
                  >
                    <div className="ui-hstack-3">
                      <div className={styles.bucketIcon} style={{ background: bg, color }}>
                        {icon}
                      </div>
                      <div>
                        <p className="ui-heading-base">{label}</p>
                        <p className="ui-text-xs-muted">{sublabel}</p>
                      </div>
                    </div>
                    <div className={styles.s16}>
                      <div className="text-right">
                        <p className={styles.bucketTotal} style={{ color }}>{fmt(bucket.total)}</p>
                        <p className="ui-text-xs-muted">{bucket.count} invoice{bucket.count !== 1 ? 's' : ''} · {pct.toFixed(1)}% of total</p>
                      </div>
                      <div className="ui-text-sm-muted">
                        {isExpanded ? '▲' : '▼'}
                      </div>
                    </div>
                  </div>

                  {isExpanded && bucket.invoices.length > 0 && (
                    <div className={styles.bucketTable} style={{ borderTopColor: color }}>
                      <ListPageTemplate
                        columns={[
                          { key: 'invoiceNumber', header: 'Invoice #', render: (v) => <span className={styles.s17}>{String(v)}</span> },
                          { key: 'customer', header: 'Customer', render: (v) => String(v || '—') },
                          { key: 'dueDate', header: 'Due Date', render: (v) => new Date(String(v)).toLocaleDateString() },
                          { key: 'daysOverdue', header: 'Days Overdue', render: (v) => Number(v) > 0 ? <span className={styles.overdueDays} style={{ color }}>{String(v)}d</span> : <span className={styles.s18}>Current</span> },
                          { key: 'amount', header: 'Amount', render: (v) => <span className="font-semibold">{fmt(Number(v))}</span> },
                        ] as ListColumn[]}
                        data={(bucket.invoices as unknown as Record<string, unknown>[])}
                        loading={false}
                        emptyTitle="No invoices"
                        emptyDescription="No invoices in this bucket."
                      />
                    </div>
                  )}
                  {isExpanded && bucket.invoices.length === 0 && (
                    <div className={styles.s19}>
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
    </RouteGuard>
  );
}
