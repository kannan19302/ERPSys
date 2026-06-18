'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, PageHeader, Spinner } from '@unerp/ui';
import {
  ClipboardList,
  FileText,
  Truck,
  TrendingUp,
  AlertCircle,
  Building,
  Smartphone,
  Globe,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface SalesOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  salesChannel: string;
  paymentStatus: string;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  totalAmount: number;
}

export default function SalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [quotes, setQuotes] = useState<Quotation[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const [orderRes, quoteRes] = await Promise.all([
        fetch('/api/v1/sales/orders', { headers }),
        fetch('/api/v1/sales/quotations', { headers }),
      ]);

      if (orderRes.ok) setOrders(await orderRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (quoteRes.ok) setQuotes(await quoteRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {
      setError('Serving local mock fallback registry.');
      // Local fallback data
      setOrders([
        { id: 'so-1', orderNumber: 'SO-2026-001', status: 'CONFIRMED', orderDate: new Date().toISOString(), customerName: 'Acme Corp', totalAmount: 25000, currency: 'USD', salesChannel: 'B2B', paymentStatus: 'UNPAID' },
        { id: 'so-2', orderNumber: 'SO-2026-002', status: 'CREDIT_HOLD', orderDate: new Date().toISOString(), customerName: 'Wayne Enterprises', totalAmount: 85000, currency: 'USD', salesChannel: 'B2B', paymentStatus: 'UNPAID' },
        { id: 'so-3', orderNumber: 'SO-2026-003', status: 'DELIVERED', orderDate: new Date().toISOString(), customerName: 'John Doe (Direct)', totalAmount: 1200, currency: 'USD', salesChannel: 'D2C', paymentStatus: 'PAID' },
        { id: 'so-4', orderNumber: 'SO-2026-004', status: 'CONFIRMED', orderDate: new Date().toISOString(), customerName: 'Retail Customer #12', totalAmount: 450, currency: 'USD', salesChannel: 'B2C', paymentStatus: 'PAID' }
      ]);
      setQuotes([
        { id: 'qt-1', quotationNumber: 'QT-2026-001', status: 'SENT', totalAmount: 95000 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute stats
  const totalRevenue = orders
    .filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const b2bRevenue = orders
    .filter(o => o.salesChannel === 'B2B' && (o.status === 'CONFIRMED' || o.status === 'DELIVERED'))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const b2cRevenue = orders
    .filter(o => o.salesChannel === 'B2C' && (o.status === 'CONFIRMED' || o.status === 'DELIVERED'))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const d2cRevenue = orders
    .filter(o => o.salesChannel === 'D2C' && (o.status === 'CONFIRMED' || o.status === 'DELIVERED'))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const creditHolds = orders.filter(o => o.status === 'CREDIT_HOLD');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Sales & Orders Dashboard"
        description="Monitor corporate accounts, B2C retail checkouts, and D2C online channels."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales & Orders' }]}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback dashboard)</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Credit Hold Warning Banner */}
          {creditHolds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-lg)', color: 'var(--color-error-text)' }}>
              <ShieldAlert size={20} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Attention Needed: Credit Hold Orders Detected</span>
                <span style={{ fontSize: 'var(--text-xs)', opacity: 0.85 }}>{creditHolds.length} B2B order(s) are blocked because customers have exceeded their credit limits.</span>
              </div>
              <Link href="/sales/orders?status=CREDIT_HOLD" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error-text)', textDecoration: 'underline', fontWeight: 'var(--weight-semibold)', whiteSpace: 'nowrap' }}>
                Release Holds
              </Link>
            </div>
          )}

          {/* Metrics Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Confirmed Sales Revenue</span>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px' }}>
                  <TrendingUp size={14} />
                </div>
              </div>
              <h4 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0 0', fontWeight: 'var(--weight-bold)' }}>
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>B2B Corporate Revenue</span>
                <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '4px', borderRadius: '4px' }}>
                  <Building size={14} />
                </div>
              </div>
              <h4 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0 0', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)' }}>
                ${b2bRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>D2C eCommerce Channel</span>
                <div style={{ background: 'var(--color-info-light)', color: 'var(--color-info-text)', padding: '4px', borderRadius: '4px' }}>
                  <Globe size={14} />
                </div>
              </div>
              <h4 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0 0', fontWeight: 'var(--weight-bold)' }}>
                ${d2cRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>B2C Retail / POS</span>
                <div style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning-text)', padding: '4px', borderRadius: '4px' }}>
                  <Smartphone size={14} />
                </div>
              </div>
              <h4 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0 0', fontWeight: 'var(--weight-bold)' }}>
                ${b2cRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </Card>
          </div>

          {/* Quick Access Sourcing Workflows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Sales Orders Hub</h4>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Manage B2B, B2C, and D2C orders</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{orders.filter(o => o.status === 'DRAFT').length} orders in draft</span>
                  <Link href="/sales/orders" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 'var(--weight-semibold)' }}>
                    Open Orders <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Customer Quotations</h4>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Create & convert client quotations</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{quotes.filter(q => q.status === 'SENT').length} quotations active</span>
                  <Link href="/sales/quotations" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 'var(--weight-semibold)' }}>
                    Open Quotations <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ background: 'var(--color-info-light)', color: 'var(--color-info-text)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                    <Truck size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Fulfillment & Delivery</h4>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Track shipments and inventory dispatch</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Manage goods delivery notes</span>
                  <Link href="/sales/delivery-notes" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 'var(--weight-semibold)' }}>
                    Open Delivery Notes <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Channels Overview Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
            <Card padding="none">
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Recent Sales Actions</h4>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>Order No</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>Customer</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>Channel</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>Amount</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>Payment</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{order.orderNumber}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{order.customerName}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: '4px', background: 'var(--color-bg-sunken)', fontWeight: 'var(--weight-semibold)' }}>
                            {order.salesChannel}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>${order.totalAmount.toLocaleString()}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ color: order.paymentStatus === 'PAID' ? 'var(--color-success)' : 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                            background: order.status === 'CONFIRMED' ? 'var(--color-success-light)' : order.status === 'CREDIT_HOLD' ? 'var(--color-error-light)' : 'var(--color-bg-sunken)',
                            color: order.status === 'CONFIRMED' ? 'var(--color-success)' : order.status === 'CREDIT_HOLD' ? 'var(--color-error-text)' : 'var(--color-text)'
                          }}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Sales Channels Share</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    <span>B2B (Corporate Accounts)</span>
                    <span style={{ fontWeight: 'var(--weight-semibold)' }}>
                      {totalRevenue > 0 ? Math.round((b2bRevenue / totalRevenue) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--color-bg-sunken)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--color-success)', width: `${totalRevenue > 0 ? (b2bRevenue / totalRevenue) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    <span>D2C (Online Store)</span>
                    <span style={{ fontWeight: 'var(--weight-semibold)' }}>
                      {totalRevenue > 0 ? Math.round((d2cRevenue / totalRevenue) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--color-bg-sunken)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--color-primary)', width: `${totalRevenue > 0 ? (d2cRevenue / totalRevenue) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    <span>B2C (Retail & POS)</span>
                    <span style={{ fontWeight: 'var(--weight-semibold)' }}>
                      {totalRevenue > 0 ? Math.round((b2cRevenue / totalRevenue) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--color-bg-sunken)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--color-warning)', width: `${totalRevenue > 0 ? (b2cRevenue / totalRevenue) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
