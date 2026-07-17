'use client';

import styles from './page.module.css';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, PageHeader, Spinner, DashboardChart, ViewSwitcher, KanbanBoard, StatCardRow, ListPageTemplate, type ListColumn, type ViewMode, type KanbanColumn, type KanbanItem } from '@unerp/ui';
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
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>('chart');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, quoteRes] = await Promise.all([
        client.get<SalesOrder[]>('/sales/orders'),
        client.get<Quotation[]>('/sales/quotations'),
      ]);

      if (Array.isArray(orderRes)) {
        const normalizedOrders = orderRes.map(o => ({
          ...o,
          columnKey: o.status || 'DRAFT'
        }));
        setOrders(normalizedOrders);
      }
      setQuotes(Array.isArray(quoteRes) ? quoteRes : []);
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
  }, [client]);

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
    { key: 'DRAFT', title: 'Draft', color: 'var(--color-text-tertiary)' },
    { key: 'CONFIRMED', title: 'Confirmed', color: 'var(--color-success)' },
    { key: 'CREDIT_HOLD', title: 'Credit Hold', color: 'var(--color-error)' },
    { key: 'DELIVERED', title: 'Delivered', color: 'var(--color-primary)' },
  ];

  const handleKanbanMove = async (itemId: string, _from: string, toColumn: string) => {
    try {
      await client.patch(`/sales/orders/${itemId}`, { status: toColumn });
      fetchDashboardData();
    } catch {
      // update state locally as a graceful fallback if API doesn't support patch directly
      setOrders(prev => prev.map(o => o.id === itemId ? { ...o, status: toColumn, columnKey: toColumn } : o));
    }
  };

  return (
    <RouteGuard permission="sales.dashboard.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Sales & Orders Dashboard"
        description="Monitor corporate accounts, B2C retail checkouts, and D2C online channels."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales & Orders' }]}
        actions={
          <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart', 'kanban']} />
        }
      />

      {error && (
        <div className={styles.p1}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Credit Hold Warning Banner */}
          {creditHolds.length > 0 && (
            <div className={styles.p2}>
              <ShieldAlert size={20} className={styles.p3} />
              <div className={styles.p4}>
                <span className="ui-heading-sm">Attention Needed: Credit Hold Orders Detected</span>
                <span className={styles.p5}>{creditHolds.length} B2B order(s) are blocked because customers have exceeded their credit limits.</span>
              </div>
              <Link href="/sales/orders?status=CREDIT_HOLD" className={styles.p6}>
                Release Holds
              </Link>
            </div>
          )}

          <StatCardRow stats={[
            { label: 'Confirmed Sales Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <TrendingUp size={16} />, color: 'var(--chart-2)' },
            { label: 'B2B Corporate Revenue', value: `$${b2bRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <Building size={16} />, color: 'var(--chart-1)' },
            { label: 'D2C eCommerce Channel', value: `$${d2cRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <Globe size={16} />, color: 'var(--chart-3)' },
            { label: 'B2C Retail / POS', value: `$${b2cRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <Smartphone size={16} />, color: 'var(--chart-5)' },
          ]} />

          {/* Chart View */}
          {activeView === 'chart' && (
            <div className={styles.p7}>
              <DashboardChart
                title="Monthly Sales Revenue"
                subtitle="Confirmed and Delivered sales by month"
                data={monthlyRevenueData}
                config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Revenue', color: 'var(--chart-2)' }] }}
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
                  <div className={styles.p8}>{item.orderNumber}</div>
                  <div className={styles.p9}>{item.customerName}</div>
                  <div className={styles.p10}>${item.totalAmount.toLocaleString()}</div>
                  <div className="ui-flex-between">
                    <span className={styles.p11}>
                      {item.salesChannel}
                    </span>
                    <span style={{ color: item.paymentStatus === 'PAID' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
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
              <div className={styles.p13}>
                <Card>
                  <div className="ui-stack-3">
                    <div className="ui-hstack-3">
                      <div className={styles.p14}>
                        <ClipboardList size={20} />
                      </div>
                      <div>
                        <h4 className={styles.p15}>Sales Orders Hub</h4>
                        <span className="ui-text-xs-muted">Manage B2B, B2C, and D2C orders</span>
                      </div>
                    </div>
                    <div className={styles.p16}>
                      <span className="ui-text-xs-muted">{orders.filter(o => o.status === 'DRAFT').length} orders in draft</span>
                      <Link href="/sales/orders" className={styles.p17}>
                        Open Orders <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="ui-stack-3">
                    <div className="ui-hstack-3">
                      <div className={styles.p18}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className={styles.p19}>Customer Quotations</h4>
                        <span className="ui-text-xs-muted">Create & convert client quotations</span>
                      </div>
                    </div>
                    <div className={styles.p20}>
                      <span className="ui-text-xs-muted">{quotes.filter(q => q.status === 'SENT').length} quotations active</span>
                      <Link href="/sales/quotations" className={styles.p21}>
                        Open Quotations <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="ui-stack-3">
                    <div className="ui-hstack-3">
                      <div className={styles.p22}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 className={styles.p23}>Fulfillment & Delivery</h4>
                        <span className="ui-text-xs-muted">Track shipments and inventory dispatch</span>
                      </div>
                    </div>
                    <div className={styles.p24}>
                      <span className="ui-text-xs-muted">Manage goods delivery notes</span>
                      <Link href="/sales/delivery-notes" className={styles.p25}>
                        Open Delivery Notes <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Channels Overview Table */}
              {(() => {
                const orderColumns: ListColumn[] = [
                  { key: 'orderNumber', header: 'Order No' },
                  { key: 'customerName', header: 'Customer' },
                  { key: 'salesChannel', header: 'Channel' },
                  { key: 'totalAmount', header: 'Amount', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'paymentStatus', header: 'Payment', render: (v) => <span style={{ color: v === 'PAID' ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>{String(v)}</span> },
                  { key: 'status', header: 'Status', render: (v) => <span style={{ background: v === 'CONFIRMED' ? 'var(--color-success-light)' : v === 'CREDIT_HOLD' ? 'var(--color-error-light)' : 'var(--color-bg-sunken)', color: v === 'CONFIRMED' ? 'var(--color-success)' : v === 'CREDIT_HOLD' ? 'var(--color-error-text)' : 'var(--color-text)' }}>{String(v)}</span> },
                ];
                return (
              <div className={styles.p28}>
                <ListPageTemplate title="Recent Sales Actions" columns={orderColumns} data={orders.slice(0, 5) as unknown as Record<string, unknown>[]} loading={loading} />

                <Card>
                  <h4 className={styles.p29}>Sales Channels Share</h4>
                  <div className="ui-stack-3">
                    <div>
                      <div className={styles.p30}>
                        <span>B2B (Corporate Accounts)</span>
                        <span className="font-semibold">
                          {totalRevenue > 0 ? Math.round((b2bRevenue / totalRevenue) * 100) : 0}%
                        </span>
                      </div>
                      <div className={styles.p31}>
                        <div style={{ width: `${totalRevenue > 0 ? (b2bRevenue / totalRevenue) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className={styles.p33}>
                        <span>D2C (Online Store)</span>
                        <span className="font-semibold">
                          {totalRevenue > 0 ? Math.round((d2cRevenue / totalRevenue) * 100) : 0}%
                        </span>
                      </div>
                      <div className={styles.p34}>
                        <div style={{ width: `${totalRevenue > 0 ? (d2cRevenue / totalRevenue) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className={styles.p36}>
                        <span>B2C (Retail & POS)</span>
                        <span className="font-semibold">
                          {totalRevenue > 0 ? Math.round((b2cRevenue / totalRevenue) * 100) : 0}%
                        </span>
                      </div>
                      <div className={styles.p37}>
                        <div style={{ width: `${totalRevenue > 0 ? (b2cRevenue / totalRevenue) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
                );
              })()}
            </>
          )}
        </>
      )}
      </div>
    </RouteGuard>
  );
}
