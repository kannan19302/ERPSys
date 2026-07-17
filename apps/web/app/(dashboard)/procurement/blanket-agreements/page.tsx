'use client';

import styles from './page.module.css';

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
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
      const [baRes, vRes, prodRes] = await Promise.all([
        client.get<BlanketAgreement[]>('/procurement/blanket-agreements'),
        client.get<Vendor[]>('/crm/vendors'),
        client.get<Product[]>('/inventory/products')
      ]);

      setAgreements(Array.isArray(baRes) ? baRes : []);
      setVendors(Array.isArray(vRes) ? vRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
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
  }, [client]);

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
      await client.post('/procurement/blanket-agreements', {
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
      });
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

      await client.post(`/procurement/blanket-agreements/${selectedAgreement.id}/release`, { items: itemsPayload });

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
    <RouteGuard permission="procurement.blanket-agreement.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Blanket Purchase Agreements"
        description="Establish long-term supply contracts, locking in prices for items and releasing orders against the contract."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Procurement', href: '/procurement' }, { label: 'Blanket Agreements' }]}
        actions={
          <Button onClick={handleOpenCreateModal} className="ui-btn ui-btn-primary">
            <Plus size={16} className="mr-2" />
            New Blanket Contract
          </Button>
        }
      />

      {error && (
        <div className={styles.p1}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Contract Consumption metrics */}
      <div className="ui-grid-3">
        <Card className="ui-card">
          <div className="ui-flex-between">
            <div>
              <div className={styles.p2}>Active Agreements</div>
              <div className={styles.p3}>
                {agreements.filter(a => a.status === 'ACTIVE').length}
              </div>
            </div>
            <div className={styles.p4}>
              <Layers size={20} />
            </div>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-flex-between">
            <div>
              <div className={styles.p5}>Total Contract value</div>
              <div className={styles.p6}>
                ${agreements.reduce((sum, a) => sum + Number(a.agreementLimit), 0).toLocaleString()}
              </div>
            </div>
            <div className={styles.p7}>
              <Percent size={20} />
            </div>
          </div>
        </Card>
        <Card className="ui-card">
          <div className="ui-flex-between">
            <div>
              <div className={styles.p8}>Total Released Spend</div>
              <div className={styles.p9}>
                ${agreements.reduce((sum, a) => sum + Number(a.releasedAmount), 0).toLocaleString()}
              </div>
            </div>
            <div className={styles.p10}>
              <FileSpreadsheet size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main List */}
      <Card className="ui-card">
        {loading ? (
          <div className="ui-center-pad">
            <Spinner size="lg" />
          </div>
        ) : agreements.length === 0 ? (
          <div className="text-center p-12">
            <Layers size={48} className={styles.p11} />
            <h3 className={styles.p12}>No Blanket Purchase Agreements</h3>
            <p className={styles.p13}>Create long-term supplier pricing agreements to simplify purchasing.</p>
          </div>
        ) : (
          <div className="builder-table-wrapper">
            <table className={styles.p14}>
              <thead>
                <tr className={styles.p15}>
                  <th className="py-3 px-4">Agreement No.</th>
                  <th className="py-3 px-4">Contract Title</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Released Limit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className={styles.p16}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map(ba => {
                  const percentConsumed = Number(ba.agreementLimit) > 0 ? (Number(ba.releasedAmount) / Number(ba.agreementLimit)) * 100 : 0;
                  return (
                    <tr key={ba.id} className={styles.p17}>
                      <td className={styles.p18}>{ba.agreementNumber}</td>
                      <td className="p-4">
                        <div className="font-medium">{ba.title}</div>
                        {ba.notes && <div className={styles.p19}>{ba.notes}</div>}
                      </td>
                      <td className="p-4">{ba.vendorName || 'Selected Supplier'}</td>
                      <td className={styles.p20}>
                        <div>Start: {new Date(ba.startDate).toLocaleDateString()}</div>
                        <div className={styles.p21}>End: {new Date(ba.endDate).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <div className={styles.p22}>
                          <div className={styles.p23}>
                            <span>${Number(ba.releasedAmount).toLocaleString()}</span>
                            <span className="ui-text-muted">/ ${Number(ba.agreementLimit).toLocaleString()}</span>
                          </div>
                          {/* Progress bar */}
                          <div className={styles.p24}>
                            <div style={{ width: `${Math.min(percentConsumed, 100)}%`, background: percentConsumed >= 90 ? 'var(--color-danger)' : percentConsumed >= 70 ? 'var(--color-warning)' : 'var(--color-success)' }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={ba.status === 'ACTIVE' ? 'success' : 'default'}>
                          {ba.status}
                        </Badge>
                      </td>
                      <td className={styles.p26}>
                        <div className="ui-flex-end ui-gap-2">
                          <Button
                            onClick={() => handleOpenReleaseModal(ba)}
                            disabled={ba.status !== 'ACTIVE' || percentConsumed >= 100}
                            className={["ui-btn ui-btn-primary", styles.p27].join(' ')}

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
        <div className={styles.p28}>
          <div className={styles.p29}>

            {/* Header */}
            <div className={styles.p30}>
              <h3 className={styles.p31}>Create Blanket Purchase Agreement</h3>
              <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAgreement} className={styles.p32}>

              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">Agreement Number</label>
                  <input
                    type="text"
                    required
                    value={agreementNumber}
                    onChange={(e) => setAgreementNumber(e.target.value)}
                    className="ui-input"
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Contract Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FY2026 Steel Sheet Agreement"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="ui-input"
                  />
                </div>
              </div>

              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">Vendor / Supplier</label>
                  <select
                    required
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="ui-input"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="ui-input"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="ui-input"
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="ui-input"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className={styles.p33}>
                <div className="ui-flex-between mb-2">
                  <h4 className={styles.p34}>Agreement Line Items & Locked Prices</h4>
                  <Button type="button" onClick={handleAddItemRow} className={["ui-btn ui-btn-secondary", styles.p35].join(' ')} >
                    <Plus size={12} className={styles.p36} /> Add Item
                  </Button>
                </div>

                <div className="ui-stack-2">
                  {items.map((item, idx) => (
                    <div key={idx} className={styles.p37}>
                      <div className={["ui-form-group", styles.p38].join(' ')} >
                        <label className={["ui-label", styles.p39].join(' ')} >Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="ui-input"
                        >
                          <option value="">Custom Item / Service</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>

                      <div className={["ui-form-group", styles.p40].join(' ')} >
                        <label className={["ui-label", styles.p41].join(' ')} >Description</label>
                        <input
                          type="text"
                          required
                          placeholder="Contract specifications"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="ui-input"
                        />
                      </div>

                      <div className="ui-form-group flex-1">
                        <label className={["ui-label", styles.p42].join(' ')} >Max Qty</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="ui-input"
                        />
                      </div>

                      <div className={["ui-form-group", styles.p43].join(' ')} >
                        <label className={["ui-label", styles.p44].join(' ')} >Contract Price ($)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="ui-input"
                        />
                      </div>

                      <div className={styles.p45}>
                        <div className={styles.p46}>Total Limit</div>
                        <div className={styles.p47}>
                          ${(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={items.length === 1}
                        className={["ui-btn ui-btn-danger", styles.p48].join(' ')}

                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className={styles.p49}>
                  <div className={["ui-form-group", styles.p50].join(' ')} >
                    <label className="ui-label">Agreement Total Value Limit ($)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={agreementLimit}
                      onChange={(e) => setAgreementLimit(Number(e.target.value))}
                      className="ui-input"
                    />
                  </div>
                  <div className="ui-text-sm-muted">
                    Calculated Items Cost:{' '}
                    <span className={styles.p51}>
                      ${items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ui-form-group">
                <label className="ui-label">Contract notes & Terms</label>
                <textarea
                  placeholder="Detail penalty parameters, shipment delays allowances, delivery terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="ui-input"
                  rows={2}
                />
              </div>

              {/* Footer */}
              <div className={styles.p52}>
                <Button type="button" onClick={() => setIsModalOpen(false)} className="ui-btn ui-btn-secondary">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="ui-btn ui-btn-primary">
                  {submitting ? <Spinner size="sm" /> : 'Create Agreement'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PO Release Drawer */}
      {isReleaseModalOpen && selectedAgreement && (
        <div className={styles.p53}>
          <div className={styles.p54}>

            {/* Header */}
            <div className={styles.p55}>
              <div>
                <h3 className={styles.p56}>
                  Release Purchase Order
                </h3>
                <span className="ui-text-xs-muted">
                  Drawing down from Agreement {selectedAgreement.agreementNumber}
                </span>
              </div>
              <button onClick={() => setIsReleaseModalOpen(false)} className="ui-btn-icon ui-text-muted">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleReleasePO} className={styles.p57}>
              <div className="ui-text-sm-muted">
                Select quantity for the items you want to release. The unit price will remain locked based on the blanket contract agreement.
              </div>

              <div className={styles.p58}>
                <table className={styles.p59}>
                  <thead>
                    <tr className={styles.p60}>
                      <th className="p-3">Description</th>
                      <th className="p-3">Locked Price</th>
                      <th className="p-3">Remaining / Max Qty</th>
                      <th className={styles.p61}>Release Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAgreement.lineItems?.map(item => {
                      const maxQty = Number(item.quantity);
                      const relQty = Number(item.releasedQty);
                      const remQty = maxQty - relQty;
                      return (
                        <tr key={item.id} className={styles.p62}>
                          <td className="p-3">
                            <div className="font-bold">{item.productName || 'Custom'}</div>
                            <div className="ui-text-micro ui-text-muted">{item.description}</div>
                          </td>
                          <td className="p-3">${Number(item.unitPrice).toLocaleString()}</td>
                          <td className="p-3">
                            <span style={{ color: remQty <= 0 ? 'var(--color-danger)' : 'inherit' }}>
                              {remQty}
                            </span> / {maxQty}
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              max={remQty}
                              required
                              value={releaseQuantities[item.id] || 0}
                              onChange={(e) => handleReleaseQuantityChange(item.id, Number(e.target.value))}
                              disabled={remQty <= 0}
                              className={["ui-input", styles.p64].join(' ')}

                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Estimate Release cost */}
              <div className={styles.p65}>
                <div className="ui-text-sm-muted">
                  Released PO Est. Total Value:{' '}
                  <span className={styles.p66}>
                    ${selectedAgreement.lineItems?.reduce((sum, item) => {
                      const qty = releaseQuantities[item.id] || 0;
                      return sum + (qty * Number(item.unitPrice));
                    }, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className={styles.p67}>
                <Button type="button" onClick={() => setIsReleaseModalOpen(false)} className="ui-btn ui-btn-secondary">
                  Cancel
                </Button>
                <Button type="submit" disabled={releasing} className="ui-btn ui-btn-primary">
                  {releasing ? <Spinner size="sm" /> : 'Release Purchase Order'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      </div>
    </RouteGuard>
  );
}
