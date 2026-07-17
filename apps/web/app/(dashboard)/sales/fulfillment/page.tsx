'use client';

import styles from './page.module.css';

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
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  return (
    <div className="ui-stack-6 ui-animate-in">
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
        <div className={styles.p1}>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p2}>
                <Truck size={20} />
              </div>
              <div>
                <div className={styles.p3}>Backorders</div>
                <div className={styles.p4}>{backorders.length} Orders</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p5}>
                <TrendingUp size={20} />
              </div>
              <div>
                <div className={styles.p6}>Fulfillment Profit</div>
                <div className={styles.p7}>{fmtCurrency(profitability.netMargin)} ({profitability.marginPct}%)</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p8}>
                <Clock size={20} />
              </div>
              <div>
                <div className={styles.p9}>At Risk Orders</div>
                <div className={styles.p10}>{slaList.filter(s => s.slaStatus === 'AT_RISK').length} Orders</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p11}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className={styles.p12}>Breached SLAs</div>
                <div className={styles.p13}>{slaList.filter(s => s.slaStatus === 'BREACHED').length} Orders</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className={styles.p14}>
        {/* SLA List */}
        <Card>
          <div className="p-6">
            <h3 className={styles.p15}>Fulfillment SLA Monitor</h3>
            <DataTable data={slaList} columns={slaColumns} />
          </div>
        </Card>

        {/* Backorders List */}
        <Card>
          <div className="p-6">
            <h3 className={styles.p16}>Backlogged & Backordered Items</h3>
            <DataTable data={backorders} columns={backorderColumns} />
          </div>
        </Card>
      </div>
    </div>
  );
}
