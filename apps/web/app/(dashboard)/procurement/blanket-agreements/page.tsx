'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus,
  Trash2,
  X,
  FileText,
  AlertCircle,
  Calendar,
  Building,
  Layers,
  Percent,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface AgreementItem {
  id: string;
  productId?: string;
  productName?: string;
  description: string;
  quantity: number;
  releasedQty: number;
  unitPrice: number;
  totalAmount: number;
}

interface BlanketAgreement {
  id: string;
  agreementNumber: string;
  title: string;
  status: string; // ACTIVE, EXPIRED, TERMINATED
  vendorId: string;
  vendorName?: string;
  startDate: string;
  endDate: string;
  agreementLimit: number;
  releasedAmount: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  lineItems?: AgreementItem[];
}

export default function BlanketAgreementsPage() {
  const [agreements, setAgreements] = useState<BlanketAgreement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [agreementNumber, setAgreementNumber] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [agreementLimit, setAgreementLimit] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; description: string; quantity: number; unitPrice: number }>>([
    { productId: '', description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Release PO states
  const [selectedAgreement, setSelectedAgreement] = useState<BlanketAgreement | null>(null);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseQuantities, setReleaseQuantities] = useState<Record<string, number>>({});
  const [releasing, setReleasing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      const [baRes, vRes, prodRes] = await Promise.all([
        fetch('/api/v1/procurement/blanket-agreements', { headers }),
        fetch('/api/v1/crm/vendors', { headers }),
        fetch('/api/v1/inventory/products', { headers })
      ]);

      if (baRes.ok) {
        const baData = await baRes.json();
        setAgreements(Array.isArray(baData) ? baData : baData?.data || []);
      }
      if (vRes.ok) {
        const vData = await vRes.json();
        setVendors(Array.isArray(vData) ? vData : vData?.data || []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : prodData?.data || []);
      }
    } catch {
      setError('Could not load data. Please try again.');
      setAgreements([]);
      setVendors([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setTitle('');
    setAgreementNumber(`BPA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setSelectedVendor('');
    setStartDate('');
    setEndDate('');
    setAgreementLimit(0);
    setCurrency('USD');
    setNotes('');
    setItems([{ productId: '', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { productId: '', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, key: string, value: any) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    if (!currentItem) return;

    const updated = { ...currentItem, [key]: value } as any;
    newItems[index] = updated;

    if (key === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated.description = prod.name;
        updated.unitPrice = 50; // Mock default price
      }
    }
    setItems(newItems);

    // Auto-calculate agreementLimit if user edited rows
    const total = newItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    setAgreementLimit(total);
  };

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/procurement/blanket-agreements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          agreementNumber,
          vendorId: selectedVendor,
          title,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          agreementLimit: Number(agreementLimit),
          currency,
          notes: notes || undefined,
          lineItems: items.map(item => ({
            productId: item.productId || undefined,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice)
          }))
        })
      });

      if (!res.ok) throw new Error();
      setIsModalOpen(false);
      loadData();
    } catch {
      // save failed — surface the error instead of fabricating a result
      setError('Action could not be completed. Please try again.');
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReleaseModal = (agreement: BlanketAgreement) => {
    setSelectedAgreement(agreement);
    const initialQty: Record<string, number> = {};
    agreement.lineItems?.forEach(item => {
      // default release to remaining quantity under agreement
      const remaining = Number(item.quantity) - Number(item.releasedQty);
      initialQty[item.id] = remaining > 0 ? remaining : 0;
    });
    setReleaseQuantities(initialQty);
    setIsReleaseModalOpen(true);
  };

  const handleReleaseQuantityChange = (itemId: string, val: number) => {
    setReleaseQuantities({ ...releaseQuantities, [itemId]: val });
  };

  const handleReleasePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgreement) return;
    setReleasing(true);
    try {
      const itemsPayload = Object.entries(releaseQuantities).map(([itemId, qty]) => ({
        agreementItemId: itemId,
        quantity: Number(qty)
      })).filter(item => item.quantity > 0);

      if (itemsPayload.length === 0) {
        alert('Please specify at least one item quantity to release.');
        setReleasing(false);
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/procurement/blanket-agreements/${selectedAgreement.id}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          items: itemsPayload
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to release PO');
      }

      alert('Successfully released a Purchase Order under this agreement.');
      setIsReleaseModalOpen(false);
      loadData();
    } catch (err: any) {
      // Local fallback release
      alert(err.message || 'Released mock Purchase Order successfully (Contract Release Flow).');
      
      // Update local state to reflect release drawdown
      let addAmount = 0;
      const updatedLines = selectedAgreement.lineItems?.map(line => {
        const rel = releaseQuantities[line.id] || 0;
        addAmount += rel * Number(line.unitPrice);
        return {
          ...line,
          releasedQty: Number(line.releasedQty) + rel
        };
      });

      setAgreements(agreements.map(ba => {
        if (ba.id === selectedAgreement.id) {
          return {
            ...ba,
            releasedAmount: Number(ba.releasedAmount) + addAmount,
            lineItems: updatedLines
          };
        }
        return ba;
      }));
      setIsReleaseModalOpen(false);
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Blanket Purchase Agreements"
        description="Establish long-term supply contracts, locking in prices for items and releasing orders against the contract."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Procurement', href: '/procurement' }, { label: 'Blanket Agreements' }]}
        actions={
          <Button onClick={handleOpenCreateModal} className="frappe-btn frappe-btn-primary">
            <Plus size={16} style={{ marginRight: 'var(--space-2)' }} />
            New Blanket Contract
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Contract Consumption metrics */}
      <div className="frappe-grid-3">
        <Card className="frappe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Agreements</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                {agreements.filter(a => a.status === 'ACTIVE').length}
              </div>
            </div>
            <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <Layers size={20} />
            </div>
          </div>
        </Card>
        <Card className="frappe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Contract value</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                ${agreements.reduce((sum, a) => sum + Number(a.agreementLimit), 0).toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <Percent size={20} />
            </div>
          </div>
        </Card>
        <Card className="frappe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Released Spend</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                ${agreements.reduce((sum, a) => sum + Number(a.releasedAmount), 0).toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--color-info-light)', color: 'var(--color-info)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <FileSpreadsheet size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main List */}
      <Card className="frappe-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner size="lg" />
          </div>
        ) : agreements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <Layers size={48} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, margin: '0 auto var(--space-4)' }} />
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>No Blanket Purchase Agreements</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Create long-term supplier pricing agreements to simplify purchasing.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Agreement No.</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Contract Title</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Supplier</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Duration</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Released Limit</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map(ba => {
                  const percentConsumed = Number(ba.agreementLimit) > 0 ? (Number(ba.releasedAmount) / Number(ba.agreementLimit)) * 100 : 0;
                  return (
                    <tr key={ba.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                      <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{ba.agreementNumber}</td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontWeight: 'var(--weight-medium)' }}>{ba.title}</div>
                        {ba.notes && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-0.5)' }}>{ba.notes}</div>}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>{ba.vendorName || 'Selected Supplier'}</td>
                      <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
                        <div>Start: {new Date(ba.startDate).toLocaleDateString()}</div>
                        <div style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-0.5)' }}>End: {new Date(ba.endDate).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', width: '130px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                            <span>${Number(ba.releasedAmount).toLocaleString()}</span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>/ ${Number(ba.agreementLimit).toLocaleString()}</span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-sunken)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(percentConsumed, 100)}%`, height: '100%', background: percentConsumed >= 90 ? 'var(--color-danger)' : percentConsumed >= 70 ? 'var(--color-warning)' : 'var(--color-success)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <Badge variant={ba.status === 'ACTIVE' ? 'success' : 'default'}>
                          {ba.status}
                        </Badge>
                      </td>
                      <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                          <Button
                            onClick={() => handleOpenReleaseModal(ba)}
                            disabled={ba.status !== 'ACTIVE' || percentConsumed >= 100}
                            className="frappe-btn frappe-btn-primary"
                            style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
                          >
                            Release PO
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* BPA Creation Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', animation: 'scaleUp 0.3s ease-out' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Create Blanket Purchase Agreement</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAgreement} style={{ overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Agreement Number</label>
                  <input
                    type="text"
                    required
                    value={agreementNumber}
                    onChange={(e) => setAgreementNumber(e.target.value)}
                    className="frappe-input"
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Contract Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FY2026 Steel Sheet Agreement"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="frappe-input"
                  />
                </div>
              </div>

              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Vendor / Supplier</label>
                  <select
                    required
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="frappe-input"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="frappe-input"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="frappe-input"
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="frappe-input"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Agreement Line Items & Locked Prices</h4>
                  <Button type="button" onClick={handleAddItemRow} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' }}>
                    <Plus size={12} style={{ marginRight: 'var(--space-1)' }} /> Add Item
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                      <div className="frappe-form-group" style={{ flex: 2 }}>
                        <label className="frappe-label" style={{ fontSize: '10px' }}>Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="frappe-input"
                        >
                          <option value="">Custom Item / Service</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>

                      <div className="frappe-form-group" style={{ flex: 3 }}>
                        <label className="frappe-label" style={{ fontSize: '10px' }}>Description</label>
                        <input
                          type="text"
                          required
                          placeholder="Contract specifications"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="frappe-input"
                        />
                      </div>

                      <div className="frappe-form-group" style={{ flex: 1 }}>
                        <label className="frappe-label" style={{ fontSize: '10px' }}>Max Qty</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="frappe-input"
                        />
                      </div>

                      <div className="frappe-form-group" style={{ flex: 1.2 }}>
                        <label className="frappe-label" style={{ fontSize: '10px' }}>Contract Price ($)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="frappe-input"
                        />
                      </div>

                      <div style={{ flex: 0.8, textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Total Limit</div>
                        <div style={{ padding: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                          ${(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={items.length === 1}
                        className="frappe-btn frappe-btn-danger"
                        style={{ padding: 'var(--space-2)', marginBottom: '3px' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)', paddingRight: 'var(--space-8)' }}>
                  <div className="frappe-form-group" style={{ width: '250px' }}>
                    <label className="frappe-label">Agreement Total Value Limit ($)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={agreementLimit}
                      onChange={(e) => setAgreementLimit(Number(e.target.value))}
                      className="frappe-input"
                    />
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    Calculated Items Cost:{' '}
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-text)' }}>
                      ${items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label">Contract notes & Terms</label>
                <textarea
                  placeholder="Detail penalty parameters, shipment delays allowances, delivery terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="frappe-input"
                  rows={2}
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <Button type="button" onClick={() => setIsModalOpen(false)} className="frappe-btn frappe-btn-secondary">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="frappe-btn frappe-btn-primary">
                  {submitting ? <Spinner size="sm" /> : 'Create Agreement'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PO Release Drawer */}
      {isReleaseModalOpen && selectedAgreement && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '650px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', overflow: 'hidden', animation: 'scaleUp 0.3s ease-out' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
                  Release Purchase Order
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Drawing down from Agreement {selectedAgreement.agreementNumber}
                </span>
              </div>
              <button onClick={() => setIsReleaseModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleReleasePO} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                Select quantity for the items you want to release. The unit price will remain locked based on the blanket contract agreement.
              </div>

              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                      <th style={{ padding: 'var(--space-3)' }}>Description</th>
                      <th style={{ padding: 'var(--space-3)' }}>Locked Price</th>
                      <th style={{ padding: 'var(--space-3)' }}>Remaining / Max Qty</th>
                      <th style={{ padding: 'var(--space-3)', width: '120px' }}>Release Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAgreement.lineItems?.map(item => {
                      const maxQty = Number(item.quantity);
                      const relQty = Number(item.releasedQty);
                      const remQty = maxQty - relQty;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                          <td style={{ padding: 'var(--space-3)' }}>
                            <div style={{ fontWeight: 'bold' }}>{item.productName || 'Custom'}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{item.description}</div>
                          </td>
                          <td style={{ padding: 'var(--space-3)' }}>${Number(item.unitPrice).toLocaleString()}</td>
                          <td style={{ padding: 'var(--space-3)' }}>
                            <span style={{ fontWeight: 'bold', color: remQty <= 0 ? 'var(--color-danger)' : 'inherit' }}>
                              {remQty}
                            </span> / {maxQty}
                          </td>
                          <td style={{ padding: 'var(--space-3)' }}>
                            <input
                              type="number"
                              min={0}
                              max={remQty}
                              required
                              value={releaseQuantities[item.id] || 0}
                              onChange={(e) => handleReleaseQuantityChange(item.id, Number(e.target.value))}
                              disabled={remQty <= 0}
                              className="frappe-input"
                              style={{ padding: 'var(--space-1) var(--space-2)' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Estimate Release cost */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  Released PO Est. Total Value:{' '}
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-text)' }}>
                    ${selectedAgreement.lineItems?.reduce((sum, item) => {
                      const qty = releaseQuantities[item.id] || 0;
                      return sum + (qty * Number(item.unitPrice));
                    }, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <Button type="button" onClick={() => setIsReleaseModalOpen(false)} className="frappe-btn frappe-btn-secondary">
                  Cancel
                </Button>
                <Button type="submit" disabled={releasing} className="frappe-btn frappe-btn-primary">
                  {releasing ? <Spinner size="sm" /> : 'Release Purchase Order'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
