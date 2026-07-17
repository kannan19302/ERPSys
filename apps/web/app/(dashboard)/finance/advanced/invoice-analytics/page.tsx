'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, RefreshCw, Loader2, ArrowUpRight, TrendingUp,
  DollarSign, CheckCircle2, AlertCircle, Clock, Users, Calendar
} from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface MonthlyTrend {
  month: string;
  invoiced: number;
  paid: number;
  count: number;
}

interface CustomerBreakdown {
  name: string;
  invoiced: number;
  paid: number;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

interface Analytics {
  period: { months: number; since: string };
  monthlyTrend: MonthlyTrend[];
  topCustomers: CustomerBreakdown[];
  statusBreakdown: StatusBreakdown[];
  avgDaysToPay: number;
  totalInvoiced: number;
  totalCollected: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function InvoiceAnalyticsPage() {
  const client = useApiClient();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      setData(await client.get<Analytics>(`/advanced-finance/analytics/invoices?months=${months}`));
    } catch {
      alert('Unable to load invoice analytics.');
    } finally {
      setLoading(false);
    }
  }, [client, months]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  const collectedRatio = data && data.totalInvoiced > 0
    ? (data.totalCollected / data.totalInvoiced) * 100
    : 0;

  return (
    <RouteGuard permission="finance.invoice.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between ui-items-start">
        <div>
          <h1 className="text-3xl">Invoice & Collection Analytics</h1>
          <p className="ui-text-muted mt-1">
            Track sales invoice trends, average collection days, customer payment velocities, and payment statuses.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <select
            className={`ui-input ${styles.s1}`}
            value={months}
            onChange={e => setMonths(parseInt(e.target.value))}

          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
          </select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw size={16} className="mr-2" />Refresh
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* KPI Dashboard */}
          <StatCardRow stats={[
            { label: 'Total Invoiced', value: fmt(data.totalInvoiced), icon: <DollarSign size={20} />, color: 'var(--color-primary)' },
            { label: 'Total Collected', value: fmt(data.totalCollected), icon: <CheckCircle2 size={20} />, color: '#22c55e' },
            { label: 'Collection Rate', value: `${collectedRatio.toFixed(1)}%`, icon: <TrendingUp size={20} />, color: '#f59e0b' },
            { label: 'Avg Days to Pay', value: `${data.avgDaysToPay} days`, icon: <Clock size={20} />, color: '#3b82f6' },
          ]} />

          <div className={`ui-grid-2 ${styles.s2}`} >
            {/* Monthly Trend Table */}
            <Card className="ui-card ui-flex-col">
              <div className={styles.s3}>
                <Calendar size={18} className="ui-text-primary" />
                <h3 className="ui-heading-base">Monthly Revenue Trend</h3>
              </div>
              {(() => {
                const trendColumns: ListColumn[] = [
                  { key: 'month', header: 'Month', render: (v) => <span className="font-medium">{v as string}</span> },
                  { key: 'invoiced', header: 'Invoiced', render: (v) => <span className={styles.s4}>{fmt(v as number)}</span> },
                  { key: 'paid', header: 'Collected', render: (v) => <span className={styles.s5}>{fmt(v as number)}</span> },
                  { key: 'count', header: 'Invoices', render: (v) => <span className={styles.s6}>{v as number}</span> },
                  { key: 'invoiced', header: 'Rate', render: (v, row) => { const r = row as unknown as MonthlyTrend; const rate = r.invoiced > 0 ? (r.paid / r.invoiced) * 100 : 0; return <span style={{ color: rate > 80 ? '#22c55e' : rate > 50 ? '#f59e0b' : '#ef4444' }} className={styles.s7}>{rate.toFixed(0)}%</span>; } },
                ];
                return (
                  <ListPageTemplate
                    columns={trendColumns}
                    data={data.monthlyTrend as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No Trend Data"
                    emptyDescription="No monthly trend data available."
                    searchable
                  />
                );
              })()}
            </Card>

            {/* Top Customer Breakdown */}
            <Card className="ui-card ui-flex-col">
              <div className={styles.s3}>
                <Users size={18} className="ui-text-primary" />
                <h3 className="ui-heading-base">Top Customers by Revenue</h3>
              </div>
              {(() => {
                const custColumns: ListColumn[] = [
                  { key: 'name', header: 'Customer', render: (v) => <span className="font-medium">{v as string}</span> },
                  { key: 'invoiced', header: 'Total Invoiced', render: (v) => <span className={styles.s4}>{fmt(v as number)}</span> },
                  { key: 'paid', header: 'Paid', render: (v) => <span className={styles.s5}>{fmt(v as number)}</span> },
                  { key: 'count', header: 'Invoices', render: (v) => <span className={styles.s6}>{v as number}</span> },
                ];
                return (
                  <ListPageTemplate
                    columns={custColumns}
                    data={data.topCustomers as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No Customer Data"
                    emptyDescription="No customer revenue data available."
                    searchable
                  />
                );
              })()}
            </Card>
          </div>

          {/* Status Breakdown & Collections Performance */}
          <Card className="ui-card">
            <div className={styles.s3}>
              <AlertCircle size={18} className="ui-text-primary" />
              <h3 className="ui-heading-base">Collection Performance by Status</h3>
            </div>
            <div className={styles.s8}>
              {data.statusBreakdown.map(stat => {
                const isPaid = stat.status === 'PAID';
                const isOverdue = stat.status === 'OVERDUE';
                const color = isPaid ? '#22c55e' : isOverdue ? '#ef4444' : '#f59e0b';
                const bg = isPaid ? 'rgba(34,197,94,0.08)' : isOverdue ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)';

                return (
                  <div key={stat.status} style={{ border: `1px solid var(--color-border)`, background: bg }} className={styles.s9}>
                    <p style={{ color: color }} className={styles.s10}>{stat.status}</p>
                    <p style={{ color: color }} className={styles.s11}>{fmt(stat.amount)}</p>
                    <p className="ui-text-xs-muted mt-1">{stat.count} invoice(s)</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
      </div>
    </RouteGuard>
  );
}
