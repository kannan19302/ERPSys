'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, useToast, Badge, DataTable, type Column } from '@unerp/ui';
import { Truck, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { apiGet } from '../../crm/_components/api';

interface Backorder {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  qtyOrdered: number;
  qtyAllocated: number;
  qtyBackordered: number;
  eta: string;
}

interface SlaStatus {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  promisedDate: string;
  daysRemaining: number;
  slaStatus: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
}

interface Profitability {
  totalRevenue: number;
  totalCost: number;
  netMargin: number;
  marginPct: number;
  avgOrderValue: number;
}

export default function FulfillmentPage() {
  const [loading, setLoading] = useState(true);
  const [backorders, setBackorders] = useState<Backorder[]>([]);
  const [slaList, setSlaList] = useState<SlaStatus[]>([]);
  const [profitability, setProfitability] = useState<Profitability | null>(null);
  const toast = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const [bo, sla, profit] = await Promise.all([
          apiGet<Backorder[]>('/sales/expansion/backorders'),
          apiGet<SlaStatus[]>('/sales/expansion/order-sla-status'),
          apiGet<Profitability>('/sales/expansion/order-profitability'),
        ]);
        setBackorders(bo || []);
        setSlaList(sla || []);
        setProfitability(profit);
      } catch (err) {
        toast.error('Failed to load fulfillment data', err instanceof Error ? err.message : 'Please try again');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [toast]);

  const fmtCurrency = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const backorderColumns: Column<Backorder>[] = [
    { key: 'orderNumber', header: 'Order #', sortable: true },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'productName', header: 'Product', sortable: true },
    { key: 'qtyBackordered', header: 'Qty Backordered', render: (row) => `${row.qtyBackordered} of ${row.qtyOrdered}` },
    { key: 'eta', header: 'ETA', render: (row) => new Date(row.eta).toLocaleDateString() },
  ];

  const slaColumns: Column<SlaStatus>[] = [
    { key: 'orderNumber', header: 'Order #', sortable: true },
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'promisedDate', header: 'Promised Date', render: (row) => new Date(row.promisedDate).toLocaleDateString() },
    { key: 'daysRemaining', header: 'Days Left', render: (row) => `${row.daysRemaining} days` },
    {
      key: 'slaStatus',
      header: 'SLA Status',
      render: (row) => {
        const status = row.slaStatus;
        if (status === 'ON_TRACK') return <Badge variant="success">On Track</Badge>;
        if (status === 'AT_RISK') return <Badge variant="warning">At Risk</Badge>;
        return <Badge variant="danger">Breached</Badge>;
      },
    },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Order Fulfillment & Delivery"
        description="Monitor order backlog, delivery schedules, and fulfillment SLAs"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Sales', href: '/sales' },
          { label: 'Fulfillment & SLAs' },
        ]}
      />

      {profitability && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <Truck size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Backorders</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{backorders.length} Orders</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-success)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Fulfillment Profit</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{fmtCurrency(profitability.netMargin)} ({profitability.marginPct}%)</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-warning)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>At Risk Orders</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{slaList.filter(s => s.slaStatus === 'AT_RISK').length} Orders</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-error)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Breached SLAs</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{slaList.filter(s => s.slaStatus === 'BREACHED').length} Orders</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
        {/* SLA List */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Fulfillment SLA Monitor</h3>
            <DataTable data={slaList} columns={slaColumns} />
          </div>
        </Card>

        {/* Backorders List */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Backlogged & Backordered Items</h3>
            <DataTable data={backorders} columns={backorderColumns} />
          </div>
        </Card>
      </div>
    </div>
  );
}
