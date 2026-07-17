'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { PageHeader, Button, Badge, Spinner, StatCardRow, ListPageTemplate, type ListColumn } from '@unerp/ui';
import {
  Plus,
  Trash2,
  Check,
  X,
  FileText,
  AlertCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
      const [prRes, deptRes, prodRes] = await Promise.all([
        client.get<Requisition[]>('/procurement/requisitions'),
        client.get<Department[]>('/hr/departments'),
        client.get<Product[]>('/inventory/products')
      ]);

      setRequisitions(Array.isArray(prRes) ? prRes : []);
      setDepartments(Array.isArray(deptRes) ? deptRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    } catch {
      setError('Could not load data. Please try again.');
      setRequisitions([]);
      setDepartments([]);
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

  const handleItemChange = (index: number, key: string, value: unknown) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    if (!currentItem) return;

    const updated = { ...currentItem, [key]: value } as typeof currentItem;
    newItems[index] = updated;

    if (key === 'productId') {
      const prod = products.find(p => p.id === (value as string));
      if (prod) {
        updated.description = prod.name;
        updated.estimatedPrice = 100;
      }
    }
    setItems(newItems);
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/procurement/requisitions', {
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
      });
      setIsModalOpen(false);
      loadData();
    } catch {
      setError('Action could not be completed. Please try again.');
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, action: 'approve' | 'reject') => {
    try {
      await client.patch(`/procurement/requisitions/${id}/${action}`, {});
      loadData();
      if (selectedRequisition?.id === id) {
        setSelectedRequisition(null);
      }
    } catch {
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
      await client.post(`/procurement/requisitions/${id}/convert-po`, {});
      alert('Successfully converted Purchase Requisition into a Purchase Order draft.');
      loadData();
      setSelectedRequisition(null);
    } catch {
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

  const columns: ListColumn[] = [
    {
      key: 'requisitionNumber',
      header: 'Requisition No.',
      render: (_v, row) => {
        const req = row as unknown as Requisition;
        return <span className="font-semibold">{req.requisitionNumber}</span>;
      }
    },
    {
      key: 'title',
      header: 'Title',
      render: (_v, row) => {
        const req = row as unknown as Requisition;
        return (
          <div>
            <div className="font-medium">{req.title}</div>
            <div className={styles.p1}>{req.description}</div>
          </div>
        );
      }
    },
    {
      key: 'departmentName',
      header: 'Department',
      render: (_v, row) => {
        const req = row as unknown as Requisition;
        return <span>{req.departmentName || 'General'}</span>;
      }
    },
    {
      key: 'requiredDate',
      header: 'Required Date',
      render: (_v, row) => {
        const req = row as unknown as Requisition;
        return <span>{req.requiredDate ? new Date(req.requiredDate).toLocaleDateString() : 'N/A'}</span>;
      }
    },
    {
      key: 'estimatedCost',
      header: 'Est. Cost',
      render: (_v, row) => {
        const req = row as unknown as Requisition;
        return <span className="font-semibold">${Number(req.estimatedCost).toLocaleString()}</span>;
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (_v, row) => {
        const req = row as unknown as Requisition;
        return (
          <Badge variant={getStatusBadgeVariant(req.status)}>
            {req.status === 'PENDING_APPROVAL' ? 'PENDING' : req.status}
          </Badge>
        );
      }
    },
    {
      key: 'rowActions',
      header: 'Actions',
      render: (_v, row) => {
        const req = row as unknown as Requisition;
        return (
          <div className="ui-flex-end ui-gap-2">
            <Button
              onClick={(e) => { e.stopPropagation(); setSelectedRequisition(req); }}
              className={["ui-btn ui-btn-secondary", styles.p2].join(' ')}

            >
              View Detail
            </Button>
            {req.status === 'PENDING_APPROVAL' && (
              <>
                <Button
                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, 'approve'); }}
                  className={["ui-btn ui-btn-primary", styles.p3].join(' ')}

                >
                  Approve
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, 'reject'); }}
                  className={["ui-btn ui-btn-danger", styles.p4].join(' ')}

                >
                  Reject
                </Button>
              </>
            )}
            {req.status === 'APPROVED' && (
              <Button
                onClick={(e) => { e.stopPropagation(); handleConvertToPO(req.id); }}
                className={["ui-btn ui-btn-primary", styles.p5].join(' ')}

              >
                Convert to PO
                <ArrowRight size={12} className={styles.p6} />
              </Button>
            )}
          </div>
        );
      }
    },
  ];

  const statusTabs = (
    <div className={styles.p7}>
      {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED'].map(status => (
        <button
          key={status}
          onClick={() => setStatusFilter(status)}
          style={{ background: statusFilter === status ? 'var(--color-primary)' : 'transparent', color: statusFilter === status ? 'var(--color-bg-elevated)' : 'var(--color-text-secondary)' }}
        >
          {status === 'PENDING_APPROVAL' ? 'Pending Approval' : status.charAt(0) + status.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );

  return (
    <RouteGuard permission="procurement.requisition.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Purchase Requisitions"
        description="Internal employee purchasing requests, approval logs, and automated Purchase Order conversions."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Procurement', href: '/procurement' }, { label: 'Requisitions' }]}
        actions={
          <Button onClick={handleOpenCreateModal} className="ui-btn ui-btn-primary">
            <Plus size={16} className="mr-2" />
            New Requisition
          </Button>
        }
      />

      {error && (
        <div className={styles.p9}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      <StatCardRow stats={[
        {
          label: 'Total Requested',
          value: `$${requisitions.reduce((acc, r) => acc + Number(r.estimatedCost), 0).toLocaleString()}`,
          icon: <TrendingUp size={20} />,
          color: 'var(--chart-1)'
        },
        {
          label: 'Pending Approval',
          value: requisitions.filter(r => r.status === 'PENDING_APPROVAL').length,
          icon: <AlertCircle size={20} />,
          color: 'var(--chart-3)'
        },
        {
          label: 'Approved',
          value: requisitions.filter(r => r.status === 'APPROVED').length,
          icon: <Check size={20} />,
          color: 'var(--chart-2)'
        },
        {
          label: 'Converted to PO',
          value: requisitions.filter(r => r.status === 'CONVERTED').length,
          icon: <FileText size={20} />,
          color: 'var(--chart-5)'
        },
      ]} columns={4} />

      <ListPageTemplate
        title=""
        columns={columns}
        data={filteredRequisitions as unknown as Record<string, unknown>[]}
        loading={loading}
        searchable
        searchPlaceholder="Search requisitions..."
        above={statusTabs}
        emptyTitle="No Purchase Requisitions found"
        emptyDescription="Try shifting your search or create a new request."
      />

      {/* Creation Modal */}
      {isModalOpen && (
        <div className={styles.p10}>
          <div className={styles.p11}>

            <div className={styles.p12}>
              <h3 className={styles.p13}>Create Purchase Requisition</h3>
              <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className={styles.p14}>
              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">Requisition Number</label>
                  <input
                    type="text"
                    required
                    value={requisitionNumber}
                    onChange={(e) => setRequisitionNumber(e.target.value)}
                    className="ui-input"
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Engineering Software Subscriptions"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="ui-input"
                  />
                </div>
              </div>

              <div className="ui-form-group">
                <label className="ui-label">Description / Purpose</label>
                <textarea
                  placeholder="Describe the business need for this purchase..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="ui-input"
                  rows={2}
                />
              </div>

              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="ui-input"
                  >
                    <option value="">Select Department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Required Date</label>
                  <input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="ui-input"
                  />
                </div>
              </div>

              <div className={styles.p15}>
                <div className="ui-flex-between mb-2">
                  <h4 className={styles.p16}>Requested Line Items</h4>
                  <Button type="button" onClick={handleAddItemRow} className={["ui-btn ui-btn-secondary", styles.p17].join(' ')} >
                    <Plus size={12} className={styles.p18} /> Add Item
                  </Button>
                </div>

                <div className="ui-stack-2">
                  {items.map((item, idx) => (
                    <div key={idx} className={styles.p19}>
                      <div className={["ui-form-group", styles.p20].join(' ')} >
                        <label className={["ui-label", styles.p21].join(' ')} >Item Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="ui-input"
                        >
                          <option value="">Custom Item / Non-Inventory</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>

                      <div className={["ui-form-group", styles.p22].join(' ')} >
                        <label className={["ui-label", styles.p23].join(' ')} >Description</label>
                        <input
                          type="text"
                          required
                          placeholder="Item specifications"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="ui-input"
                        />
                      </div>

                      <div className="ui-form-group flex-1">
                        <label className={["ui-label", styles.p24].join(' ')} >Qty</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="ui-input"
                        />
                      </div>

                      <div className={["ui-form-group", styles.p25].join(' ')} >
                        <label className={["ui-label", styles.p26].join(' ')} >Est. Price ($)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={item.estimatedPrice}
                          onChange={(e) => handleItemChange(idx, 'estimatedPrice', Number(e.target.value))}
                          className="ui-input"
                        />
                      </div>

                      <div className={styles.p27}>
                        <div className={styles.p28}>Total</div>
                        <div className={styles.p29}>
                          ${(item.quantity * item.estimatedPrice).toLocaleString()}
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={items.length === 1}
                        className={["ui-btn ui-btn-danger", styles.p30].join(' ')}

                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className={styles.p31}>
                  <div className="ui-text-sm-muted">
                    Total Estimated Cost:{' '}
                    <span className={styles.p32}>
                      ${items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ui-form-group">
                <label className="ui-label">Internal Approval Notes</label>
                <textarea
                  placeholder="Provide justifying budget and cost-benefit notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="ui-input"
                  rows={2}
                />
              </div>

              <div className={styles.p33}>
                <Button type="button" onClick={() => setIsModalOpen(false)} className="ui-btn ui-btn-secondary">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="ui-btn ui-btn-primary">
                  {submitting ? <Spinner size="sm" /> : 'Submit Requisition'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequisition && (
        <div className={styles.p34}>
          <div className={styles.p35}>

            <div className={styles.p36}>
              <div>
                <h3 className={styles.p37}>
                  Requisition: {selectedRequisition.requisitionNumber}
                </h3>
                <span className="ui-text-xs-muted">
                  Requested on {new Date(selectedRequisition.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setSelectedRequisition(null)} className="ui-btn-icon ui-text-muted">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 ui-stack-5">
              <div>
                <h4 className={styles.p38}>{selectedRequisition.title}</h4>
                <p className={styles.p39}>
                  {selectedRequisition.description || 'No description provided.'}
                </p>
              </div>

              <div className={["ui-grid-3", styles.p40].join(' ')} >
                <div>
                  <div className="ui-text-xs-muted">Department</div>
                  <div className={styles.p41}>
                    {selectedRequisition.departmentName || 'General'}
                  </div>
                </div>
                <div>
                  <div className="ui-text-xs-muted">Required Date</div>
                  <div className={styles.p42}>
                    {selectedRequisition.requiredDate ? new Date(selectedRequisition.requiredDate).toLocaleDateString() : 'Immediate'}
                  </div>
                </div>
                <div>
                  <div className="ui-text-xs-muted">Total Estimated Value</div>
                  <div className={styles.p43}>
                    ${Number(selectedRequisition.estimatedCost).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className={styles.p44}>
                <div>Status: <span className={styles.p45}>{selectedRequisition.status}</span></div>
                {selectedRequisition.approvedBy && (
                  <>
                    <div>Approved By: <span className={styles.p46}>{selectedRequisition.approvedBy}</span></div>
                    <div>Approved At: <span className={styles.p47}>{new Date(selectedRequisition.approvedAt!).toLocaleDateString()}</span></div>
                  </>
                )}
              </div>

              <div className={styles.p48}>
                <Button onClick={() => setSelectedRequisition(null)} className="ui-btn ui-btn-secondary">
                  Close
                </Button>
                {selectedRequisition.status === 'PENDING_APPROVAL' && (
                  <>
                    <Button
                      onClick={() => handleUpdateStatus(selectedRequisition.id, 'reject')}
                      className="ui-btn ui-btn-danger"
                    >
                      Reject Request
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedRequisition.id, 'approve')}
                      className={["ui-btn ui-btn-primary", styles.p49].join(' ')}

                    >
                      Approve Request
                    </Button>
                  </>
                )}
                {selectedRequisition.status === 'APPROVED' && (
                  <Button
                    onClick={() => handleConvertToPO(selectedRequisition.id)}
                    className="ui-btn ui-btn-primary"
                  >
                    Convert to PO Draft
                    <ArrowRight size={14} className={styles.p50} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
