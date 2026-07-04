'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, PageHeader, Spinner, Button, StatusBadge, Badge, Modal,
  TextField, FormField, Select, useToast, KPICard,
} from '@unerp/ui';
import {
  ArrowLeft, FileText, DollarSign, Calendar, RefreshCw, Edit, Trash2,
  AlertTriangle, AlertCircle, Building, Users, Printer, Download, CheckCircle, HelpCircle
} from 'lucide-react';
import { apiGet, apiPut, apiPatch, apiPost, apiDelete, ApiRequestError } from '../../../../../src/lib/api';
import Papa from 'papaparse';

interface LinkedParty {
  id: string;
  name: string;
  email?: string | null;
}

interface RenewalLink {
  id: string;
  contractNumber: string;
  title: string;
  status?: string;
  startDate?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  sellPrice: number;
}

interface ContractLineItem {
  id: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  product: Product;
}

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  type: string;
  contractType: string;
  value: number;
  currency: string;
  status: string;
  startDate: string;
  endDate: string;
  renewalDate: string | null;
  autoRenew: boolean;
  renewalTermMonths: number | null;
  terms: string | null;
  customer: LinkedParty | null;
  vendor: LinkedParty | null;
  renewedFrom: RenewalLink | null;
  renewals: RenewalLink[] | null;
  revisedFrom: RenewalLink | null;
  revisions: RenewalLink[] | null;
  createdAt: string;
  approvalStatus: string;
  approverId: string | null;
  signatureStatus: string;
  signerName: string | null;
  signerEmail: string | null;
  signedAt: string | null;
  lineItems: ContractLineItem[];
  shippingHandlingCharges?: number;
  priceAdjustment?: number;
  taxRate?: number;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  deliveryNotes?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  billingMilestones?: Array<{
    id: string;
    title: string;
    percentage: number;
    amount: number;
    dueDate: string | null;
    status: string;
    invoiceId: string | null;
  }>;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE', 'TERMINATED'],
  ACTIVE: ['EXPIRING_SOON', 'EXPIRED', 'TERMINATED'],
  EXPIRING_SOON: ['ACTIVE', 'EXPIRED', 'TERMINATED'],
  EXPIRED: ['TERMINATED'],
  TERMINATED: [],
  RENEWED: [],
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { success, error } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [activeTab, setActiveTab] = useState('details');

  // Edit states
  const [editOpen, setEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', type: 'SALES', contractType: 'ONE_TIME', value: '', currency: 'USD',
    startDate: '', endDate: '', renewalDate: '', autoRenew: false,
    renewalTermMonths: '', terms: '',
    shippingHandlingCharges: '', priceAdjustment: '', taxRate: '',
    billingAddress: '', shippingAddress: '', deliveryNotes: '',
    shippingCarrier: '', trackingNumber: '',
  });
  const [editLineItems, setEditLineItems] = useState<{ productId: string; quantity: number; unitPrice: number; discount: number }[]>([]);

  // Other action states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [renewOpen, setRenewOpen] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewForm, setRenewForm] = useState({ renewalTermMonths: '', newValue: '' });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [salesOrderCreating, setSalesOrderCreating] = useState(false);
  const [revising, setRevising] = useState(false);

  // Milestone states
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', percentage: '', dueDate: '' });

  const fetchContract = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<Contract>(`/crm/contracts/${id}`);
      setContract(d);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to load contract.';
      error(message);
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, [id, error]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiGet<{ data: Product[] }>('/crm/products?limit=100');
      setProductsList(res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchContract();
    fetchProducts();
  }, [fetchContract, fetchProducts]);

  // Compute total value from line items dynamically in editing form
  useEffect(() => {
    const total = editLineItems.reduce((acc, item) => {
      const price = Number(item.unitPrice) || 0;
      const qty = Number(item.quantity) || 0;
      const disc = Number(item.discount) || 0;
      return acc + (qty * price - disc);
    }, 0);
    setEditForm(prev => ({ ...prev, value: String(total) }));
  }, [editLineItems]);

  const handleSubmitApproval = async () => {
    try {
      await apiPost(`/crm/contracts/${id}/submit-approval`, {});
      success('Contract submitted for approval. Status holds until approval rules are cleared.');
      fetchContract();
    } catch {
      error('Failed to submit contract for approval.');
    }
  };

  const handleApprove = async () => {
    try {
      await apiPost(`/crm/contracts/${id}/approve`, {});
      success('Contract approved successfully.');
      fetchContract();
    } catch {
      error('Failed to approve contract.');
    }
  };

  const handleReject = async () => {
    try {
      await apiPost(`/crm/contracts/${id}/reject`, {});
      success('Contract rejected.');
      fetchContract();
    } catch {
      error('Failed to reject contract.');
    }
  };

  const handleInviteSign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost(`/crm/contracts/${id}/invite-sign`, {
        signerName: inviteForm.name,
        signerEmail: inviteForm.email,
      });
      success('Signature invitation sent successfully.');
      setInviteOpen(false);
      fetchContract();
    } catch {
      error('Failed to send signature invitation.');
    }
  };

  const handleSign = async () => {
    try {
      await apiPost(`/crm/contracts/${id}/sign`, {});
      success('Contract signed successfully. Status is now ACTIVE.');
      fetchContract();
    } catch {
      error('Failed to sign contract.');
    }
  };

  const handleCreateSalesOrder = async () => {
    setSalesOrderCreating(true);
    try {
      const order = await apiPost<any>(`/crm/contracts/${id}/sales-order`, {});
      success(`Sales Order ${order.orderNumber} generated successfully from contract!`);
      router.push(`/crm/sales-orders`);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to generate Sales Order.';
      error(message);
    } finally {
      setSalesOrderCreating(false);
    }
  };

  const handleReviseContract = async () => {
    setRevising(true);
    try {
      const clone = await apiPost<Contract>(`/crm/contracts/${id}/revise`, {});
      success('Active contract cloned into a new DRAFT revision copy.');
      router.push(`/crm/contracts/${clone.id}`);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to revise contract.';
      error(message);
    } finally {
      setRevising(false);
    }
  };

  const triggerEdit = () => {
    if (!contract) return;
    setEditForm({
      title: contract.title,
      type: contract.type,
      contractType: contract.contractType || 'ONE_TIME',
      value: String(contract.value),
      currency: contract.currency,
      startDate: contract.startDate?.slice(0, 10) || '',
      endDate: contract.endDate?.slice(0, 10) || '',
      renewalDate: contract.renewalDate?.slice(0, 10) || '',
      autoRenew: contract.autoRenew,
      renewalTermMonths: contract.renewalTermMonths ? String(contract.renewalTermMonths) : '',
      terms: contract.terms || '',
      shippingHandlingCharges: contract.shippingHandlingCharges ? String(contract.shippingHandlingCharges) : '',
      priceAdjustment: contract.priceAdjustment ? String(contract.priceAdjustment) : '',
      taxRate: contract.taxRate ? String(contract.taxRate) : '',
      billingAddress: contract.billingAddress || '',
      shippingAddress: contract.shippingAddress || '',
      deliveryNotes: contract.deliveryNotes || '',
      shippingCarrier: contract.shippingCarrier || '',
      trackingNumber: contract.trackingNumber || '',
    });
    setEditLineItems(
      (contract.lineItems || []).map((item) => ({
        productId: item.product?.id || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      }))
    );
    setEditOpen(true);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneForm.title || !milestoneForm.percentage) return;
    setAddingMilestone(true);
    try {
      await apiPost(`/crm/contracts/${id}/milestones`, {
        title: milestoneForm.title,
        percentage: Number(milestoneForm.percentage),
        dueDate: milestoneForm.dueDate || undefined,
      });
      success('Billing milestone added successfully.');
      setMilestoneOpen(false);
      setMilestoneForm({ title: '', percentage: '', dueDate: '' });
      const updated = await apiGet<Contract>('/crm/contracts/' + id);
      setContract(updated);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to add milestone.';
      error(message);
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this billing milestone?')) return;
    try {
      await apiDelete(`/crm/contracts/${id}/milestones/${milestoneId}`);
      success('Milestone deleted successfully.');
      const updated = await apiGet<Contract>('/crm/contracts/' + id);
      setContract(updated);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to delete milestone.';
      error(message);
    }
  };

  const handleInvoiceMilestone = async (milestoneId: string) => {
    try {
      const result = await apiPost<any>(`/crm/contracts/${id}/milestones/${milestoneId}/invoice`, {});
      success(`Invoice ${result.invoiceNumber || ''} generated successfully in Draft status.`);
      const updated = await apiGet<Contract>('/crm/contracts/' + id);
      setContract(updated);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to generate invoice.';
      error(message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        type: editForm.type,
        contractType: editForm.contractType,
        value: Number(editForm.value) || 0,
        currency: editForm.currency,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        renewalDate: editForm.renewalDate || undefined,
        autoRenew: editForm.autoRenew,
        renewalTermMonths: editForm.renewalTermMonths ? Number(editForm.renewalTermMonths) : null,
        terms: editForm.terms.trim() || null,
        shippingHandlingCharges: Number(editForm.shippingHandlingCharges) || 0,
        priceAdjustment: Number(editForm.priceAdjustment) || 0,
        taxRate: Number(editForm.taxRate) || 0,
        billingAddress: editForm.billingAddress.trim() || null,
        shippingAddress: editForm.shippingAddress.trim() || null,
        deliveryNotes: editForm.deliveryNotes.trim() || null,
        shippingCarrier: editForm.shippingCarrier.trim() || null,
        trackingNumber: editForm.trackingNumber.trim() || null,
        lineItems: editLineItems.filter((i) => i.productId),
      };
      await apiPut(`/crm/contracts/${id}`, payload);
      success('Contract updated successfully.');
      setEditOpen(false);
      fetchContract();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred during update.';
      error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkImportEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedItems: any[] = [];
        results.data.forEach((row: any) => {
          const sku = String(row.SKU || row.sku || '').trim();
          const name = String(row.Name || row.name || '').trim();
          const qty = Number(row.Quantity || row.quantity || row.Qty || row.qty || 1);
          const price = Number(row.UnitPrice || row.unitPrice || row.Price || row.price || 0);
          const discount = Number(row.Discount || row.discount || 0);

          const product = productsList.find(
            p => (sku && p.sku.toLowerCase() === sku.toLowerCase()) || 
                 (name && p.name.toLowerCase() === name.toLowerCase())
          );

          if (product) {
            parsedItems.push({
              productId: product.id,
              quantity: qty,
              unitPrice: price || product.sellPrice,
              discount: discount,
            });
          }
        });

        if (parsedItems.length > 0) {
          setEditLineItems(prev => [...prev, ...parsedItems]);
          success(`Successfully imported ${parsedItems.length} products into lines.`);
        } else {
          error('No matching products found. Please check SKU or Name headers.');
        }
      },
    });
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenewing(true);
    try {
      const payload = {
        renewalTermMonths: renewForm.renewalTermMonths ? Number(renewForm.renewalTermMonths) : undefined,
        newValue: renewForm.newValue ? Number(renewForm.newValue) : undefined,
      };
      const renewed = await apiPost<Contract>(`/crm/contracts/${id}/renew`, payload);
      success('Contract renewed successfully.');
      setRenewOpen(false);
      router.push(`/crm/contracts/${renewed.id}`);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred while renewing.';
      error(message);
    } finally {
      setRenewing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiDelete(`/crm/contracts/${id}`);
      success('Contract deleted.');
      setDeleteOpen(false);
      router.push('/crm/contracts');
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred during deletion.';
      error(message);
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    if (!contract) return;
    const csvContent = [
      ['Contract ID', contract.id],
      ['Contract Number', contract.contractNumber],
      ['Title', contract.title],
      ['Category', contract.type],
      ['Agreement Type', contract.contractType],
      ['Value', `${contract.currency} ${contract.value}`],
      ['Start Date', contract.startDate],
      ['End Date', contract.endDate],
      ['Status', contract.status],
      ['Approval Status', contract.approvalStatus],
      ['Signature Status', contract.signatureStatus],
      [],
      ['SKU', 'Product Name', 'Quantity', 'Unit Price', 'Discount', 'Total'],
      ...(contract.lineItems || []).map(i => [
        i.product?.sku || '',
        i.product?.name || '',
        i.quantity,
        i.unitPrice,
        i.discount,
        i.quantity * i.unitPrice - i.discount
      ])
    ];

    const csvString = csvContent.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contract_${contract.contractNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-12)' }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-warning)' }} />
        <h3>Contract Not Found</h3>
        <Button variant="primary" onClick={() => router.push('/crm/contracts')}>
          Back to Contracts List
        </Button>
      </div>
    );
  }

  const isTerminal = ['TERMINATED', 'RENEWED'].includes(contract.status);
  const daysToRenewal = contract.renewalDate ? Math.ceil((new Date(contract.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title={contract.title}
        description={`Contract #${contract.contractNumber} | Category: ${contract.type}`}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Contracts', href: '/crm/contracts' },
          { label: contract.title },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" size="sm" onClick={() => router.push('/crm/contracts')}>
              <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back
            </Button>
            {contract.status === 'DRAFT' && contract.approvalStatus !== 'PENDING_APPROVAL' && (
              <Button variant="outline" size="sm" onClick={triggerEdit}>
                <Edit size={14} style={{ marginRight: 6 }} /> Edit Draft
              </Button>
            )}
            {!isTerminal && contract.status !== 'DRAFT' && (
              <Button variant="outline" size="sm" onClick={() => setRenewOpen(true)}>
                <RefreshCw size={14} style={{ marginRight: 6 }} /> Renew
              </Button>
            )}
            {(contract.status === 'ACTIVE' || contract.signatureStatus === 'SIGNED') && (
              <Button variant="outline" size="sm" onClick={handleReviseContract} disabled={revising}>
                <RefreshCw size={14} style={{ marginRight: 6 }} /> {revising ? 'Revising...' : 'Revise/Amend'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download size={14} style={{ marginRight: 6 }} /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer size={14} style={{ marginRight: 6 }} /> Print PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} style={{ marginRight: 6 }} /> Delete
            </Button>
          </div>
        }
      />

      {/* Approval & Signature Progress Timeline */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', margin: 'var(--space-2) 0' }}>
          <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '2px', background: 'var(--color-border)', zIndex: 1 }} />
          {[
            { label: 'Draft', active: true },
            { label: 'Pending Approval', active: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(contract.approvalStatus) || contract.signatureStatus === 'SIGNED' || contract.status === 'ACTIVE' },
            { label: 'Approved', active: ['APPROVED'].includes(contract.approvalStatus) || contract.signatureStatus === 'SIGNED' || contract.status === 'ACTIVE' },
            { label: 'Signed', active: contract.signatureStatus === 'SIGNED' || contract.status === 'ACTIVE' },
            { label: 'Active', active: contract.status === 'ACTIVE' }
          ].map((step, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, background: 'var(--color-bg)', padding: '0 var(--space-2)' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: step.active ? 'var(--color-success)' : 'var(--color-bg-sunken)',
                color: step.active ? 'white' : 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '12px', border: '2px solid var(--color-border)'
              }}>
                {idx + 1}
              </div>
              <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: step.active ? 600 : 400, color: step.active ? 'var(--color-text)' : 'var(--color-text-tertiary)' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
        {[
          { id: 'details', label: 'Details & Progress' },
          { id: 'items', label: 'Products & Adjustments' },
          { id: 'shipping', label: 'Shipping & Addresses' },
          { id: 'milestones', label: 'Billing Milestones' },
          { id: 'revisions', label: 'Amendments & Lineage' },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Main Details Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {activeTab === 'details' && (
            <>
              <Card padding="md">
                <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Contract Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Building size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Party Details:</span>
                    <strong style={{ marginLeft: 'auto' }}>
                      {contract.customer ? `${contract.customer.name} (Cust)` : contract.vendor ? `${contract.vendor.name} (Vend)` : '—'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <DollarSign size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Contract Value:</span>
                    <strong style={{ marginLeft: 'auto' }}>{contract.currency} {Number(contract.value).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Calendar size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Start Date:</span>
                    <strong style={{ marginLeft: 'auto' }}>{new Date(contract.startDate).toLocaleDateString()}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Calendar size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>End Date:</span>
                    <strong style={{ marginLeft: 'auto' }}>{new Date(contract.endDate).toLocaleDateString()}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <RefreshCw size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Auto-Renew:</span>
                    <strong style={{ marginLeft: 'auto' }}>{contract.autoRenew ? 'Yes' : 'No'}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <HelpCircle size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Agreement Type:</span>
                    <strong style={{ marginLeft: 'auto' }}>{contract.contractType || 'ONE_TIME'}</strong>
                  </div>
                </div>
              </Card>

              {contract.terms && (
                <Card padding="md">
                  <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Terms & Clauses</h4>
                  <p style={{ fontSize: 'var(--text-sm)', lineHeight: '1.5', color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{contract.terms}</p>
                </Card>
              )}
            </>
          )}

          {activeTab === 'items' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <Card padding="none">
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Linked Products / Services</h4>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>SKU</th>
                      <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Product</th>
                      <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Quantity</th>
                      <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Unit Price</th>
                      <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Discount</th>
                      <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(contract.lineItems || []).map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace' }}>{item.product?.sku || '—'}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{item.product?.name || '—'}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>{contract.currency} {Number(item.unitPrice).toLocaleString()}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', color: 'var(--color-danger)' }}>{item.discount > 0 ? `-${contract.currency} ${Number(item.discount).toLocaleString()}` : '—'}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>
                          {contract.currency} {((item.quantity * item.unitPrice) - item.discount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {(contract.lineItems || []).length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                          No items linked to this contract.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>

              <Card padding="md" style={{ marginLeft: 'auto', width: '320px' }}>
                <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Summary & Adjustments</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Items Subtotal:</span>
                    <strong>{contract.currency} {Number(contract.value).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Shipping & Handling:</span>
                    <strong>{contract.currency} {Number(contract.shippingHandlingCharges || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: Number(contract.priceAdjustment || 0) < 0 ? 'var(--color-success)' : 'inherit' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Price Adjustment:</span>
                    <strong>{contract.currency} {Number(contract.priceAdjustment || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Tax Rate:</span>
                    <strong>{Number(contract.taxRate || 0)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', fontWeight: 'bold', fontSize: 'var(--text-md)' }}>
                    <span>Grand Total:</span>
                    <span>
                      {contract.currency} {(
                        Number(contract.value) + 
                        Number(contract.shippingHandlingCharges || 0) + 
                        Number(contract.priceAdjustment || 0) + 
                        (Number(contract.value) * Number(contract.taxRate || 0) / 100)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'shipping' && (
            <Card padding="md">
              <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Shipping & Address Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                <div>
                  <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Addresses</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', display: 'block' }}>Billing Address</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{contract.billingAddress || 'No billing address provided.'}</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', display: 'block' }}>Shipping Address</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{contract.shippingAddress || 'No shipping address provided.'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Logistics & Delivery</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', display: 'block' }}>Delivery Notes</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{contract.deliveryNotes || 'No delivery notes/instructions.'}</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', display: 'block' }}>Shipping Carrier</span>
                      <strong style={{ display: 'block', fontSize: 'var(--text-sm)', marginTop: '4px' }}>{contract.shippingCarrier || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', display: 'block' }}>Tracking Reference</span>
                      <strong style={{ display: 'block', fontSize: 'var(--text-sm)', marginTop: '4px', fontFamily: 'monospace' }}>{contract.trackingNumber || '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'milestones' && (
            <Card padding="none">
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Billing Milestones</h4>
                <Button size="sm" variant="outline" onClick={() => setMilestoneOpen(true)}>
                  Add Milestone
                </Button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Milestone Title</th>
                    <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Percentage</th>
                    <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Amount</th>
                    <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Due Date</th>
                    <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'center', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Status</th>
                    <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(contract.billingMilestones || []).map((ms) => (
                    <tr key={ms.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{ms.title}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>{Number(ms.percentage).toLocaleString()}%</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>
                        {contract.currency} {Number(ms.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {ms.dueDate ? new Date(ms.dueDate).toLocaleDateString() : 'Upon Milestone Completion'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                        <Badge variant={ms.status === 'PAID' ? 'success' : ms.status === 'INVOICED' ? 'info' : 'default'}>
                          {ms.status}
                        </Badge>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {ms.status === 'PENDING' && (
                            <>
                              <Button size="sm" variant="primary" onClick={() => handleInvoiceMilestone(ms.id)}>
                                Create Invoice
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleDeleteMilestone(ms.id)}>
                                Delete
                              </Button>
                            </>
                          )}
                          {ms.status === 'INVOICED' && ms.invoiceId && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                              Invoiced
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(contract.billingMilestones || []).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                        No billing milestones defined.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {activeTab === 'revisions' && (
            <Card padding="md">
              <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Contract History Lineage</h4>
              {contract.renewedFrom && (
                <div style={{ marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Renewed From Contract</span>
                  <div>
                    <a onClick={() => router.push(`/crm/contracts/${contract.renewedFrom!.id}`)} style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      {contract.renewedFrom.contractNumber} — {contract.renewedFrom.title}
                    </a>
                  </div>
                </div>
              )}
              {contract.revisedFrom && (
                <div style={{ marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Revised From (Historical Edit)</span>
                  <div>
                    <a onClick={() => router.push(`/crm/contracts/${contract.revisedFrom!.id}`)} style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      {contract.revisedFrom.contractNumber} — {contract.revisedFrom.title}
                    </a>
                  </div>
                </div>
              )}
              {(contract.renewals || []).length > 0 && (
                <div style={{ marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Follow-on Renewal Contracts</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    {(contract.renewals || []).map(r => (
                      <a key={r.id} onClick={() => router.push(`/crm/contracts/${r.id}`)} style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                        {r.contractNumber} — {r.title} ({r.status})
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {(contract.revisions || []).length > 0 && (
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Amended Revisions</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    {(contract.revisions || []).map(r => (
                      <a key={r.id} onClick={() => router.push(`/crm/contracts/${r.id}`)} style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                        {r.contractNumber} — {r.title} ({r.status})
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {!(contract.renewedFrom || (contract.renewals || []).length > 0 || contract.revisedFrom || (contract.revisions || []).length > 0) && (
                <span style={{ fontSize: 'var(--text-sm)', fontStyle: 'italic', color: 'var(--color-text-tertiary)' }}>No revisions or renewal lineage available.</span>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Approval Lifecycle Control */}
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Approval Status</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Status</span>
                <Badge variant={contract.approvalStatus === 'APPROVED' ? 'success' : contract.approvalStatus === 'REJECTED' ? 'danger' : 'warning'}>
                  {contract.approvalStatus}
                </Badge>
              </div>

              {contract.approvalStatus === 'DRAFT' && contract.status === 'DRAFT' && (
                <Button size="sm" variant="primary" onClick={handleSubmitApproval}>
                  Submit for Approval
                </Button>
              )}

              {contract.approvalStatus === 'PENDING_APPROVAL' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button size="sm" variant="primary" style={{ flex: 1 }} onClick={handleApprove}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" style={{ flex: 1 }} onClick={handleReject}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Signature Lifecycle Control */}
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Signatures</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Sign Status</span>
                <Badge variant={contract.signatureStatus === 'SIGNED' ? 'success' : contract.signatureStatus === 'PENDING_SIGNATURE' ? 'warning' : 'default'}>
                  {contract.signatureStatus}
                </Badge>
              </div>

              {contract.signerName && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Signer: {contract.signerName} ({contract.signerEmail})
                </div>
              )}

              {contract.approvalStatus === 'APPROVED' && contract.signatureStatus === 'UNSIGNED' && (
                <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                  Invite Signer
                </Button>
              )}

              {contract.signatureStatus === 'PENDING_SIGNATURE' && (
                <Button size="sm" variant="primary" onClick={handleSign}>
                  <CheckCircle size={14} style={{ marginRight: 6 }} /> Sign Contract
                </Button>
              )}
            </div>
          </Card>

          {/* ERP Integration Actions */}
          {(contract.approvalStatus === 'APPROVED' || contract.status === 'ACTIVE') && contract.customer && (
            <Card padding="md">
              <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Order & Invoice Conversions</h4>
              <Button size="sm" variant="primary" style={{ width: '100%' }} onClick={handleCreateSalesOrder} disabled={salesOrderCreating}>
                {salesOrderCreating ? 'Converting...' : 'Generate Sales Order'}
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Update Contract" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate as any} disabled={updating}>{updating ? 'Updating...' : 'Save Updates'}</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-3)' }}>
            <TextField label="Title" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            <FormField label="Agreement Type">
              <Select value={editForm.contractType} onChange={(e) => setEditForm({ ...editForm, contractType: e.target.value })}>
                <option value="ONE_TIME">One Time Contract</option>
                <option value="RECURRING">Recurring Contract</option>
                <option value="MILESTONE">Milestone Contract</option>
                <option value="SUBSCRIPTION">Subscription Contract</option>
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Contract Category">
              <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                <option value="SALES">Sales</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SERVICE">Service</option>
                <option value="NDA">NDA</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>
            <TextField label="Value" type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} />
            <FormField label="Currency">
              <Select value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="JPY">JPY (¥)</option>
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Start Date" type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
            <TextField label="End Date" type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
            <TextField label="Renewal Date" type="date" value={editForm.renewalDate} onChange={(e) => setEditForm({ ...editForm, renewalDate: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Auto-Renew">
              <Select value={editForm.autoRenew ? 'true' : 'false'} onChange={(e) => setEditForm({ ...editForm, autoRenew: e.target.value === 'true' })}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </FormField>
            <TextField label="Renewal Term (months)" type="number" value={editForm.renewalTermMonths} onChange={(e) => setEditForm({ ...editForm, renewalTermMonths: e.target.value })} />
          </div>
          <TextField label="Terms / Notes" value={editForm.terms} onChange={(e) => setEditForm({ ...editForm, terms: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Shipping & Handling Charges" type="number" value={editForm.shippingHandlingCharges} onChange={(e) => setEditForm({ ...editForm, shippingHandlingCharges: e.target.value })} />
            <TextField label="Price Adjustment" type="number" value={editForm.priceAdjustment} onChange={(e) => setEditForm({ ...editForm, priceAdjustment: e.target.value })} />
            <TextField label="Tax Rate (%)" type="number" value={editForm.taxRate} onChange={(e) => setEditForm({ ...editForm, taxRate: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Billing Address" value={editForm.billingAddress} onChange={(e) => setEditForm({ ...editForm, billingAddress: e.target.value })} />
            <TextField label="Shipping Address" value={editForm.shippingAddress} onChange={(e) => setEditForm({ ...editForm, shippingAddress: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Delivery Notes" value={editForm.deliveryNotes} onChange={(e) => setEditForm({ ...editForm, deliveryNotes: e.target.value })} />
            <TextField label="Shipping Carrier" value={editForm.shippingCarrier} onChange={(e) => setEditForm({ ...editForm, shippingCarrier: e.target.value })} />
            <TextField label="Tracking Number" value={editForm.trackingNumber} onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })} />
          </div>

          {/* Line Items Editor inside edit modal */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Line Items</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', cursor: 'pointer', border: '1px dashed var(--color-border)', padding: '4px 8px', borderRadius: '4px' }}>
                  Load Products (CSV)
                  <input type="file" accept=".csv" onChange={handleBulkImportEdit} style={{ display: 'none' }} />
                </label>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditLineItems([...editLineItems, { productId: '', quantity: 1, unitPrice: 0, discount: 0 }])}>
                  + Add Item
                </Button>
              </div>
            </div>
            {editLineItems.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                <Select value={item.productId} onChange={(e) => {
                  const prod = productsList.find(p => p.id === e.target.value);
                  const updated = [...editLineItems];
                  const current = updated[idx] || { productId: '', quantity: 1, unitPrice: 0, discount: 0 };
                  updated[idx] = {
                    productId: e.target.value,
                    quantity: current.quantity,
                    unitPrice: prod ? prod.sellPrice : 0,
                    discount: current.discount
                  };
                  setEditLineItems(updated);
                }}>
                  <option value="">Select product...</option>
                  {productsList.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </Select>
                <input type="number" min="1" value={item.quantity} onChange={(e) => {
                  const updated = [...editLineItems];
                  const current = updated[idx] || { productId: '', quantity: 1, unitPrice: 0, discount: 0 };
                  updated[idx] = {
                    productId: current.productId,
                    quantity: Number(e.target.value) || 1,
                    unitPrice: current.unitPrice,
                    discount: current.discount
                  };
                  setEditLineItems(updated);
                }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', width: '60px' }} />
                <input type="number" value={item.unitPrice} onChange={(e) => {
                  const updated = [...editLineItems];
                  const current = updated[idx] || { productId: '', quantity: 1, unitPrice: 0, discount: 0 };
                  updated[idx] = {
                    productId: current.productId,
                    quantity: current.quantity,
                    unitPrice: Number(e.target.value) || 0,
                    discount: current.discount
                  };
                  setEditLineItems(updated);
                }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', width: '80px' }} />
                <input type="number" value={item.discount} onChange={(e) => {
                  const updated = [...editLineItems];
                  const current = updated[idx] || { productId: '', quantity: 1, unitPrice: 0, discount: 0 };
                  updated[idx] = {
                    productId: current.productId,
                    quantity: current.quantity,
                    unitPrice: current.unitPrice,
                    discount: Number(e.target.value) || 0
                  };
                  setEditLineItems(updated);
                }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', width: '60px' }} />
                <Button size="sm" variant="danger" onClick={() => setEditLineItems(editLineItems.filter((_, i) => i !== idx))}>Remove</Button>
              </div>
            ))}
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal open={renewOpen} onClose={() => setRenewOpen(false)} title="Renew Contract" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenewOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRenew as any} disabled={renewing}>{renewing ? 'Renewing...' : 'Confirm Renewal'}</Button>
          </>
        }
      >
        <form onSubmit={handleRenew} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Renewing creates a new follow-on contract starting where this one ends, and marks this contract as RENEWED.
          </p>
          <TextField label="Renewal Term (months)" type="number" placeholder={contract.renewalTermMonths ? String(contract.renewalTermMonths) : '12'} value={renewForm.renewalTermMonths} onChange={(e) => setRenewForm({ ...renewForm, renewalTermMonths: e.target.value })} />
          <TextField label="New Value (optional)" type="number" placeholder={String(contract.value)} value={renewForm.newValue} onChange={(e) => setRenewForm({ ...renewForm, newValue: e.target.value })} />
        </form>
      </Modal>

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Signer" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleInviteSign as any}>Send Invitation</Button>
          </>
        }
      >
        <form onSubmit={handleInviteSign} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Signer Name" required value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} />
          <TextField label="Signer Email" required type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Contract" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Confirm Delete'}</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete this contract? This will soft-delete the record and remove it from all views.
        </p>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal open={milestoneOpen} onClose={() => setMilestoneOpen(false)} title="Add Billing Milestone" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMilestoneOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddMilestone as any} disabled={addingMilestone}>
              {addingMilestone ? 'Adding...' : 'Add Milestone'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Milestone Title" required value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} placeholder="e.g. Initial Deposit, Final Delivery" />
          <TextField label="Milestone Percentage (%)" required type="number" step="0.01" min="0.01" max="100" value={milestoneForm.percentage} onChange={(e) => setMilestoneForm({ ...milestoneForm, percentage: e.target.value })} placeholder="e.g. 30" />
          <TextField label="Estimated Due Date" type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}
