'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
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
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      const [poRes, matchRes] = await Promise.all([
        fetch(`/api/v1/procurement/purchase-orders/${poId}`, { headers }),
        fetch(`/api/v1/procurement/purchase-orders/${poId}/three-way-match`, { headers })
      ]);

      if (poRes.ok) {
        setPo(await poRes.json());
      }
      if (matchRes.ok) {
        setMatchReport(await matchRes.json());
      }
    } catch {
      setError('Serving local mock fallback purchase order details.');
      
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
  }, [poId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!po) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-12)' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-4)' }} />
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>Purchase Order Not Found</h3>
        <Button onClick={() => router.push('/procurement/purchase-orders')} className="frappe-btn frappe-btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      
      {/* Header with back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button
          onClick={() => router.push('/procurement/purchase-orders')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-sunken)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback PO Details)</span>
        </div>
      )}

      {/* Main Details Panel */}
      <div className="frappe-grid-3">
        <Card className="frappe-card" style={{ gridColumn: 'span 2 / span 2', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <Building size={20} style={{ color: 'var(--color-text-secondary)' }} />
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Supplier / Vendor</div>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 'bold' }}>{po.vendorName}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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

          <div className="frappe-grid-3" style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <Calendar size={12} /> Order Date
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', marginTop: 'var(--space-1)' }}>
                {new Date(po.orderDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <Calendar size={12} /> Expected Date
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', marginTop: 'var(--space-1)' }}>
                {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'Immediate'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <DollarSign size={12} /> Total Amount
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', marginTop: 'var(--space-1)' }}>
                ${Number(po.totalAmount).toLocaleString()} {po.currency}
              </div>
            </div>
          </div>

          {/* Tab switches */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginTop: 'var(--space-2)' }}>
            <button
              onClick={() => setActiveTab('details')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: activeTab === 'details' ? 'bold' : 'normal',
                color: activeTab === 'details' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'details' ? '2px solid var(--color-primary)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Order Line Items
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: activeTab === 'audit' ? 'bold' : 'normal',
                color: activeTab === 'audit' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'audit' ? '2px solid var(--color-primary)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)'
              }}
            >
              <FileCheck size={14} /> 3-Way Match Audit
            </button>
          </div>

          {/* Tab Content 1: PO Items */}
          {activeTab === 'details' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-2)' }}>Description</th>
                    <th style={{ padding: 'var(--space-3) var(--space-2)' }}>Ordered Qty</th>
                    <th style={{ padding: 'var(--space-3) var(--space-2)' }}>Received Qty</th>
                    <th style={{ padding: 'var(--space-3) var(--space-2)' }}>Unit Price</th>
                    <th style={{ padding: 'var(--space-3) var(--space-2)', textAlign: 'right' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {po.lineItems?.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-sm)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', fontWeight: 'var(--weight-medium)' }}>{item.description}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)' }}>{Number(item.quantity)}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)' }}>
                        <span style={{ color: Number(item.receivedQty) < Number(item.quantity) ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 'bold' }}>
                          {Number(item.receivedQty)}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)' }}>${Number(item.unitPrice).toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)', textAlign: 'right', fontWeight: 'bold' }}>
                        ${Number(item.totalAmount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignItems: 'flex-end', marginTop: 'var(--space-4)', paddingRight: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Subtotal: <span style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>${Number(po.subtotal).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Tax: <span style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>${Number(po.taxAmount).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                  Total Amount: ${Number(po.totalAmount).toLocaleString()} {po.currency}
                </div>
              </div>
            </div>
          ) : (
            /* Tab Content 2: 3-Way Match audit check */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {matchReport && (
                <>
                  <div style={{ padding: 'var(--space-4)', background: matchReport.overallMatch ? 'var(--color-success-light)' : 'var(--color-warning-light)', border: `1px solid ${matchReport.overallMatch ? 'var(--color-success)' : 'var(--color-warning)'}`, borderRadius: 'var(--radius-md)', color: matchReport.overallMatch ? 'var(--color-success-text)' : 'var(--color-warning-text)', display: 'flex', gap: 'var(--space-3)' }}>
                    {matchReport.overallMatch ? <CheckCircle size={20} style={{ flexShrink: 0 }} /> : <AlertCircle size={20} style={{ flexShrink: 0 }} />}
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 'var(--text-md)' }}>
                        {matchReport.overallMatch ? '3-Way Match Passed' : 'Audit Exception Logged'}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)', opacity: 0.9 }}>
                        {matchReport.overallMatch
                          ? 'Ordered quantities and unit pricing match exactly across the purchase order, goods receipt notes (GRN), and vendor invoice.'
                          : 'A discrepancy exists in either the quantity or unit price. Check the highlights below to trace issues.'}
                      </div>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                          <th style={{ padding: 'var(--space-3)' }} rowSpan={2}>Item Description</th>
                          <th style={{ padding: 'var(--space-3)', textAlign: 'center', borderRight: '1px solid var(--color-border)' }} colSpan={3}>Quantities Comparison</th>
                          <th style={{ padding: 'var(--space-3)', textAlign: 'center' }} colSpan={2}>Unit Prices Comparison</th>
                          <th style={{ padding: 'var(--space-3)', textAlign: 'center' }} rowSpan={2}>Audit Status</th>
                        </tr>
                        <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                          <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>Ordered (PO)</th>
                          <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>Received (GRN)</th>
                          <th style={{ padding: 'var(--space-2)', textAlign: 'center', borderRight: '1px solid var(--color-border)' }}>Invoiced (Bill)</th>
                          <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>Ordered</th>
                          <th style={{ padding: 'var(--space-2)', textAlign: 'center' }}>Invoiced</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchReport.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                            <td style={{ padding: 'var(--space-3)', fontWeight: 'bold' }}>{item.description}</td>
                            
                            {/* Qty Audit */}
                            <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>{item.orderedQty}</td>
                            <td style={{ padding: 'var(--space-3)', textAlign: 'center', background: item.qtyMatch ? 'transparent' : 'var(--color-danger-light)', color: item.qtyMatch ? 'inherit' : 'var(--color-danger)' }}>
                              {item.receivedQty}
                            </td>
                            <td style={{ padding: 'var(--space-3)', textAlign: 'center', borderRight: '1px solid var(--color-border)', background: item.qtyMatch ? 'transparent' : 'var(--color-danger-light)', color: item.qtyMatch ? 'inherit' : 'var(--color-danger)' }}>
                              {item.invoicedQty}
                            </td>

                            {/* Price Audit */}
                            <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>${item.orderedUnitPrice}</td>
                            <td style={{ padding: 'var(--space-3)', textAlign: 'center', background: item.priceMatch ? 'transparent' : 'var(--color-danger-light)', color: item.priceMatch ? 'inherit' : 'var(--color-danger)' }}>
                              ${item.invoicedUnitPrice}
                            </td>

                            {/* Check badges */}
                            <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Card className="frappe-card">
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              Procurement Audit Rules
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              <div>
                <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>3-Way Match Check</span> matches items across:
                <ol style={{ paddingLeft: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
                  <li>The Purchase Order (Commitment)</li>
                  <li>Purchase Receipt/GRN (Received)</li>
                  <li>Supplier Invoice (Billed)</li>
                </ol>
              </div>
              <div>
                Discrepancies in quantity or unit prices are flagged as exceptions to prevent overpayment.
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>Tolerance limits</span> are set to 0% by default for direct materials, and up to 5% for shipping items.
              </div>
            </div>
          </Card>

          {po.notes && (
            <Card className="frappe-card">
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                Supplier Notes
              </h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                {po.notes}
              </p>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
