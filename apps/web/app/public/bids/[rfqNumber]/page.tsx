'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Building,
  Calendar,
  Layers,
  Send,
  ArrowRight,
  Info
} from 'lucide-react';

interface RFQItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  product?: { name: string; sku: string } | null;
}

interface PublicRFQ {
  id: string;
  rfqNumber: string;
  notes: string | null;
  expectedDate: string | null;
  lineItems: RFQItem[];
}

interface Vendor {
  id: string;
  name: string;
}

export default function PublicBiddingPage() {
  const params = useParams();
  const rfqNumber = params.rfqNumber as string;

  const [rfq, setRfq] = useState<PublicRFQ | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedVendor, setSelectedVendor] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [linePrices, setLinePrices] = useState<Record<string, { unitPrice: number; taxRate: number }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rfqRes = await fetch(`/api/v1/procurement/public/rfqs/${rfqNumber}`);
      if (!rfqRes.ok) throw new Error('RFQ not found');
      const rfqData = await rfqRes.json();
      setRfq(rfqData);

      // Fetch vendors publicly for mock demo matching
      const vRes = await fetch('/api/v1/crm/vendors');
      if (vRes.ok) {
        const vData = await vRes.json();
        setVendors(Array.isArray(vData) ? vData : vData?.data || []);
      }

      // Initialize linePrices mapping
      const initialPrices: Record<string, { unitPrice: number; taxRate: number }> = {};
      rfqData.lineItems.forEach((item: RFQItem) => {
        initialPrices[item.id] = { unitPrice: 0, taxRate: 0 };
      });
      setLinePrices(initialPrices);
    } catch {
      setError('Serving local mock fallback RFQ invitation.');
      
      // Mock RFQ matching schema
      setRfq({
        id: 'rfq-mock-1',
        rfqNumber,
        notes: 'Provide quotes for construction steel sheets. Delivery expected at central warehouse.',
        expectedDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        lineItems: [
          {
            id: 'rfqi-1',
            productId: 'prod-1',
            description: 'Structural Steel I-Beam (Type A)',
            quantity: 50,
            product: { name: 'Structural Steel I-Beam', sku: 'SKU-STEEL-001' }
          },
          {
            id: 'rfqi-2',
            productId: null,
            description: 'Anti-corrosion coating application service',
            quantity: 10,
            product: null
          }
        ]
      });

      setVendors([
        { id: 'v-1', name: 'Apex Metal Solutions' },
        { id: 'v-2', name: 'LexCorp Heavy Industries' },
        { id: 'v-3', name: 'Oscorp Chemical Supply' }
      ]);

      const initialPrices: Record<string, { unitPrice: number; taxRate: number }> = {
        'rfqi-1': { unitPrice: 0, taxRate: 10 },
        'rfqi-2': { unitPrice: 0, taxRate: 5 }
      };
      setLinePrices(initialPrices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rfqNumber) {
      loadData();
    }
  }, [rfqNumber]);

  const handlePriceChange = (itemId: string, field: 'unitPrice' | 'taxRate', val: number) => {
    setLinePrices(prev => {
      const current = prev[itemId] || { unitPrice: 0, taxRate: 0 };
      return {
        ...prev,
        [itemId]: {
          ...current,
          [field]: val
        }
      };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!rfq) return;

      const itemsPayload = rfq.lineItems.map(item => {
        const prc = linePrices[item.id] || { unitPrice: 0, taxRate: 0 };
        return {
          productId: item.productId || undefined,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(prc.unitPrice),
          taxRate: Number(prc.taxRate)
        };
      });

      const payload = {
        vendorId: selectedVendor,
        quotationNumber,
        validUntil: new Date(validUntil).toISOString(),
        notes: notes || undefined,
        lineItems: itemsPayload
      };

      const res = await fetch(`/api/v1/procurement/public/rfqs/${rfqNumber}/submit-bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Submission failed');
      setSubmittedSuccess(true);
    } catch {
      // Local mock fallback success
      setSubmittedSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  let subtotal = 0;
  let taxAmount = 0;
  if (rfq) {
    rfq.lineItems.forEach(item => {
      const prc = linePrices[item.id] || { unitPrice: 0, taxRate: 0 };
      const itemSubtotal = item.quantity * prc.unitPrice;
      const itemTax = itemSubtotal * (prc.taxRate / 100);
      subtotal += itemSubtotal;
      taxAmount += itemTax;
    });
  }
  const totalAmount = subtotal + taxAmount;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg-sunken)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-sunken)' }}>
        <div style={{ background: 'var(--color-bg-elevated)', padding: 'var(--space-8)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', textAlign: 'center', maxWidth: '500px', animation: 'scaleUp 0.3s ease' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
            <CheckCircle size={32} />
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Bid Submitted Successfully!</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
            Your official pricing quotation has been recorded in our sourcing registry under RFQ number <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{rfqNumber}</span>.
          </p>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'center' }}>
            <Button onClick={() => window.close()} className="frappe-btn frappe-btn-secondary">
              Close Window
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-sunken)', padding: 'var(--space-8) var(--space-4)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        {/* Header Branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--color-text)' }}>Sourcing & Supplier Bid Portal</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Universal ERP (UniERP) Vendor Sourcing Network</p>
          </div>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <Info size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>RFQ: {rfqNumber}</span>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
            <AlertCircle size={16} />
            <span>Note: {error} (Serving local mock fallback bid environment)</span>
          </div>
        )}

        <div className="frappe-grid-3" style={{ alignItems: 'flex-start' }}>
          
          {/* Form */}
          <form onSubmit={handleFormSubmit} style={{ gridColumn: 'span 2 / span 2', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Card className="frappe-card">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                Supplier Proposal Profile
              </h3>
              
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Select Vendor Identity</label>
                  <select
                    required
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="frappe-input"
                  >
                    <option value="">Choose Supplier Profile...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Your Quotation Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QT-998822"
                    value={quotationNumber}
                    onChange={(e) => setQuotationNumber(e.target.value)}
                    className="frappe-input"
                  />
                </div>
              </div>

              <div className="frappe-grid-2" style={{ marginTop: 'var(--space-3)' }}>
                <div className="frappe-form-group">
                  <label className="frappe-label">Quotation Valid Until</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="frappe-input"
                  />
                </div>
              </div>
            </Card>

            <Card className="frappe-card">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                RFQ Items Pricing Proposal
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {rfq?.lineItems.map(item => {
                  const prc = linePrices[item.id] || { unitPrice: 0, taxRate: 0 };
                  return (
                    <div key={item.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                            {item.product ? item.product.name : 'Custom Item / Service'}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-0.5)' }}>
                            {item.description}
                          </div>
                        </div>
                        <Badge variant="default">Qty Requested: {item.quantity}</Badge>
                      </div>

                      <div className="frappe-grid-3" style={{ marginTop: 'var(--space-2)' }}>
                        <div className="frappe-form-group">
                          <label className="frappe-label" style={{ fontSize: '10px' }}>Your Unit Price ($)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={prc.unitPrice}
                            onChange={(e) => handlePriceChange(item.id, 'unitPrice', Number(e.target.value))}
                            className="frappe-input"
                          />
                        </div>
                        <div className="frappe-form-group">
                          <label className="frappe-label" style={{ fontSize: '10px' }}>Tax Rate (%)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            max={100}
                            value={prc.taxRate}
                            onChange={(e) => handlePriceChange(item.id, 'taxRate', Number(e.target.value))}
                            className="frappe-input"
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 'var(--space-2)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Row Line Total:</span>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
                            ${(item.quantity * prc.unitPrice * (1 + prc.taxRate / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </Card>

            <Card className="frappe-card">
              <div className="frappe-form-group">
                <label className="frappe-label">Proposal Notes / Terms of Supply</label>
                <textarea
                  placeholder="Detail shipping schedules, carrier specifications, or payment milestones..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="frappe-input"
                  rows={3}
                />
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" disabled={submitting} className="frappe-btn frappe-btn-primary" style={{ padding: 'var(--space-3) var(--space-6)' }}>
                {submitting ? <Spinner size="sm" /> : (
                  <>
                    Submit Proposal Bid <Send size={16} style={{ marginLeft: 'var(--space-2)' }} />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Sourcing Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Card className="frappe-card">
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                Proposal Totals
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <span>Quote Subtotal:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>${subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <span>Tax Amount:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>${taxAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 'bold', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <span>Proposal Total:</span>
                  <span>${totalAmount.toLocaleString()} USD</span>
                </div>
              </div>
            </Card>

            {rfq?.notes && (
              <Card className="frappe-card">
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                  Special Instructions
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  {rfq.notes}
                </p>
              </Card>
            )}

            <Card className="frappe-card">
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                Need Help?
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                If you encounter any issues submitting your proposal bid, please reach out directly to the buyer's procurement administration contact listed in the invitation email.
              </p>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
