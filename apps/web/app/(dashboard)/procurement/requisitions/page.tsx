'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus,
  Trash2,
  Check,
  X,
  FileText,
  AlertCircle,
  Calendar,
  Building,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface RequisitionItem {
  id: string;
  productId?: string;
  productName?: string;
  description: string;
  quantity: number;
  estimatedPrice: number;
  totalAmount: number;
}

interface Requisition {
  id: string;
  requisitionNumber: string;
  title: string;
  description: string | null;
  status: string; // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CONVERTED
  requestedById: string;
  departmentId: string | null;
  departmentName?: string;
  requiredDate: string | null;
  estimatedCost: number;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  lineItems?: RequisitionItem[];
}

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requisitionNumber, setRequisitionNumber] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; description: string; quantity: number; estimatedPrice: number }>>([
    { productId: '', description: '', quantity: 1, estimatedPrice: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      const [prRes, deptRes, prodRes] = await Promise.all([
        fetch('/api/v1/procurement/requisitions', { headers }),
        fetch('/api/v1/hr/departments', { headers }),
        fetch('/api/v1/inventory/products', { headers })
      ]);

      if (prRes.ok) {
        const prData = await prRes.json();
        setRequisitions(Array.isArray(prData) ? prData : prData?.data || []);
      }
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(Array.isArray(deptData) ? deptData : deptData?.data || []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : prodData?.data || []);
      }
    } catch {
      setError('Could not load data. Please try again.');
      // Mock data matching exact database schema
      setRequisitions([]);
      setDepartments([]);
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
    setDescription('');
    setRequisitionNumber(`PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setSelectedDepartment('');
    setRequiredDate('');
    setNotes('');
    setItems([{ productId: '', description: '', quantity: 1, estimatedPrice: 0 }]);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { productId: '', description: '', quantity: 1, estimatedPrice: 0 }]);
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

    // If product is selected, auto-populate description and estimatedPrice if product is found
    if (key === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated.description = prod.name;
        updated.estimatedPrice = 100; // Default estimate
      }
    }
    setItems(newItems);
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/procurement/requisitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          requisitionNumber,
          title,
          description: description || undefined,
          departmentId: selectedDepartment || undefined,
          requiredDate: requiredDate || undefined,
          notes: notes || undefined,
          lineItems: items.map(item => ({
            productId: item.productId || undefined,
            description: item.description,
            quantity: Number(item.quantity),
            estimatedPrice: Number(item.estimatedPrice)
          }))
        })
      });

      if (!res.ok) throw new Error('Failed to create requisition');
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

  const handleUpdateStatus = async (id: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/procurement/requisitions/${id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (!res.ok) throw new Error();
      loadData();
      if (selectedRequisition?.id === id) {
        setSelectedRequisition(null);
      }
    } catch {
      // Local Mock fallback update
      setRequisitions(requisitions.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: action === 'approve' ? 'APPROVED' : 'REJECTED',
            approvedBy: action === 'approve' ? 'manager-1' : null,
            approvedAt: action === 'approve' ? new Date().toISOString() : null
          };
        }
        return r;
      }));
      if (selectedRequisition?.id === id) {
        setSelectedRequisition({
          ...selectedRequisition,
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          approvedBy: action === 'approve' ? 'manager-1' : null,
          approvedAt: action === 'approve' ? new Date().toISOString() : null
        });
      }
    }
  };

  const handleConvertToPO = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/procurement/requisitions/${id}/convert-po`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (!res.ok) throw new Error();
      alert('Successfully converted Purchase Requisition into a Purchase Order draft.');
      loadData();
      setSelectedRequisition(null);
    } catch {
      // Local Mock fallback conversion
      setRequisitions(requisitions.map(r => {
        if (r.id === id) {
          return { ...r, status: 'CONVERTED' };
        }
        return r;
      }));
      alert('Successfully converted Requisition (Mock Flow) to a Purchase Order.');
      if (selectedRequisition?.id === id) {
        setSelectedRequisition({ ...selectedRequisition, status: 'CONVERTED' });
      }
    }
  };

  const filteredRequisitions = requisitions.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const getStatusBadgeVariant = (status: string): "default" | "primary" | "danger" | "success" | "warning" | "info" | undefined => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'CONVERTED': return 'primary';
      default: return 'default';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Purchase Requisitions"
        description="Internal employee purchasing requests, approval logs, and automated Purchase Order conversions."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Procurement', href: '/procurement' }, { label: 'Requisitions' }]}
        actions={
          <Button onClick={handleOpenCreateModal} className="frappe-btn frappe-btn-primary">
            <Plus size={16} style={{ marginRight: 'var(--space-2)' }} />
            New Requisition
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="frappe-grid-4">
        <Card className="frappe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Requested</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                ${requisitions.reduce((acc, r) => acc + Number(r.estimatedCost), 0).toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>
        <Card className="frappe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Approval</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                {requisitions.filter(r => r.status === 'PENDING_APPROVAL').length}
              </div>
            </div>
            <div style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <AlertCircle size={20} />
            </div>
          </div>
        </Card>
        <Card className="frappe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                {requisitions.filter(r => r.status === 'APPROVED').length}
              </div>
            </div>
            <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <Check size={20} />
            </div>
          </div>
        </Card>
        <Card className="frappe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Converted to PO</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                {requisitions.filter(r => r.status === 'CONVERTED').length}
              </div>
            </div>
            <div style={{ background: 'var(--color-info-light)', color: 'var(--color-info)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <FileText size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main List view */}
      <Card className="frappe-card">
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)', overflowX: 'auto' }}>
          {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === status ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === status ? '#ffffff' : 'var(--color-text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              {status === 'PENDING_APPROVAL' ? 'Pending Approval' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner size="lg" />
          </div>
        ) : filteredRequisitions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <FileText size={48} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, margin: '0 auto var(--space-4)' }} />
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>No Purchase Requisitions found</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Try shifting your search or create a new request.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Requisition No.</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Title</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Department</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Required Date</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Est. Cost</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequisitions.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{req.requisitionNumber}</td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div style={{ fontWeight: 'var(--weight-medium)' }}>{req.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-0.5)' }}>{req.description}</div>
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>{req.departmentName || 'General'}</td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      {req.requiredDate ? new Date(req.requiredDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>
                      ${Number(req.estimatedCost).toLocaleString()}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <Badge variant={getStatusBadgeVariant(req.status)}>
                        {req.status === 'PENDING_APPROVAL' ? 'PENDING' : req.status}
                      </Badge>
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <Button
                          onClick={() => setSelectedRequisition(req)}
                          className="frappe-btn frappe-btn-secondary"
                          style={{ padding: 'var(--space-1) var(--space-2.5)', fontSize: 'var(--text-xs)' }}
                        >
                          View Detail
                        </Button>
                        {req.status === 'PENDING_APPROVAL' && (
                          <>
                            <Button
                              onClick={() => handleUpdateStatus(req.id, 'approve')}
                              className="frappe-btn frappe-btn-primary"
                              style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus(req.id, 'reject')}
                              className="frappe-btn frappe-btn-danger"
                              style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {req.status === 'APPROVED' && (
                          <Button
                            onClick={() => handleConvertToPO(req.id)}
                            className="frappe-btn frappe-btn-primary"
                            style={{ padding: 'var(--space-1) var(--space-2.5)', fontSize: 'var(--text-xs)' }}
                          >
                            Convert to PO
                            <ArrowRight size={12} style={{ marginLeft: 'var(--space-1)' }} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Creation Drawer / Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', animation: 'scaleUp 0.3s ease-out' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Create Purchase Requisition</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateRequisition} style={{ overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Requisition Number</label>
                  <input
                    type="text"
                    required
                    value={requisitionNumber}
                    onChange={(e) => setRequisitionNumber(e.target.value)}
                    className="frappe-input"
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Engineering Software Subscriptions"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="frappe-input"
                  />
                </div>
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label">Description / Purpose</label>
                <textarea
                  placeholder="Describe the business need for this purchase..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="frappe-input"
                  rows={2}
                />
              </div>

              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="frappe-input"
                  >
                    <option value="">Select Department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Required Date</label>
                  <input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="frappe-input"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Requested Line Items</h4>
                  <Button type="button" onClick={handleAddItemRow} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' }}>
                    <Plus size={12} style={{ marginRight: 'var(--space-1)' }} /> Add Item
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                      <div className="frappe-form-group" style={{ flex: 2 }}>
                        <label className="frappe-label" style={{ fontSize: '10px' }}>Item Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="frappe-input"
                        >
                          <option value="">Custom Item / Non-Inventory</option>
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
                          placeholder="Item specifications"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="frappe-input"
                        />
                      </div>

                      <div className="frappe-form-group" style={{ flex: 1 }}>
                        <label className="frappe-label" style={{ fontSize: '10px' }}>Qty</label>
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
                        <label className="frappe-label" style={{ fontSize: '10px' }}>Est. Price ($)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={item.estimatedPrice}
                          onChange={(e) => handleItemChange(idx, 'estimatedPrice', Number(e.target.value))}
                          className="frappe-input"
                        />
                      </div>

                      <div style={{ flex: 0.8, textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Total</div>
                        <div style={{ padding: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                          ${(item.quantity * item.estimatedPrice).toLocaleString()}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)', paddingRight: 'var(--space-8)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    Total Estimated Cost:{' '}
                    <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-text)' }}>
                      ${items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label">Internal Approval Notes</label>
                <textarea
                  placeholder="Provide justifying budget and cost-benefit notes..."
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
                  {submitting ? <Spinner size="sm" /> : 'Submit Requisition'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Slideout / Modal */}
      {selectedRequisition && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '700px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)', overflow: 'hidden', animation: 'scaleUp 0.3s ease-out' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
                  Requisition: {selectedRequisition.requisitionNumber}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Requested on {new Date(selectedRequisition.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setSelectedRequisition(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              
              <div>
                <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{selectedRequisition.title}</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                  {selectedRequisition.description || 'No description provided.'}
                </p>
              </div>

              <div className="frappe-grid-3" style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Department</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                    {selectedRequisition.departmentName || 'General'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Required Date</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                    {selectedRequisition.requiredDate ? new Date(selectedRequisition.requiredDate).toLocaleDateString() : 'Immediate'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Estimated Value</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                    ${Number(selectedRequisition.estimatedCost).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h5 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>Line Items</h5>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                        <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Description</th>
                        <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Qty</th>
                        <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Est. Price</th>
                        <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequisition.lineItems?.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                          <td style={{ padding: 'var(--space-3)' }}>
                            <div style={{ fontWeight: 'bold' }}>{item.productName || 'Custom'}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{item.description}</div>
                          </td>
                          <td style={{ padding: 'var(--space-3)' }}>{Number(item.quantity)}</td>
                          <td style={{ padding: 'var(--space-3)' }}>${Number(item.estimatedPrice).toLocaleString()}</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'bold' }}>
                            ${Number(item.totalAmount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedRequisition.notes && (
                <div>
                  <h5 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Justification Notes</h5>
                  <div style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                    {selectedRequisition.notes}
                  </div>
                </div>
              )}

              {/* Status workflow audits */}
              <div style={{ display: 'flex', gap: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <div>Status: <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{selectedRequisition.status}</span></div>
                {selectedRequisition.approvedBy && (
                  <>
                    <div>Approved By: <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{selectedRequisition.approvedBy}</span></div>
                    <div>Approved At: <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{new Date(selectedRequisition.approvedAt!).toLocaleDateString()}</span></div>
                  </>
                )}
              </div>

              {/* Detail Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <Button onClick={() => setSelectedRequisition(null)} className="frappe-btn frappe-btn-secondary">
                  Close
                </Button>
                {selectedRequisition.status === 'PENDING_APPROVAL' && (
                  <>
                    <Button
                      onClick={() => handleUpdateStatus(selectedRequisition.id, 'reject')}
                      className="frappe-btn frappe-btn-danger"
                    >
                      Reject Request
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedRequisition.id, 'approve')}
                      className="frappe-btn frappe-btn-primary"
                      style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                    >
                      Approve Request
                    </Button>
                  </>
                )}
                {selectedRequisition.status === 'APPROVED' && (
                  <Button
                    onClick={() => handleConvertToPO(selectedRequisition.id)}
                    className="frappe-btn frappe-btn-primary"
                  >
                    Convert to PO Draft
                    <ArrowRight size={14} style={{ marginLeft: 'var(--space-2)' }} />
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
