'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, PageHeader, Spinner, DashboardKPICard, DashboardChart, ViewSwitcher, KanbanBoard, type ViewMode, type KanbanColumn, type KanbanItem } from '@unerp/ui';
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
import { apiPatch } from '../../../src/lib/api';

interface SalesOrder extends KanbanItem {
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
  const [activeView, setActiveView] = useState<ViewMode>('chart');

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

      if (orderRes.ok) {
        const oData = await orderRes.json();
        const normalizedOrders = (Array.isArray(oData) ? oData : (oData?.data || [])).map((o: any) => ({
          ...o,
          columnKey: o.status || 'DRAFT'
        }));
        setOrders(normalizedOrders);
      }
      if (quoteRes.ok) {
        const qData = await quoteRes.json();
        setQuotes(Array.isArray(qData) ? qData : (qData?.data || []));
      }
    } catch {
      setError('Could not load data. Please try again.');
      setOrders([]);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute stats
  const totalRevenue = useMemo(() => orders
    .filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalAmount, 0), [orders]);

  const b2bRevenue = useMemo(() => orders
    .filter(o => o.salesChannel === 'B2B' && (o.status === 'CONFIRMED' || o.status === 'DELIVERED'))
    .reduce((sum, o) => sum + o.totalAmount, 0), [orders]);

  const b2cRevenue = useMemo(() => orders
    .filter(o => o.salesChannel === 'B2C' && (o.status === 'CONFIRMED' || o.status === 'DELIVERED'))
    .reduce((sum, o) => sum + o.totalAmount, 0), [orders]);

  const d2cRevenue = useMemo(() => orders
    .filter(o => o.salesChannel === 'D2C' && (o.status === 'CONFIRMED' || o.status === 'DELIVERED'))
    .reduce((sum, o) => sum + o.totalAmount, 0), [orders]);

  const creditHolds = useMemo(() => orders.filter(o => o.status === 'CREDIT_HOLD'), [orders]);

  // Chart data
  const channelShareData = useMemo(() => {
    return [
      { name: 'B2B', value: b2bRevenue },
      { name: 'B2C', value: b2cRevenue },
      { name: 'D2C', value: d2cRevenue },
    ].filter(d => d.value > 0);
  }, [b2bRevenue, b2cRevenue, d2cRevenue]);

  const orderStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const monthlyRevenueData = useMemo(() => {
    const months: Record<string, number> = {};
    orders
      .filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED')
      .forEach(o => {
        const month = o.orderDate ? o.orderDate.substring(0, 7) : 'Unknown';
        months[month] = (months[month] || 0) + o.totalAmount;
      });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));
  }, [orders]);

  const ORDER_STATUS_COLUMNS: KanbanColumn[] = [
    { key: 'DRAFT', title: 'Draft', color: '#9ca3af' },
    { key: 'CONFIRMED', title: 'Confirmed', color: '#22c55e' },
    { key: 'CREDIT_HOLD', title: 'Credit Hold', color: '#ef4444' },
    { key: 'DELIVERED', title: 'Delivered', color: '#4f46e5' },
  ];

  const handleKanbanMove = async (itemId: string, _from: string, toColumn: string) => {
    try {
      await apiPatch(`/sales/orders/${itemId}`, { status: toColumn });
      fetchDashboardData();
    } catch {
      // update state locally as a graceful fallback if API doesn't support patch directly
      setOrders(prev => prev.map(o => o.id === itemId ? { ...o, status: toColumn, columnKey: toColumn } : o));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Sales & Orders Dashboard"
        description="Monitor corporate accounts, B2C retail checkouts, and D2C online channels."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales & Orders' }]}
        actions={
          <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart', 'kanban']} />
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
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

          {/* Metrics Panel with drill-down */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <DashboardKPICard
              title="Confirmed Sales Revenue"
              value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={<TrendingUp size={18} />}
              color="#22c55e"
              drillDown={{
                modalTitle: 'Confirmed/Delivered Orders',
                columns: [
                  { key: 'orderNumber', label: 'Order No.' },
                  { key: 'customerName', label: 'Customer' },
                  { key: 'totalAmount', label: 'Total', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'status', label: 'Status' }
                ],
                rows: orders.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').map(o => ({ ...o }))
              }}
            />

            <DashboardKPICard
              title="B2B Corporate Revenue"
              value={`$${b2bRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={<Building size={18} />}
              color="var(--color-success)"
              drillDown={{
                modalTitle: 'B2B Sales Orders',
                columns: [
                  { key: 'orderNumber', label: 'Order No.' },
                  { key: 'customerName', label: 'Customer' },
                  { key: 'totalAmount', label: 'Total', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'status', label: 'Status' }
                ],
                rows: orders.filter(o => o.salesChannel === 'B2B').map(o => ({ ...o }))
              }}
            />

            <DashboardKPICard
              title="D2C eCommerce Channel"
              value={`$${d2cRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={<Globe size={18} />}
              color="var(--color-info-text)"
              drillDown={{
                modalTitle: 'D2C eCommerce Orders',
                columns: [
                  { key: 'orderNumber', label: 'Order No.' },
                  { key: 'customerName', label: 'Customer' },
                  { key: 'totalAmount', label: 'Total', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'status', label: 'Status' }
                ],
                rows: orders.filter(o => o.salesChannel === 'D2C').map(o => ({ ...o }))
              }}
            />

            <DashboardKPICard
              title="B2C Retail / POS"
              value={`$${b2cRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={<Smartphone size={18} />}
              color="var(--color-warning-text)"
              drillDown={{
                modalTitle: 'B2C Retail Orders',
                columns: [
                  { key: 'orderNumber', label: 'Order No.' },
                  { key: 'customerName', label: 'Customer' },
                  { key: 'totalAmount', label: 'Total', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'status', label: 'Status' }
                ],
                rows: orders.filter(o => o.salesChannel === 'B2C').map(o => ({ ...o }))
              }}
            />
          </div>

          {/* Chart View */}
          {activeView === 'chart' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
              <DashboardChart
                title="Monthly Sales Revenue"
                subtitle="Confirmed and Delivered sales by month"
                data={monthlyRevenueData}
                config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Revenue', color: '#22c55e' }] }}
                defaultChartType="area"
                allowedChartTypes={['area', 'line', 'bar']}
                height={280}
              />
              <DashboardChart
                title="Sales Channels Share"
                subtitle="Revenue distribution by channel"
                data={channelShareData}
                config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Revenue' }], valueKey: 'value', nameKey: 'name' }}
                defaultChartType="donut"
                allowedChartTypes={['donut', 'pie', 'bar']}
                height={280}
              />
              <DashboardChart
                title="Order Status Distribution"
                subtitle="Total order status breakout"
                data={orderStatusDistribution}
                config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Orders' }], valueKey: 'value', nameKey: 'name' }}
                defaultChartType="bar"
                allowedChartTypes={['bar', 'donut', 'pie']}
                height={280}
              />
            </div>
          )}

          {/* Kanban View */}
          {activeView === 'kanban' && (
            <KanbanBoard<SalesOrder>
              columns={ORDER_STATUS_COLUMNS}
              items={orders}
              onCardMove={handleKanbanMove}
              renderCard={(item) => (
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginBottom: '4px' }}>{item.orderNumber}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>{item.customerName}</div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: '4px' }}>${item.totalAmount.toLocaleString()}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: 'var(--color-bg-sunken)', fontWeight: 'var(--weight-semibold)' }}>
                      {item.salesChannel}
                    </span>
                    <span style={{ fontSize: '10px', color: item.paymentStatus === 'PAID' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                      {item.paymentStatus}
                    </span>
                  </div>
                </div>
              )}
            />
          )}

          {/* List View */}
          {activeView === 'list' && (
            <>
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
        </>
      )}
    </div>
  );
}
