'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, Card, Button, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard, Badge, useToast,
} from '@unerp/ui';
import {
  FileText, Plus, Search, DollarSign, CheckCircle, AlertCircle, Clock,
} from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../src/lib/api';

interface LinkedParty {
  id: string;
  name: string;
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
  customer: LinkedParty | null;
  vendor: LinkedParty | null;
  createdAt: string;
}

interface ContractStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  totalActiveValue: number;
}

export default function ContractsPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('renewalDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    contractNumber: '',
    title: '',
    customerId: '',
    vendorId: '',
    type: 'SALES',
    value: '',
    currency: 'USD',
    startDate: '',
    endDate: '',
    renewalDate: '',
    autoRenew: false,
    renewalTermMonths: '12',
    terms: '',
  });

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        status,
        type,
        sortBy,
        sortOrder,
      });
      const d = await apiGet<{ data: Contract[]; totalCount: number; totalPages: number }>(`/crm/contracts?${params.toString()}`);
      setContracts(d.data || []);
      setTotalCount(d.totalCount || 0);
      setTotalPages(d.totalPages || 0);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to load contracts list.';
      error(message);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, status, type, sortBy, sortOrder, error]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await apiGet<ContractStats>('/crm/contracts/stats');
      setStats(s);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, debouncedSearch, status, type, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contractNumber.trim() || !form.title.trim()) {
      error('Contract number and title are required.');
      return;
    }
    if (!form.customerId.trim() && !form.vendorId.trim()) {
      error('Link at least a Customer or a Vendor to the contract.');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        contractNumber: form.contractNumber.trim(),
        title: form.title.trim(),
        customerId: form.customerId.trim() || undefined,
        vendorId: form.vendorId.trim() || undefined,
        type: form.type,
        value: Number(form.value) || 0,
        currency: form.currency,
        startDate: form.startDate,
        endDate: form.endDate,
        renewalDate: form.renewalDate || form.endDate,
        autoRenew: form.autoRenew,
        renewalTermMonths: form.renewalTermMonths ? Number(form.renewalTermMonths) : undefined,
        terms: form.terms.trim() || undefined,
      };
      await apiPost('/crm/contracts', payload);
      setCreateOpen(false);
      setForm({
        contractNumber: '', title: '', customerId: '', vendorId: '', type: 'SALES',
        value: '', currency: 'USD', startDate: '', endDate: '', renewalDate: '',
        autoRenew: false, renewalTermMonths: '12', terms: '',
      });
      success('Contract created successfully.');
      fetchData();
      fetchStats();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred while creating the contract.';
      error(message);
    } finally {
      setCreating(false);
    }
  };

  const getStatusVariant = (v: string) => {
    switch (v) {
      case 'ACTIVE': return 'success';
      case 'EXPIRING_SOON': return 'warning';
      case 'EXPIRED': return 'danger';
      case 'TERMINATED': return 'danger';
      case 'RENEWED': return 'info';
      default: return 'secondary';
    }
  };

  const columns: Column<Contract>[] = [
    {
      key: 'title', header: 'Contract',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.title}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.contractNumber}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'party', header: 'Linked Party',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-sm)' }}>
          {row.customer?.name || row.vendor?.name || '—'}
        </span>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <Badge variant="info">{row.type}</Badge> },
    {
      key: 'value', header: 'Value',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
          {row.currency} {Number(row.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'renewalDate', header: 'Renewal Date',
      render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{new Date(row.renewalDate).toLocaleDateString()}</span>,
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Contracts"
        description="Manage customer and vendor contracts, track renewals, and monitor contract value across the lifecycle."
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Contracts' }]}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} style={{ marginRight: 6 }} /> New Contract
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Active Contracts" value={stats?.active ?? 0} icon={<CheckCircle size={18} />} color="var(--color-success)" />
        <KPICard title="Expiring Soon" value={stats?.expiringSoon ?? 0} icon={<Clock size={18} />} color="var(--color-warning)" />
        <KPICard title="Total Contract Value" value={`$${(stats?.totalActiveValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<DollarSign size={18} />} color="var(--color-primary)" />
        <KPICard title="Expired" value={stats?.expired ?? 0} icon={<AlertCircle size={18} />} color="var(--color-danger)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input type="text" placeholder="Search by title or contract number..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
            <option value="RENEWED">Renewed</option>
          </select>
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
            <option value="">All Types</option>
            <option value="SALES">Sales</option>
            <option value="PURCHASE">Purchase</option>
            <option value="SERVICE">Service</option>
            <option value="NDA">NDA</option>
            <option value="OTHER">Other</option>
          </select>
          <select value={`${sortBy}:${sortOrder}`} onChange={e => {
            const parts = e.target.value.split(':');
            if (parts[0] && parts[1]) {
              setSortBy(parts[0]);
              setSortOrder(parts[1] as 'asc' | 'desc');
            }
          }}
            style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
            <option value="renewalDate:asc">Renewal Date (Soonest)</option>
            <option value="renewalDate:desc">Renewal Date (Furthest)</option>
            <option value="value:desc">Value (High to Low)</option>
            <option value="value:asc">Value (Low to High)</option>
            <option value="createdAt:desc">Newest First</option>
          </select>
        </div>
      </Card>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={contracts}
          loading={loading}
          rowKey={(r) => r.id}
          onRowClick={(row) => router.push(`/crm/contracts/${row.id}`)}
          emptyTitle="No Contracts Yet"
          emptyMessage="Create your first customer or vendor contract to start tracking value, terms, and renewals."
          emptyIcon={<FileText size={48} />}
        />

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Showing Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Contract Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Contract" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create Contract'}</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
            <TextField label="Contract Number" required placeholder="CON-00001" value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} />
            <TextField label="Title" required placeholder="Annual Support Agreement" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Customer ID (optional)" placeholder="Linked customer id" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
            <TextField label="Vendor ID (optional)" placeholder="Linked vendor id" value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0 }}>At least one of Customer or Vendor must be provided.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Contract Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="SALES">Sales</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SERVICE">Service</option>
                <option value="NDA">NDA</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>
            <TextField label="Value" type="number" placeholder="12000" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            <TextField label="Currency" placeholder="USD" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Start Date" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <TextField label="End Date" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <TextField label="Renewal Date" type="date" value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', alignItems: 'end' }}>
            <FormField label="Auto-Renew">
              <Select value={form.autoRenew ? 'true' : 'false'} onChange={(e) => setForm({ ...form, autoRenew: e.target.value === 'true' })}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </FormField>
            <TextField label="Renewal Term (months)" type="number" placeholder="12" value={form.renewalTermMonths} onChange={(e) => setForm({ ...form, renewalTermMonths: e.target.value })} />
          </div>

          <TextField label="Terms / Notes" placeholder="Key terms, SLAs, special clauses..." value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}
