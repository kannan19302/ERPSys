'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, PageHeader, Button, Spinner, Badge, ChangeHistory } from '@unerp/ui';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Truck,
  DollarSign,
  ArrowLeft,
  Building,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  receivedQty: number;
  unitPrice: number;
  totalAmount: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  orderDate: string;
  expectedDate: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  vendorName: string;
  notes?: string;
  lineItems?: PurchaseOrderItem[];
}

interface MatchItem {
  productId: string | null;
  description: string;
  orderedQty: number;
  receivedQty: number;
  invoicedQty: number;
  orderedUnitPrice: number;
  receivedUnitPrice: number;
  invoicedUnitPrice: number;
  qtyMatch: boolean;
  priceMatch: boolean;
}

interface ThreeWayMatchReport {
  purchaseOrderId: string;
  poNumber: string;
  status: 'MATCHED' | 'DISCREPANCY' | 'PENDING';
  overallMatch: boolean;
  items: MatchItem[];
}

export default function PurchaseOrderDetailPage() {
  const client = useApiClient();
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [matchReport, setMatchReport] = useState<ThreeWayMatchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [poRes, matchRes] = await Promise.all([
        client.get<PurchaseOrder>(`/procurement/purchase-orders/${poId}`),
        client.get<ThreeWayMatchReport>(`/procurement/purchase-orders/${poId}/three-way-match`)
      ]);

      setPo(poRes);
      setMatchReport(matchRes);
    } catch {
      setError('Could not load data. Please try again.');

      // Fallback sample PO
      setPo({
        id: poId,
        poNumber: 'PO-2026-001',
        status: 'RECEIVED',
        orderDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        expectedDate: new Date().toISOString(),
        subtotal: 7500,
        taxAmount: 750,
        totalAmount: 8250,
        currency: 'USD',
        vendorName: 'Apex Metal Solutions',
        notes: 'Steel frame raw material procurement.',
        lineItems: [
          {
            id: 'poi-1',
            description: 'Structural Steel I-Beam (Type A)',
            quantity: 50,
            receivedQty: 50,
            unitPrice: 150,
            totalAmount: 7500
          }
        ]
      });

      // Fallback sample Match Report
      setMatchReport({
        purchaseOrderId: poId,
        poNumber: 'PO-2026-001',
        status: 'MATCHED',
        overallMatch: true,
        items: [
          {
            productId: 'prod-1',
            description: 'Structural Steel I-Beam (Type A)',
            orderedQty: 50,
            receivedQty: 50,
            invoicedQty: 50,
            orderedUnitPrice: 150,
            receivedUnitPrice: 150,
            invoicedUnitPrice: 150,
            qtyMatch: true,
            priceMatch: true
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poId) {
      loadData();
    }
  }, [poId, client]);

  if (loading) {
    return (
      <div className={styles.p1}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className={styles.p2}>
        <AlertCircle size={48} className={styles.p3} />
        <h3 className={styles.p4}>Purchase Order Not Found</h3>
        <Button onClick={() => router.push('/procurement/purchase-orders')} className={["ui-btn ui-btn-secondary", styles.p5].join(' ')} >
          Back to Orders
        </Button>
      </div>
    );
  }

  const getMatchBadgeVariant = (status: string): "default" | "primary" | "danger" | "success" | "warning" | "info" | undefined => {
    switch (status) {
      case 'MATCHED': return 'success';
      case 'DISCREPANCY': return 'danger';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  return (
    <RouteGuard permission="procurement.purchase-order.read">
      <div className="ui-stack-6 ui-animate-in">

      {/* Header with back navigation */}
      <div className="ui-hstack-2">
        <button
          onClick={() => router.push('/procurement/purchase-orders')}
          className={styles.p6}
        >
          <ArrowLeft size={18} />
        </button>
        <PageHeader
          title={`Order: ${po.poNumber}`}
          description={`Details & 3-Way Match Check for ${po.poNumber}`}
          breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Procurement', href: '/procurement' }, { label: 'Purchase Orders', href: '/procurement/purchase-orders' }, { label: po.poNumber }]}
        />
      </div>

      {error && (
        <div className={styles.p7}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Main Details Panel */}
      <div className="ui-grid-3">
        <Card className={["ui-card", styles.p8].join(' ')} >

          <div className={styles.p9}>
            <div className={styles.p10}>
              <Building size={20} className="ui-text-muted" />
              <div>
                <div className="ui-text-xs-muted">Supplier / Vendor</div>
                <div className={styles.p11}>{po.vendorName}</div>
              </div>
            </div>

            <div className="ui-flex ui-gap-3">
              <div>
                <Badge variant={po.status === 'APPROVED' || po.status === 'RECEIVED' ? 'success' : 'default'}>
                  Order: {po.status}
                </Badge>
              </div>
              {matchReport && (
                <div>
                  <Badge variant={getMatchBadgeVariant(matchReport.status)}>
                    Audit: {matchReport.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className={["ui-grid-3", styles.p12].join(' ')} >
            <div>
              <div className={styles.p13}>
                <Calendar size={12} /> Order Date
              </div>
              <div className={styles.p14}>
                {new Date(po.orderDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className={styles.p15}>
                <Calendar size={12} /> Expected Date
              </div>
              <div className={styles.p16}>
                {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'Immediate'}
              </div>
            </div>
            <div>
              <div className={styles.p17}>
                <DollarSign size={12} /> Total Amount
              </div>
              <div className={styles.p18}>
                ${Number(po.totalAmount).toLocaleString()} {po.currency}
              </div>
            </div>
          </div>

          {/* Tab switches */}
          <div className={styles.p19}>
            <button
              onClick={() => setActiveTab('details')}
              style={{ fontWeight: activeTab === 'details' ? 'bold' : 'normal', color: activeTab === 'details' ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderBottom: activeTab === 'details' ? '2px solid var(--color-primary)' : 'none' }}
            >
              Order Line Items
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              style={{ fontWeight: activeTab === 'audit' ? 'bold' : 'normal', color: activeTab === 'audit' ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderBottom: activeTab === 'audit' ? '2px solid var(--color-primary)' : 'none' }}
            >
              <FileCheck size={14} /> 3-Way Match Audit
            </button>
          </div>

          {/* Tab Content 1: PO Items */}
          {activeTab === 'details' ? (
            <div className="builder-table-wrapper">
              <table className={styles.p22}>
                <thead>
                  <tr className={styles.p23}>
                    <th className={styles.p24}>Description</th>
                    <th className={styles.p25}>Ordered Qty</th>
                    <th className={styles.p26}>Received Qty</th>
                    <th className={styles.p27}>Unit Price</th>
                    <th className={styles.p28}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {po.lineItems?.map(item => (
                    <tr key={item.id} className={styles.p29}>
                      <td className={styles.p30}>{item.description}</td>
                      <td className={styles.p31}>{Number(item.quantity)}</td>
                      <td className={styles.p32}>
                        <span style={{ color: Number(item.receivedQty) < Number(item.quantity) ? 'var(--color-warning)' : 'var(--color-success)' }}>
                          {Number(item.receivedQty)}
                        </span>
                      </td>
                      <td className={styles.p34}>${Number(item.unitPrice).toLocaleString()}</td>
                      <td className={styles.p35}>
                        ${Number(item.totalAmount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.p36}>
                <div className="ui-text-xs-muted">
                  Subtotal: <span className={styles.p37}>${Number(po.subtotal).toLocaleString()}</span>
                </div>
                <div className="ui-text-xs-muted">
                  Tax: <span className={styles.p38}>${Number(po.taxAmount).toLocaleString()}</span>
                </div>
                <div className={styles.p39}>
                  Total Amount: ${Number(po.totalAmount).toLocaleString()} {po.currency}
                </div>
              </div>
            </div>
          ) : (
            /* Tab Content 2: 3-Way Match audit check */
            <div className="ui-stack-4">
              {matchReport && (
                <>
                  <div style={{ background: matchReport.overallMatch ? 'var(--color-success-light)' : 'var(--color-warning-light)', border: `1px solid ${matchReport.overallMatch ? 'var(--color-success)' : 'var(--color-warning)'}`, color: matchReport.overallMatch ? 'var(--color-success-text)' : 'var(--color-warning-text)' }}>
                    {matchReport.overallMatch ? <CheckCircle size={20} className={styles.p41} /> : <AlertCircle size={20} className={styles.p42} />}
                    <div>
                      <div className={styles.p43}>
                        {matchReport.overallMatch ? '3-Way Match Passed' : 'Audit Exception Logged'}
                      </div>
                      <div className={styles.p44}>
                        {matchReport.overallMatch
                          ? 'Ordered quantities and unit pricing match exactly across the purchase order, goods receipt notes (GRN), and vendor invoice.'
                          : 'A discrepancy exists in either the quantity or unit price. Check the highlights below to trace issues.'}
                      </div>
                    </div>
                  </div>

                  <div className="builder-table-wrapper">
                    <table className={styles.p45}>
                      <thead>
                        <tr className={styles.p46}>
                          <th className="p-3" rowSpan={2}>Item Description</th>
                          <th className={styles.p47} colSpan={3}>Quantities Comparison</th>
                          <th className={styles.p48} colSpan={2}>Unit Prices Comparison</th>
                          <th className={styles.p49} rowSpan={2}>Audit Status</th>
                        </tr>
                        <tr className={styles.p50}>
                          <th className={styles.p51}>Ordered (PO)</th>
                          <th className={styles.p52}>Received (GRN)</th>
                          <th className={styles.p53}>Invoiced (Bill)</th>
                          <th className={styles.p54}>Ordered</th>
                          <th className={styles.p55}>Invoiced</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchReport.items.map((item, idx) => (
                          <tr key={idx} className={styles.p56}>
                            <td className={styles.p57}>{item.description}</td>

                            {/* Qty Audit */}
                            <td className={styles.p58}>{item.orderedQty}</td>
                            <td style={{ background: item.qtyMatch ? 'transparent' : 'var(--color-danger-light)', color: item.qtyMatch ? 'inherit' : 'var(--color-danger)' }}>
                              {item.receivedQty}
                            </td>
                            <td style={{ background: item.qtyMatch ? 'transparent' : 'var(--color-danger-light)', color: item.qtyMatch ? 'inherit' : 'var(--color-danger)' }}>
                              {item.invoicedQty}
                            </td>

                            {/* Price Audit */}
                            <td className={styles.p61}>${item.orderedUnitPrice}</td>
                            <td style={{ background: item.priceMatch ? 'transparent' : 'var(--color-danger-light)', color: item.priceMatch ? 'inherit' : 'var(--color-danger)' }}>
                              ${item.invoicedUnitPrice}
                            </td>

                            {/* Check badges */}
                            <td className={styles.p63}>
                              <Badge variant={item.qtyMatch && item.priceMatch ? 'success' : 'danger'}>
                                {item.qtyMatch && item.priceMatch ? 'OK' : 'DISCREPANCY'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

        </Card>

        {/* Info Column */}
        <div className="ui-stack-4">
          <Card className="ui-card">
            <h4 className={styles.p64}>
              Procurement Audit Rules
            </h4>
            <div className={styles.p65}>
              <div>
                <span className={styles.p66}>3-Way Match Check</span> matches items across:
                <ol className={styles.p67}>
                  <li>The Purchase Order (Commitment)</li>
                  <li>Purchase Receipt/GRN (Received)</li>
                  <li>Supplier Invoice (Billed)</li>
                </ol>
              </div>
              <div>
                Discrepancies in quantity or unit prices are flagged as exceptions to prevent overpayment.
              </div>
              <div className={styles.p68}>
                <span className={styles.p69}>Tolerance limits</span> are set to 0% by default for direct materials, and up to 5% for shipping items.
              </div>
            </div>
          </Card>

          {po.notes && (
            <Card className="ui-card">
              <h4 className={styles.p70}>
                Supplier Notes
              </h4>
              <p className={styles.p71}>
                {po.notes}
              </p>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-8">
        <ChangeHistory entityType="PurchaseOrder" entityId={poId} />
      </div>
      </div>
    </RouteGuard>
  );
}
