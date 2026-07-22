'use client';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, Pagination,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Plus, Search, Eye, Edit, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

interface Contract {
  id: string;
  contractNumber: string;
  vendor: string;
  type: string;
  value: number;
  status: string;
  startDate: string;
  endDate: string;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ContractsPage() {
  const client = useApiClient();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('contractNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorSearch, setVendorSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [form, setForm] = useState({ contractNumber: '', vendor: '', type: 'SERVICE', value: 0, status: 'DRAFT', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', sortBy, sortOrder });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (vendorSearch) params.set('vendor', vendorSearch);
      const res = await client.get<{ data: Contract[]; total: number; page: number; pageCount: number }>(`/supply-chain/contracts?${params}`);
      setContracts(res.data ?? []);
      setTotal(res.total ?? 0);
      setPageCount(res.pageCount ?? 1);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, sortBy, sortOrder, statusFilter, vendorSearch]);

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contractNumber || !form.vendor) return;
    setSaving(true);
    try {
      await client.post('/supply-chain/contracts', form);
      setCreateOpen(false);
      setForm({ contractNumber: '', vendor: '', type: 'SERVICE', value: 0, status: 'DRAFT', startDate: '', endDate: '' });
      setPage(1);
      fetchData(1);
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContract) return;
    setSaving(true);
    try {
      await client.patch(`/supply-chain/contracts/${editContract.id}`, form);
      setEditContract(null);
      fetchData(page);
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contract?')) return;
    try {
      await client.delete(`/supply-chain/contracts/${id}`);
      fetchData(page);
    } catch { /* empty */ }
  };

  const openEdit = (c: Contract) => {
    setEditContract(c);
    setForm({ contractNumber: c.contractNumber, vendor: c.vendor, type: c.type, value: c.value, status: c.status, startDate: c.startDate, endDate: c.endDate });
  };

  const columns: Column<Contract>[] = [
    {
      key: 'contractNumber', header: 'Contract #', sortable: true,
      render: (row) => <Link href={`/supply-chain/contracts/${row.id}`} className="ui-link">{row.contractNumber}</Link>,
    },
    { key: 'vendor', header: 'Vendor', sortable: true },
    { key: 'type', header: 'Type', sortable: true, render: (row) => <Badge variant={row.type === 'SERVICE' ? 'info' : row.type === 'MATERIAL' ? 'primary' : 'warning'}>{row.type}</Badge> },
    { key: 'value', header: 'Value', sortable: true, render: (row) => fmtCurrency(row.value) },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'dates', header: 'Start-End', render: (row) => <span className="ui-text-xs-muted">{new Date(row.startDate).toLocaleDateString()} — {new Date(row.endDate).toLocaleDateString()}</span> },
    {
      key: 'actions', header: 'Actions', align: 'right',
      render: (row) => (
        <div className="ui-flex ui-gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="ui-btn-icon" onClick={() => window.open(`/supply-chain/contracts/${row.id}`, '_blank')}><Eye size={14} /></button>
          <button className="ui-btn-icon" onClick={() => openEdit(row)}><Edit size={14} /></button>
          <button className="ui-btn-icon ui-text-danger" onClick={() => handleDelete(row.id)}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <RouteGuard permission="supply-chain.contracts.read">
    <div className="ui-stack-6">
      <PageHeader title="Supplier Contracts" description="Manage supplier agreements and contract lifecycle"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Contracts' }]}
        actions={<Button variant="primary" onClick={() => { setEditContract(null); setForm({ contractNumber: '', vendor: '', type: 'SERVICE', value: 0, status: 'DRAFT', startDate: '', endDate: '' }); setCreateOpen(true); }}><Plus size={14} /> New Contract</Button>}
      />

      <Card>
        <div className="ui-flex ui-gap-3 ui-items-center" style={{ marginBottom: '1rem' }}>
          <div className="ui-search-wrapper">
            <Search size={16} className="ui-search-icon" />
            <input type="text" placeholder="Search vendor..." value={vendorSearch} onChange={(e) => setVendorSearch(e.target.value)} className="ui-input" />
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </Select>
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={contracts} loading={loading} rowKey={r => r.id}
          sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSort}
          emptyTitle="No contracts" emptyMessage="Create your first supplier contract." emptyIcon={<FileText size={48} />} />
      </Card>

      {pageCount > 1 && (
        <div className="ui-flex ui-justify-center">
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Contract" size="lg"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={saving}>{saving ? 'Saving...' : 'Create Contract'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Contract #" required placeholder="CT-2026-001" value={form.contractNumber} onChange={e => setForm({ ...form, contractNumber: e.target.value })} />
            <TextField label="Vendor" required placeholder="Acme Corp" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <FormField label="Type"><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="SERVICE">Service</option><option value="MATERIAL">Material</option><option value="LEASE">Lease</option><option value="FRAMEWORK">Framework</option>
            </Select></FormField>
            <TextField label="Value ($)" type="number" min={0} step={0.01} value={form.value || ''} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Start Date" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <TextField label="End Date" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal open={!!editContract} onClose={() => setEditContract(null)} title="Edit Contract" size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditContract(null)}>Cancel</Button><Button variant="primary" onClick={handleEdit as any} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button></>}>
        <form onSubmit={handleEdit} className="ui-stack-4">
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Contract #" required value={form.contractNumber} onChange={e => setForm({ ...form, contractNumber: e.target.value })} />
            <TextField label="Vendor" required value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <FormField label="Type"><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="SERVICE">Service</option><option value="MATERIAL">Material</option><option value="LEASE">Lease</option><option value="FRAMEWORK">Framework</option>
            </Select></FormField>
            <TextField label="Value ($)" type="number" min={0} step={0.01} value={form.value || ''} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Start Date" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <TextField label="End Date" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
    </RouteGuard>
  );
}
