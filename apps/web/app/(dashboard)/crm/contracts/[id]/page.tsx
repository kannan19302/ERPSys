'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, PageHeader, Spinner, Button, StatusBadge, Badge, Modal,
  TextField, FormField, Select, useToast, KPICard,
} from '@unerp/ui';
import {
  ArrowLeft, FileText, DollarSign, Calendar, RefreshCw, Edit, Trash2,
  AlertTriangle, AlertCircle, Building, Users,
} from 'lucide-react';
import { apiGet, apiPut, apiPatch, apiPost, apiDelete, ApiRequestError } from '../../../../../src/lib/api';

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

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  type: string;
  value: number;
  currency: string;
  status: string;
  startDate: string;
  endDate: string;
  renewalDate: string;
  autoRenew: boolean;
  renewalTermMonths: number | null;
  terms: string | null;
  customer: LinkedParty | null;
  vendor: LinkedParty | null;
  renewedFrom: RenewalLink | null;
  renewals: RenewalLink[];
  createdAt: string;
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

  const [editOpen, setEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', type: 'SALES', value: '', currency: 'USD',
    startDate: '', endDate: '', renewalDate: '', autoRenew: false,
    renewalTermMonths: '', terms: '',
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [renewOpen, setRenewOpen] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewForm, setRenewForm] = useState({ renewalTermMonths: '', newValue: '' });

  const [statusUpdating, setStatusUpdating] = useState(false);

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

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const triggerEdit = () => {
    if (!contract) return;
    setEditForm({
      title: contract.title,
      type: contract.type,
      value: String(contract.value),
      currency: contract.currency,
      startDate: contract.startDate?.slice(0, 10) || '',
      endDate: contract.endDate?.slice(0, 10) || '',
      renewalDate: contract.renewalDate?.slice(0, 10) || '',
      autoRenew: contract.autoRenew,
      renewalTermMonths: contract.renewalTermMonths ? String(contract.renewalTermMonths) : '',
      terms: contract.terms || '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        type: editForm.type,
        value: Number(editForm.value) || 0,
        currency: editForm.currency,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        renewalDate: editForm.renewalDate || undefined,
        autoRenew: editForm.autoRenew,
        renewalTermMonths: editForm.renewalTermMonths ? Number(editForm.renewalTermMonths) : null,
        terms: editForm.terms.trim() || null,
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

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      await apiPatch(`/crm/contracts/${id}/status`, { status: newStatus });
      success(`Contract status changed to ${newStatus}.`);
      fetchContract();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred updating contract status.';
      error(message);
    } finally {
      setStatusUpdating(false);
    }
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
      success('Contract renewed — a new follow-on contract has been created.');
      setRenewOpen(false);
      router.push(`/crm/contracts/${renewed.id}`);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred while renewing the contract.';
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

  const allowedTransitions = STATUS_TRANSITIONS[contract.status] ?? [];
  const isTerminal = ['TERMINATED', 'RENEWED'].includes(contract.status);
  const daysToRenewal = Math.ceil((new Date(contract.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title={contract.title}
        description={`Contract #${contract.contractNumber} | Type: ${contract.type}`}
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
            <Button variant="outline" size="sm" onClick={triggerEdit}>
              <Edit size={14} style={{ marginRight: 6 }} /> Edit
            </Button>
            {!isTerminal && (
              <Button variant="outline" size="sm" onClick={() => setRenewOpen(true)}>
                <RefreshCw size={14} style={{ marginRight: 6 }} /> Renew
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} style={{ marginRight: 6 }} /> Delete
            </Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Contract Value" value={`${contract.currency} ${Number(contract.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<DollarSign size={18} />} color="var(--color-success)" />
        <KPICard title="Days to Renewal" value={daysToRenewal} icon={<Calendar size={18} />} color={daysToRenewal <= 30 ? 'var(--color-warning)' : 'var(--color-primary)'} />
        <KPICard title="Auto-Renew" value={contract.autoRenew ? 'Enabled' : 'Disabled'} icon={<RefreshCw size={18} />} color="var(--color-primary)" />
        <KPICard title="Renewal Term" value={contract.renewalTermMonths ? `${contract.renewalTermMonths} mo` : '—'} icon={<Calendar size={18} />} color="var(--color-text-secondary)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} /> Contract Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Contract Number</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginTop: '2px', fontFamily: 'monospace' }}>{contract.contractNumber}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Type</span>
                <div style={{ marginTop: '2px' }}><Badge variant="info">{contract.type}</Badge></div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Start Date</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{new Date(contract.startDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>End Date</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{new Date(contract.endDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Renewal Date</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{new Date(contract.renewalDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Auto-Renew</span>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>{contract.autoRenew ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {contract.customer ? <Users size={16} /> : <Building size={16} />} Linked Party
            </h4>
            {contract.customer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Customer</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{contract.customer.name}</div>
                {contract.customer.email && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{contract.customer.email}</div>}
              </div>
            ) : contract.vendor ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Vendor</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{contract.vendor.name}</div>
                {contract.vendor.email && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{contract.vendor.email}</div>}
              </div>
            ) : (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>No linked customer or vendor.</span>
            )}
          </Card>

          {contract.terms && (
            <Card padding="md">
              <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Terms</h4>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: '1.5', color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{contract.terms}</p>
            </Card>
          )}

          {(contract.renewedFrom || contract.renewals.length > 0) && (
            <Card padding="md">
              <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Renewal Lineage</h4>
              {contract.renewedFrom && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Renewed From</span>
                  <div>
                    <a onClick={() => router.push(`/crm/contracts/${contract.renewedFrom!.id}`)} style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                      {contract.renewedFrom.contractNumber} — {contract.renewedFrom.title}
                    </a>
                  </div>
                </div>
              )}
              {contract.renewals.length > 0 && (
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Follow-on Contracts</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    {contract.renewals.map(r => (
                      <a key={r.id} onClick={() => router.push(`/crm/contracts/${r.id}`)} style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                        {r.contractNumber} — {r.title} {r.status ? `(${r.status})` : ''}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card padding="md">
            <h4 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Lifecycle Control</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Current Status</span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={contract.status} />
                </div>
              </div>

              <hr style={{ border: '0', borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />

              {isTerminal ? (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  This contract is in a terminal state and cannot transition further.
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Quick Status Actions</span>
                  {allowedTransitions.length === 0 && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No further transitions available.</span>
                  )}
                  {allowedTransitions.map(next => (
                    <Button key={next} size="sm" variant="outline" disabled={statusUpdating} onClick={() => handleStatusChange(next)}>
                      Set {next.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Contract Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Update Contract" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate as any} disabled={updating}>{updating ? 'Updating...' : 'Save Updates'}</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Title" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Type">
              <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                <option value="SALES">Sales</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SERVICE">Service</option>
                <option value="NDA">NDA</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>
            <TextField label="Value" type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} />
            <TextField label="Currency" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} />
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
        </form>
      </Modal>

      {/* Renew Contract Modal */}
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
            Leave fields blank to use the existing renewal term and value.
          </p>
          <TextField label="Renewal Term (months)" type="number" placeholder={contract.renewalTermMonths ? String(contract.renewalTermMonths) : '12'} value={renewForm.renewalTermMonths} onChange={(e) => setRenewForm({ ...renewForm, renewalTermMonths: e.target.value })} />
          <TextField label="New Value (optional)" type="number" placeholder={String(contract.value)} value={renewForm.newValue} onChange={(e) => setRenewForm({ ...renewForm, newValue: e.target.value })} />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Contract" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Confirm Delete'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2)' }}>
          <AlertCircle size={24} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Are you absolutely sure?</div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              This will soft-delete the contract. It will be hidden from active listings but retained for audit history.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
