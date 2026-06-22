'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, PageHeader, Spinner } from '@unerp/ui';
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

interface PurchaseOrder {
  id: string;
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
  const [vendorsCount, setVendorsCount] = useState(0);

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

      if (poRes.ok) setPos(await poRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (rfqRes.ok) setRfqs(await rfqRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (vendorRes.ok) {
        const v = await vendorRes.json();
        setVendorsCount(v.length);
      }
    } catch {
      setError('Could not load data. Please try again.');
      setPos([]);
      setRfqs([]);
      setVendorsCount(2);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalPOSpend = pos.reduce((acc, p) => acc + p.totalAmount, 0);
  const approvedSpend = pos.filter(p => p.status === 'APPROVED' || p.status === 'RECEIVED').reduce((acc, p) => acc + p.totalAmount, 0);
  const pendingOrdersCount = pos.filter(p => p.status === 'DRAFT' || p.status === 'SUBMITTED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Procurement Hub"
        description="Source materials, negotiate supplier bids, and track inventory procure-to-pay lifecycles."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement' }]}
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
          {/* Sourcing Spend Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Total Procurement Commit</span>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px' }}>
                  <TrendingUp size={14} />
                </div>
              </div>
              <h4 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0 0', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
                ${totalPOSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Released / Approved Spend</span>
                <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '4px', borderRadius: '4px' }}>
                  <BadgeCent size={14} />
                </div>
              </div>
              <h4 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0 0', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)' }}>
                ${approvedSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Active Supplier Quotations</span>
                <div style={{ background: 'var(--color-info-light)', color: 'var(--color-info-text)', padding: '4px', borderRadius: '4px' }}>
                  <FileSpreadsheet size={14} />
                </div>
              </div>
              <h4 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0 0', fontWeight: 'var(--weight-bold)' }}>
                {rfqs.reduce((acc, r) => acc + r.quotesCount, 0)} Bids
              </h4>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Active Vendors Directory</span>
                <div style={{ background: 'var(--color-bg-sunken)', color: 'var(--color-text-secondary)', padding: '4px', borderRadius: '4px' }}>
                  <Building size={14} />
                </div>
              </div>
              <h4 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-2) 0 0', fontWeight: 'var(--weight-bold)' }}>
                {vendorsCount} Suppliers
              </h4>
            </Card>
          </div>

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
    </div>
  );
}
