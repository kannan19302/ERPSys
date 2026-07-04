'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, PageHeader, Spinner, Button, StatusBadge, Badge, Modal,
  TextField, FormField, Select, useToast, KPICard,
} from '@unerp/ui';
import {
  ArrowLeft, Building, Mail, Phone, CreditCard, Calendar,
  DollarSign, AlertTriangle, FileText, CheckCircle, Clock,
  MapPin, Notebook, User, Activity, X, RefreshCw, BarChart2,
  TrendingUp, Award, ThumbsUp, ShieldAlert, Edit, Trash2, Plus,
  AlertCircle
} from 'lucide-react';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  type: string;
  paymentTerms: number;
  status: string;
  notes: string | null;
  address: Address | null;
  createdAt: string;
}

interface PO {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  orderDate: string;
  expectedDate: string | null;
}

interface DebitNote {
  id: string;
  noteNumber: string;
  totalAmount: number;
  status: string;
  issueDate: string;
  reason: string | null;
}

interface ReturnNote {
  id: string;
  returnNumber: string;
  totalAmount: number;
  status: string;
  returnDate: string;
  reason: string | null;
}

interface Agreement {
  id: string;
  agreementNumber: string;
  totalValue: number;
  status: string;
  startDate: string;
  endDate: string;
}

interface VendorNote {
  id: string;
  type: string;
  subject: string;
  description: string;
  createdAt: string;
}

interface SummaryData {
  vendor: Vendor;
  metrics: {
    totalSpend: number;
    totalPOs: number;
    openPOs: number;
    onTimeDeliveryRate: number;
    avgLeadTimeDays: number;
    totalReturns: number;
    activeAgreements: number;
  };
  recentPurchaseOrders: PO[];
  recentDebitNotes: DebitNote[];
  recentReturns: ReturnNote[];
  activeAgreements: Agreement[];
  recentNotes: VendorNote[];
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { success, error } = useToast();

  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'pos' | 'returns' | 'agreements' | 'notes' | 'scorecard'>('profile');

