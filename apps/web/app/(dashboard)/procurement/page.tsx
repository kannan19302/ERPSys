'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, PageHeader, Spinner, DashboardKPICard, DashboardChart, ViewSwitcher, KanbanBoard, type ViewMode, type KanbanColumn, type KanbanItem } from '@unerp/ui';
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
import { apiPatch } from '../../../src/lib/api';

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
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      const [poRes, rfqRes, vendorRes] = await Promise.all([
        fetch('/api/v1/procurement/purchase-orders', { headers }),
        fetch('/api/v1/procurement/rfqs', { headers }),
        fetch('/api/v1/crm/vendors', { headers })
      ]);

      if (poRes.ok) {
        const poData = await poRes.json();
        const normalizedPos = (Array.isArray(poData) ? poData : (poData?.data || [])).map((p: any) => ({
          ...p,
          columnKey: p.status || 'DRAFT'
        }));
        setPos(normalizedPos);
      }
      if (rfqRes.ok) setRfqs(await rfqRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (vendorRes.ok) {
        const v = await vendorRes.json();
        const vendorList = Array.isArray(v) ? v : (v?.data || []);
        setVendors(vendorList);
      }
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
  }, []);

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
    { key: 'DRAFT', title: 'Draft', color: '#9ca3af' },
    { key: 'SUBMITTED', title: 'Submitted', color: '#f59e0b' },
    { key: 'APPROVED', title: 'Approved', color: '#22c55e' },
    { key: 'RECEIVED', title: 'Received', color: '#4f46e5' },
  ];

  const handleKanbanMove = async (itemId: string, _from: string, toColumn: string) => {
    try {
      await apiPatch(`/procurement/purchase-orders/${itemId}`, { status: toColumn });
      loadDashboardData();
    } catch {
      setPos(prev => prev.map(p => p.id === itemId ? { ...p, status: toColumn, columnKey: toColumn } : p));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Procurement Hub"
        description="Source materials, negotiate supplier bids, and track inventory procure-to-pay lifecycles."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement' }]}
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
          {/* KPI Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <DashboardKPICard
              title="Total Procurement Commit"
              value={`$${totalPOSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={<TrendingUp size={18} />}
              color="var(--color-primary)"
              drillDown={{
                modalTitle: 'Purchase Orders Summary',
                columns: [
                  { key: 'poNumber', label: 'PO Number' },
                  { key: 'vendorName', label: 'Supplier' },
                  { key: 'totalAmount', label: 'Total', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'status', label: 'Status' }
                ],
                rows: pos.map(p => ({ ...p }))
              }}
            />

            <DashboardKPICard
              title="Released / Approved Spend"
              value={`$${approvedSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={<BadgeCent size={18} />}
              color="var(--color-success)"
              drillDown={{
                modalTitle: 'Approved/Released Purchase Orders',
                columns: [
                  { key: 'poNumber', label: 'PO Number' },
                  { key: 'vendorName', label: 'Supplier' },
                  { key: 'totalAmount', label: 'Total', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'status', label: 'Status' }
                ],
                rows: pos.filter(p => p.status === 'APPROVED' || p.status === 'RECEIVED').map(p => ({ ...p }))
              }}
            />

            <DashboardKPICard
              title="Active Supplier RFQ Bids"
              value={`${rfqBids} Bids`}
              icon={<FileSpreadsheet size={18} />}
              color="var(--color-info-text)"
              drillDown={{
                modalTitle: 'Supplier RFQ Bids',
                columns: [
                  { key: 'rfqNumber', label: 'RFQ Number' },
                  { key: 'title', label: 'Title' },
                  { key: 'quotesCount', label: 'Quotes Count' },
                  { key: 'status', label: 'Status' }
                ],
                rows: rfqs.map(r => ({ ...r }))
              }}
            />

            <DashboardKPICard
              title="Active Vendors Directory"
              value={`${vendors.length} Suppliers`}
              icon={<Building size={18} />}
              color="var(--color-text-secondary)"
              drillDown={{
                modalTitle: 'Suppliers Directory',
                columns: [
                  { key: 'name', label: 'Supplier Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' }
                ],
                rows: vendors.map(v => ({ ...v }))
              }}
            />
          </div>

          {/* Chart View */}
          {activeView === 'chart' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
              <DashboardChart
                title="Monthly Procurement Spend"
                subtitle="Spend values grouped by PO date"
                data={monthlySpendData}
                config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Spend', color: '#4f46e5' }] }}
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
                config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Total Spend', color: '#22c55e' }] }}
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
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginBottom: '4px' }}>{item.poNumber}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>{item.vendorName}</div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: '4px' }}>${item.totalAmount.toLocaleString()}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                <Card>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Purchase Orders</h4>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Draft, approve, and track vendor POs</span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{pendingOrdersCount} orders pending approval</span>
                      <Link href="/procurement/purchase-orders" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 'var(--weight-semibold)' }}>
                        Open POs <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Purchase Receipts</h4>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Log Goods Receipt Notes (GRN)</span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Inspect incoming vendor deliveries</span>
                      <Link href="/procurement/purchase-receipts" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 'var(--weight-semibold)' }}>
                        Manage GRNs <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ background: 'var(--color-info-light)', color: 'var(--color-info-text)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>RFQ Sourcing Sprints</h4>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Publish Requests for Quotation (RFQ)</span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{rfqs.filter(r => r.status === 'SENT').length} RFQs active in market</span>
                      <Link href="/procurement/rfqs" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 'var(--weight-semibold)' }}>
                        Sourcing RFQs <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Supplier Directory and Bids Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
                <Card padding="none">
                  <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Supplier Quotation Evaluator</h4>
                    <Link href="/procurement/supplier-quotations" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none' }}>Compare Bids</Link>
                  </div>
                  <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Compare bids sent back from vendors corresponding to RFQs. Evaluate pricing matrices and automatically convert approved quotations to Purchase Orders.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Link href="/procurement/supplier-quotations" className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-2) var(--space-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        Evaluate Vendor Bids
                      </Link>
                    </div>
                  </div>
                </Card>

                <Card padding="none">
                  <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Active Vendors Directory</h4>
                    <Link href="/procurement/vendors" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none' }}>View All</Link>
                  </div>
                  <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Manage supplier profiles, contact details, payment terms, and historical logs of purchase transactions.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Link href="/procurement/vendors" className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-2) var(--space-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
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
  );
}
