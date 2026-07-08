/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, RefreshCw, Loader2, ArrowUpRight, TrendingUp,
  DollarSign, CheckCircle2, AlertCircle, Clock, Users, Calendar
} from 'lucide-react';
import { Card, Button } from '@unerp/ui';

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

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function InvoiceAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/analytics/invoices?months=${months}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setData(await res.json() as Analytics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  const collectedRatio = data && data.totalInvoiced > 0 
    ? (data.totalCollected / data.totalInvoiced) * 100 
    : 0;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Invoice & Collection Analytics</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Track sales invoice trends, average collection days, customer payment velocities, and payment statuses.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <select
            className="frappe-input"
            value={months}
            onChange={e => setMonths(parseInt(e.target.value))}
            style={{ width: '150px', height: '38px', margin: 0 }}
          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
          </select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />Refresh
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* KPI Dashboard */}
          <div className="frappe-grid-4" style={{ gap: 'var(--space-4)' }}>
            {[
              { label: 'Total Invoiced', value: fmt(data.totalInvoiced), icon: <DollarSign size={20} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
              { label: 'Total Collected', value: fmt(data.totalCollected), icon: <CheckCircle2 size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
              { label: 'Collection Rate', value: `${collectedRatio.toFixed(1)}%`, icon: <TrendingUp size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
              { label: 'Avg Days to Pay', value: `${data.avgDaysToPay} days`, icon: <Clock size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
            ].map(kpi => (
              <Card key={kpi.label} className="frappe-card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{kpi.label}</p>
                    <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: kpi.color, marginTop: 'var(--space-1)' }}>{kpi.value}</p>
                  </div>
                  <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: kpi.bg, color: kpi.color }}>{kpi.icon}</div>
                </div>
              </Card>
            ))}
          </div>

          <div className="frappe-grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            {/* Monthly Trend Table */}
            <Card className="frappe-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Monthly Revenue Trend</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Month</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Invoiced</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Collected</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Invoices</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthlyTrend.map(row => {
                      const rate = row.invoiced > 0 ? (row.paid / row.invoiced) * 100 : 0;
                      return (
                        <tr key={row.month} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{row.month}</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{fmt(row.invoiced)}</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: '#22c55e' }}>{fmt(row.paid)}</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{row.count}</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: rate > 80 ? '#22c55e' : rate > 50 ? '#f59e0b' : '#ef4444' }}>
                            {rate.toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Top Customer Breakdown */}
            <Card className="frappe-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Users size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Top Customers by Revenue</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Customer</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Total Invoiced</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Paid</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Invoices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCustomers.map(cust => (
                      <tr key={cust.name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{cust.name}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>{fmt(cust.invoiced)}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: '#22c55e' }}>{fmt(cust.paid)}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{cust.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Status Breakdown & Collections Performance */}
          <Card className="frappe-card">
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Collection Performance by Status</h3>
            </div>
            <div style={{ padding: 'var(--space-5)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              {data.statusBreakdown.map(stat => {
                const isPaid = stat.status === 'PAID';
                const isOverdue = stat.status === 'OVERDUE';
                const color = isPaid ? '#22c55e' : isOverdue ? '#ef4444' : '#f59e0b';
                const bg = isPaid ? 'rgba(34,197,94,0.08)' : isOverdue ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)';

                return (
                  <div key={stat.status} style={{
                    padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: `1px solid var(--color-border)`,
                    minWidth: '200px', flex: '1', background: bg,
                  }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color }}>{stat.status}</p>
                    <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color, marginTop: 'var(--space-2)' }}>{fmt(stat.amount)}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>{stat.count} invoice(s)</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