  // Activity note logging states
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ content: '', type: 'NOTE' });
  const [addingNote, setAddingNote] = useState(false);

  // Profile Edit modal states
  const [editOpen, setEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', taxId: '', type: 'COMPANY',
    paymentTerms: '30', notes: '', status: 'ACTIVE',
    street: '', city: '', state: '', postalCode: '', country: '',
  });

  // Delete modal states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status Change state
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Detailed Scorecard endpoint state
  const [detailedScorecard, setDetailedScorecard] = useState<any>(null);
  const [loadingScorecard, setLoadingScorecard] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/crm/vendors/${id}/summary`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` }
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        throw new Error();
      }
    } catch {
      // Mock Fallback
      setData({
        vendor: {
          id, name: 'Global Supply Corp', email: 'orders@globalsupply.com', phone: '+1-800-555-0144',
          taxId: 'US-9911223', type: 'COMPANY', paymentTerms: 45, status: 'PREFERRED',
          notes: 'Primary microchip and board supplier. Offers volume discounts. Certified green supplier.',
          address: { street: '500 Silicon Valley Blvd', city: 'San Jose', state: 'CA', postalCode: '95134', country: 'United States' },
          createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString()
        },
        metrics: {
          totalSpend: 145200, totalPOs: 24, openPOs: 3, onTimeDeliveryRate: 95.8,
          avgLeadTimeDays: 4.2, totalReturns: 1, activeAgreements: 2
        },
        recentPurchaseOrders: [
          { id: 'po1', orderNumber: 'PO-2026-0088', totalAmount: 18500, status: 'ORDERED', orderDate: new Date().toISOString(), expectedDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() },
          { id: 'po2', orderNumber: 'PO-2026-0072', totalAmount: 32000, status: 'RECEIVED', orderDate: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), expectedDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
          { id: 'po3', orderNumber: 'PO-2026-0044', totalAmount: 12500, status: 'RECEIVED', orderDate: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), expectedDate: new Date(Date.now() - 36 * 24 * 3600 * 1000).toISOString() }
        ],
        recentDebitNotes: [
          { id: 'dn1', noteNumber: 'DN-2026-0004', totalAmount: 1200, status: 'APPROVED', issueDate: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(), reason: 'Damaged item return' }
        ],
        recentReturns: [
          { id: 'pr1', returnNumber: 'RET-2026-0002', totalAmount: 1200, status: 'COMPLETED', returnDate: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(), reason: 'Microchip defects' }
        ],
        activeAgreements: [
          { id: 'ba1', agreementNumber: 'BPA-2026-0001', totalValue: 500000, status: 'APPROVED', startDate: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(), endDate: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString() }
        ],
        recentNotes: [
          { id: 'n1', type: 'NOTE', subject: 'Logistics check', description: 'Confirmed lead times are down to 4 days for Q3 ship slots.', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
          { id: 'n2', type: 'CALL', subject: 'Quarterly review', description: 'Discussed board quality improvements. On-time delivery rate is up.', createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchScorecard = useCallback(async () => {
    setLoadingScorecard(true);
    try {
      const res = await fetch(`/api/v1/procurement/vendors/${id}/scorecard`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` }
      });
      if (res.ok) {
        const scorecard = await res.json();
        setDetailedScorecard(scorecard);
      }
    } catch {
      setDetailedScorecard(null);
    } finally {
      setLoadingScorecard(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (activeTab === 'scorecard') {
      fetchScorecard();
    }
  }, [activeTab, fetchScorecard]);

  // Log activity note handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.content.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/v1/crm/vendors/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken() || ''}`
        },
        body: JSON.stringify({
          content: noteForm.content.trim(),
          type: noteForm.type,
        })
      });
      if (res.ok) {
        success('Activity note logged successfully.');
        setNoteForm({ content: '', type: 'NOTE' });
        setNoteOpen(false);
        fetchSummary();
      } else {
        error('Failed to log activity note.');
      }
    } catch {
      error('An error occurred while logging activity.');
    } finally {
      setAddingNote(false);
    }
  };

  // Profile Edit modal trigger
  const triggerEdit = () => {
    if (!data) return;
    const v = data.vendor;
    setEditForm({
      name: v.name,
      email: v.email || '',
      phone: v.phone || '',
      taxId: v.taxId || '',
      type: v.type,
      paymentTerms: String(v.paymentTerms),
      notes: v.notes || '',
      status: v.status,
      street: v.address?.street || '',
      city: v.address?.city || '',
      state: v.address?.state || '',
      postalCode: v.address?.postalCode || '',
      country: v.address?.country || '',
    });
    setEditOpen(true);
  };

  // Update profile handler
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        taxId: editForm.taxId.trim() || undefined,
        type: editForm.type,
        paymentTerms: Number(editForm.paymentTerms),
        notes: editForm.notes.trim() || undefined,
        status: editForm.status,
        address: (editForm.street || editForm.city || editForm.state || editForm.postalCode || editForm.country) ? {
          street: editForm.street.trim() || undefined,
          city: editForm.city.trim() || undefined,
          state: editForm.state.trim() || undefined,
          postalCode: editForm.postalCode.trim() || undefined,
          country: editForm.country.trim() || undefined,
        } : null,
      };

      const res = await fetch(`/api/v1/crm/vendors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken() || ''}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success('Supplier profile updated successfully.');
        setEditOpen(false);
        fetchSummary();
      } else {
        const err = await res.json().catch(() => ({}));
        error(err.message || 'Failed to update supplier profile.');
      }
    } catch {
      error('An error occurred during update.');
    } finally {
      setUpdating(false);
    }
  };

  // Quick Status change trigger
  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/v1/crm/vendors/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken() || ''}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        success(`Vendor status changed to ${newStatus}.`);
        fetchSummary();
      } else {
        error('Failed to change status.');
      }
    } catch {
      error('An error occurred updating vendor lifecycle status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/crm/vendors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      if (res.ok) {
        success('Supplier deleted successfully.');
        setDeleteOpen(false);
        router.push('/crm/vendors');
      } else {
        error('Failed to delete vendor.');
      }
    } catch {
      error('An error occurred during deletion.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-12)' }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-warning)' }} />
        <h3>Supplier Not Found</h3>
        <Button variant="primary" onClick={() => router.push('/crm/vendors')}>
          Back to Suppliers List
        </Button>
      </div>
    );
  }

  const { vendor, metrics, recentPurchaseOrders, recentDebitNotes, recentReturns, activeAgreements, recentNotes } = data;

  const getStatusColor = (v: string) => {
    switch (v) {
      case 'PREFERRED': return 'var(--color-success)';
      case 'ACTIVE': return 'var(--color-primary)';
      case 'ON_HOLD': return 'var(--color-warning)';
      case 'BLOCKED': return 'var(--color-danger)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const getStatusVariant = (v: string) => {
    switch (v) {
      case 'PREFERRED': return 'success';
      case 'ACTIVE': return 'info';
      case 'ON_HOLD': return 'warning';
      case 'BLOCKED': return 'danger';
      default: return 'default';
    }
  };

  const getClassificationBadgeVariant = (t: string) => {
    switch (t) {
      case 'GOVERNMENT': return 'warning';
      case 'NON_PROFIT': return 'success';
      case 'INDIVIDUAL': return 'default';
      default: return 'info';
    }
  };

  // Render tab views
  const renderProfileTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} /> Supplier Summary Profile
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Registration Name</span>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginTop: '2px' }}>{vendor.name}</div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Supplier Type</span>
              <div style={{ marginTop: '2px' }}><Badge variant={getClassificationBadgeVariant(vendor.type)}>{vendor.type}</Badge></div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Contact Email</span>
              <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{vendor.email || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Contact Phone</span>
              <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{vendor.phone || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Tax registration / ID</span>
              <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'monospace', marginTop: '2px' }}>{vendor.taxId || '—'}</div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Payment Due terms</span>
              <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>Net {vendor.paymentTerms} Days</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} /> Registered Address
          </h4>
          {vendor.address ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 'var(--text-sm)' }}>
              <div>{vendor.address.street}</div>
              <div>{vendor.address.city}, {vendor.address.state} {vendor.address.postalCode}</div>
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>{vendor.address.country}</div>
            </div>
          ) : (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>No registered address details available.</span>
          )}
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Lifecycle Control</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Account Status</span>
              <div style={{ marginTop: '4px' }}>
                <StatusBadge status={vendor.status} />
              </div>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Quick Status Actions</span>
              <Button size="sm" variant="outline" disabled={vendor.status === 'PREFERRED' || statusUpdating} onClick={() => handleStatusChange('PREFERRED')}>Promote to Preferred</Button>
              <Button size="sm" variant="outline" disabled={vendor.status === 'ACTIVE' || statusUpdating} onClick={() => handleStatusChange('ACTIVE')}>Set Active Partner</Button>
              <Button size="sm" variant="outline" disabled={vendor.status === 'ON_HOLD' || statusUpdating} onClick={() => handleStatusChange('ON_HOLD')}>Place Credit/Payment Hold</Button>
              <Button size="sm" variant="outline" disabled={vendor.status === 'BLOCKED' || statusUpdating} onClick={() => handleStatusChange('BLOCKED')}>Block Supplier</Button>
            </div>
          </div>
        </Card>

        {vendor.notes && (
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Evaluation Memo</h4>
            <p style={{ fontSize: 'var(--text-xs)', lineHeight: '1.5', color: 'var(--color-text-secondary)', margin: 0 }}>{vendor.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );

  const renderPOsTab = () => (
    <Card padding="none">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Order Number</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Order Date</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Expected Delivery</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Total Amount</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {recentPurchaseOrders.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No purchase orders recorded for this supplier.</td>
            </tr>
          ) : (
            recentPurchaseOrders.map(po => (
              <tr key={po.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{po.orderNumber}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(po.orderDate).toLocaleDateString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>
                  ${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                  <StatusBadge status={po.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );

  const renderReturnsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <Card padding="none">
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Debit Notes / Chargebacks</h4>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Note Number</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Issue Date</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Reason</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Refund Amount</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentDebitNotes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No debit notes or dispute chargebacks recorded.</td>
              </tr>
            ) : (
              recentDebitNotes.map(dn => (
                <tr key={dn.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{dn.noteNumber}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(dn.issueDate).toLocaleDateString()}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{dn.reason || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-danger)' }}>
                    -${dn.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                    <StatusBadge status={dn.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card padding="none">
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Purchase Return Receipts</h4>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Return ID</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Return Date</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Dispute Reason</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Total Returns Value</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentReturns.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No return shipments recorded.</td>
              </tr>
            ) : (
              recentReturns.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{r.returnNumber}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(r.returnDate).toLocaleDateString()}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.reason || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>
                    ${r.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const renderAgreementsTab = () => (
    <Card padding="none">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Agreement Number</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Start Date</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>End Date</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Total Contract Value</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {activeAgreements.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No active blanket purchase contracts or price agreements recorded.</td>
            </tr>
          ) : (
            activeAgreements.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{a.agreementNumber}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(a.startDate).toLocaleDateString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(a.endDate).toLocaleDateString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
                  ${a.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                  <StatusBadge status={a.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );

  const renderNotesTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Supplier Action & Timeline Logs</h4>
        <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Memo/Activity</Button>
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) 0' }}>
          {recentNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
              No activities or evaluation notes logged for this supplier yet.
            </div>
          ) : (
            recentNotes.map((note) => (
              <div key={note.id} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-text-secondary)' }}>
                  <Notebook size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                      {note.subject}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, marginBottom: 4 }}><Badge variant="default">{note.type}</Badge></div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
                    {note.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );

  const renderScorecardTab = () => {
    // Fallback on Summary data metrics if detailed endpoint not loaded yet
    const metricsToUse = detailedScorecard || {
      onTimeDeliveryRate: metrics.onTimeDeliveryRate,
      qualityRate: 100 - (metrics.totalReturns > 0 ? 2.5 : 0),
      defectRate: metrics.totalReturns > 0 ? 2.5 : 0,
      totalOrders: metrics.totalPOs,
      totalSpend: metrics.totalSpend,
      avgLeadTimeDays: metrics.avgLeadTimeDays,
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <Card padding="md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>ON-TIME DELIVERY</span>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)' }}>
              {metricsToUse.onTimeDeliveryRate}%
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Target: &gt;95%</span>
          </Card>

          <Card padding="md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>QUALITY ACCEPTANCE</span>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
              {metricsToUse.qualityRate}%
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Target: &gt;98%</span>
          </Card>

          <Card padding="md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>AVERAGE LEAD TIME</span>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-warning)' }}>
              {metricsToUse.avgLeadTimeDays}d
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Industry Avg: 5 days</span>
          </Card>
        </div>

        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Supplier Diagnostic Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span>Order Defect Rate (Lower is better)</span>
                <span style={{ fontWeight: 'var(--weight-semibold)' }}>{metricsToUse.defectRate}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${metricsToUse.defectRate}%`, height: '100%', background: 'var(--color-danger)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                <span>Contract Spend Allocation</span>
                <span style={{ fontWeight: 'var(--weight-semibold)' }}>${metricsToUse.totalSpend.toLocaleString()} Total</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: '75%', height: '100%', background: 'var(--color-success)' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title={vendor.name}
        description={`Classification: ${vendor.type} | Payment Terms: Net ${vendor.paymentTerms} Days`}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Vendors', href: '/crm/vendors' },
          { label: vendor.name }
        ]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" size="sm" onClick={() => router.push('/crm/vendors')}>
              <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={triggerEdit}>
              <Edit size={14} style={{ marginRight: 6 }} /> Edit Profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} style={{ marginRight: 6 }} /> Remove
            </Button>
          </div>
        }
      />

      {/* Quick Metrics Header Card strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Lifetime Vendor Spend" value={`$${metrics.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={<DollarSign size={18} />} color="var(--color-success)" />
        <KPICard title="Total Orders Issued" value={metrics.totalPOs} icon={<FileText size={18} />} color="var(--color-primary)" />
        <KPICard title="Active Blanket Contracts" value={metrics.activeAgreements} icon={<Award size={18} />} color="var(--color-success)" />
        <KPICard title="Open Orders Pipeline" value={metrics.openPOs} icon={<Clock size={18} />} color="var(--color-warning)" />
      </div>

      {/* Tab bar header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)', overflowX: 'auto' }}>
        {(['profile', 'pos', 'returns', 'agreements', 'notes', 'scorecard'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              outline: 'none',
            }}
          >
            {tab === 'profile' && 'Overview Details'}
            {tab === 'pos' && 'Purchase Orders'}
            {tab === 'returns' && 'Returns & Debit Notes'}
            {tab === 'agreements' && 'Price Agreements'}
            {tab === 'notes' && 'Timeline Memo Log'}
            {tab === 'scorecard' && 'Performance Scorecard'}
          </button>
        ))}
      </div>

      {/* Active Tab rendering */}
      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'pos' && renderPOsTab()}
        {activeTab === 'returns' && renderReturnsTab()}
        {activeTab === 'agreements' && renderAgreementsTab()}
        {activeTab === 'notes' && renderNotesTab()}
        {activeTab === 'scorecard' && renderScorecardTab()}
      </div>

      {/* Edit Vendor Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Update Supplier Profile" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate as any} disabled={updating}>{updating ? 'Updating...' : 'Save Updates'}</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Supplier Name" required placeholder="Acme Logistics Inc." value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <FormField label="Classification">
              <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                <option value="COMPANY">Company</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="GOVERNMENT">Government Agency</option>
                <option value="NON_PROFIT">Non-Profit Organization</option>
              </Select>
            </FormField>
            <FormField label="Supplier Status">
              <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="PREFERRED">Preferred Tier</option>
                <option value="ACTIVE">Active Partner</option>
                <option value="ON_HOLD">Payment Credit Hold</option>
                <option value="BLOCKED">Blocked Account</option>
                <option value="INACTIVE">Inactive Supplier</option>
              </Select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Contact Email" type="email" placeholder="billing@acme.com" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <TextField label="Contact Phone" placeholder="+1-800-555-0199" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <TextField label="Tax ID / Registration" placeholder="US-9988771" value={editForm.taxId} onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })} />
          </div>

          <FormField label="Payment Due Terms">
            <Select value={editForm.paymentTerms} onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value })}>
              <option value="15">Net 15 (Pay within 15 days)</option>
              <option value="30">Net 30 (Pay within 30 days)</option>
              <option value="45">Net 45 (Pay within 45 days)</option>
              <option value="60">Net 60 (Pay within 60 days)</option>
              <option value="90">Net 90 (Pay within 90 days)</option>
            </Select>
          </FormField>

          <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <legend style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', padding: '0 8px' }}>Supplier Address Details</legend>
            <TextField label="Street Address" placeholder="Suite 400, 100 Supplier Lane" value={editForm.street} onChange={(e) => setEditForm({ ...editForm, street: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 'var(--space-2)' }}>
              <TextField label="City" placeholder="San Jose" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              <TextField label="State/Region" placeholder="CA" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              <TextField label="Postal Code" placeholder="95131" value={editForm.postalCode} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
              <TextField label="Country" placeholder="United States" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
            </div>
          </fieldset>

          <TextField label="Private Supplier Memo / Evaluation Notes" placeholder="Special pricing agreements, shipping constraints..." value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
        </form>
      </Modal>

      {/* Log Activity Note Modal */}
      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="Log Supplier Activity/Memo" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddNote as any} disabled={addingNote}>{addingNote ? 'Saving...' : 'Add Note'}</Button>
          </>
        }
      >
        <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Activity Classification">
            <Select value={noteForm.type} onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })}>
              <option value="NOTE">Evaluative Memo Note</option>
              <option value="CALL">Phone Call Log</option>
              <option value="EMAIL">Email Record</option>
              <option value="MEETING">Supplier Meeting Minutes</option>
            </Select>
          </FormField>
          <TextField label="Memo / Details" required placeholder="Describe the discussion, pricing updates, or logistics issues..." value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remove Supplier Partner" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Removing...' : 'Confirm Remove'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2)' }}>
          <AlertCircle size={24} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Are you absolutely sure?</div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              This will mark the supplier as inactive. Purchase history, ledger logs, and active agreements will be kept but hidden from active listings.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
