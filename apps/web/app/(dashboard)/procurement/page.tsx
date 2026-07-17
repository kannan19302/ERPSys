'use client';

import styles from './page.module.css';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, PageHeader, Spinner, DashboardChart, ViewSwitcher, KanbanBoard, StatCardRow, type ViewMode, type KanbanColumn, type KanbanItem } from '@unerp/ui';
import {
  ShoppingCart,
  Truck,
  Building,
  FileText,
  BadgeCent,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface PurchaseOrder extends KanbanItem {
  poNumber: string;
  status: string;
  orderDate: string;
  vendorName: string;
  totalAmount: number;
  currency: string;
}

interface RFQ {
  id: string;
  rfqNumber: string;
  status: string;
  quotesCount: number;
}

export default function ProcurementDashboard() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>('chart');

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [poRes, rfqRes, vendorRes] = await Promise.all([
        client.get<PurchaseOrder[]>('/procurement/purchase-orders'),
        client.get<RFQ[]>('/procurement/rfqs'),
        client.get<unknown[]>('/crm/vendors')
      ]);

      if (Array.isArray(poRes)) {
        const normalizedPos = poRes.map(p => ({
          ...p,
          columnKey: p.status || 'DRAFT'
        }));
        setPos(normalizedPos);
      }
      setRfqs(Array.isArray(rfqRes) ? rfqRes : []);
      setVendors(Array.isArray(vendorRes) ? vendorRes : []);
    } catch {
      setError('Could not load data. Please try again.');
      setPos([]);
      setRfqs([]);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [client]);

  const totalPOSpend = useMemo(() => pos.reduce((acc, p) => acc + p.totalAmount, 0), [pos]);
  const approvedSpend = useMemo(() => pos.filter(p => p.status === 'APPROVED' || p.status === 'RECEIVED').reduce((acc, p) => acc + p.totalAmount, 0), [pos]);
  const pendingOrdersCount = useMemo(() => pos.filter(p => p.status === 'DRAFT' || p.status === 'SUBMITTED').length, [pos]);
  const rfqBids = useMemo(() => rfqs.reduce((acc, r) => acc + r.quotesCount, 0), [rfqs]);

  // Compute chart data
  const monthlySpendData = useMemo(() => {
    const months: Record<string, number> = {};
    pos.forEach(p => {
      const month = p.orderDate ? p.orderDate.substring(0, 7) : 'Unknown';
      months[month] = (months[month] || 0) + p.totalAmount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));
  }, [pos]);

  const poStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    pos.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [pos]);

  const vendorSpendData = useMemo(() => {
    const vMap: Record<string, number> = {};
    pos.forEach(p => {
      vMap[p.vendorName] = (vMap[p.vendorName] || 0) + p.totalAmount;
    });
    return Object.entries(vMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name: name.substring(0, 15), value }));
  }, [pos]);

  const PO_STATUS_COLUMNS: KanbanColumn[] = [
    { key: 'DRAFT', title: 'Draft', color: 'var(--color-text-tertiary)' },
    { key: 'SUBMITTED', title: 'Submitted', color: 'var(--color-warning)' },
    { key: 'APPROVED', title: 'Approved', color: 'var(--color-success)' },
    { key: 'RECEIVED', title: 'Received', color: 'var(--color-primary)' },
  ];

  const handleKanbanMove = async (itemId: string, _from: string, toColumn: string) => {
    try {
      await client.patch(`/procurement/purchase-orders/${itemId}`, { status: toColumn });
      loadDashboardData();
    } catch {
      setPos(prev => prev.map(p => p.id === itemId ? { ...p, status: toColumn, columnKey: toColumn } : p));
    }
  };

  return (
    <RouteGuard permission="procurement.dashboard.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Procurement Hub"
        description="Source materials, negotiate supplier bids, and track inventory procure-to-pay lifecycles."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement' }]}
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
          <StatCardRow stats={[
            { label: 'Total Procurement Commit', value: `$${totalPOSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <TrendingUp size={16} />, color: 'var(--chart-1)' },
            { label: 'Released / Approved Spend', value: `$${approvedSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <BadgeCent size={16} />, color: 'var(--chart-2)' },
            { label: 'Active Supplier RFQ Bids', value: `${rfqBids} Bids`, icon: <FileSpreadsheet size={16} />, color: 'var(--chart-3)' },
            { label: 'Active Vendors Directory', value: `${vendors.length} Suppliers`, icon: <Building size={16} />, color: 'var(--chart-5)' },
          ]} />

          {/* Chart View */}
          {activeView === 'chart' && (
            <div className={styles.p2}>
              <DashboardChart
                title="Monthly Procurement Spend"
                subtitle="Spend values grouped by PO date"
                data={monthlySpendData}
                config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Spend', color: 'var(--color-primary)' }] }}
                defaultChartType="area"
                allowedChartTypes={['area', 'line', 'bar']}
                height={280}
              />
              <DashboardChart
                title="PO Status Distribution"
                subtitle="Purchase orders grouped by current status"
                data={poStatusDistribution}
                config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Count' }], valueKey: 'value', nameKey: 'name' }}
                defaultChartType="donut"
                allowedChartTypes={['donut', 'pie', 'bar']}
                height={280}
              />
              <DashboardChart
                title="Vendor Spend Concentration"
                subtitle="Total PO spend by supplier (top 8)"
                data={vendorSpendData}
                config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Total Spend', color: 'var(--color-success)' }] }}
                defaultChartType="bar"
                allowedChartTypes={['bar', 'radar', 'line']}
                height={280}
              />
            </div>
          )}

          {/* Kanban View */}
          {activeView === 'kanban' && (
            <KanbanBoard<PurchaseOrder>
              columns={PO_STATUS_COLUMNS}
              items={pos}
              onCardMove={handleKanbanMove}
              renderCard={(item) => (
                <div>
                  <div className={styles.p3}>{item.poNumber}</div>
                  <div className={styles.p4}>{item.vendorName}</div>
                  <div className={styles.p5}>${item.totalAmount.toLocaleString()}</div>
                  <div className="ui-flex-between">
                    <span className="ui-text-micro">
                      {item.orderDate}
                    </span>
                  </div>
                </div>
              )}
            />
          )}

          {/* List/Standard View */}
          {activeView === 'list' && (
            <>
              {/* Quick Access Sourcing Workflows */}
              <div className={styles.p6}>
                <Card>
                  <div className="ui-stack-3">
                    <div className="ui-hstack-3">
                      <div className={styles.p7}>
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                        <h4 className={styles.p8}>Purchase Orders</h4>
                        <span className="ui-text-xs-muted">Draft, approve, and track vendor POs</span>
                      </div>
                    </div>
                    <div className={styles.p9}>
                      <span className="ui-text-xs-muted">{pendingOrdersCount} orders pending approval</span>
                      <Link href="/procurement/purchase-orders" className={styles.p10}>
                        Open POs <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="ui-stack-3">
                    <div className="ui-hstack-3">
                      <div className={styles.p11}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 className={styles.p12}>Purchase Receipts</h4>
                        <span className="ui-text-xs-muted">Log Goods Receipt Notes (GRN)</span>
                      </div>
                    </div>
                    <div className={styles.p13}>
                      <span className="ui-text-xs-muted">Inspect incoming vendor deliveries</span>
                      <Link href="/procurement/purchase-receipts" className={styles.p14}>
                        Manage GRNs <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="ui-stack-3">
                    <div className="ui-hstack-3">
                      <div className={styles.p15}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className={styles.p16}>RFQ Sourcing Sprints</h4>
                        <span className="ui-text-xs-muted">Publish Requests for Quotation (RFQ)</span>
                      </div>
                    </div>
                    <div className={styles.p17}>
                      <span className="ui-text-xs-muted">{rfqs.filter(r => r.status === 'SENT').length} RFQs active in market</span>
                      <Link href="/procurement/rfqs" className={styles.p18}>
                        Sourcing RFQs <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Supplier Directory and Bids Row */}
              <div className={styles.p19}>
                <Card padding="none">
                  <div className={styles.p20}>
                    <h4 className={styles.p21}>Supplier Quotation Evaluator</h4>
                    <Link href="/procurement/supplier-quotations" className={styles.p22}>Compare Bids</Link>
                  </div>
                  <div className={styles.p23}>
                    <p className={styles.p24}>
                      Compare bids sent back from vendors corresponding to RFQs. Evaluate pricing matrices and automatically convert approved quotations to Purchase Orders.
                    </p>
                    <div className={styles.p25}>
                      <Link href="/procurement/supplier-quotations" className={["ui-btn ui-btn-secondary", styles.p26].join(' ')} >
                        Evaluate Vendor Bids
                      </Link>
                    </div>
                  </div>
                </Card>

                <Card padding="none">
                  <div className={styles.p27}>
                    <h4 className={styles.p28}>Active Vendors Directory</h4>
                    <Link href="/procurement/vendors" className={styles.p29}>View All</Link>
                  </div>
                  <div className={styles.p30}>
                    <p className={styles.p31}>
                      Manage supplier profiles, contact details, payment terms, and historical logs of purchase transactions.
                    </p>
                    <div className={styles.p32}>
                      <Link href="/procurement/vendors" className={["ui-btn ui-btn-secondary", styles.p33].join(' ')} >
                        Open Vendor Directory
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}
      </div>
    </RouteGuard>
  );
}
