'use client';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, Pagination,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Plus, FileText, Globe } from 'lucide-react';
import Link from 'next/link';

interface CustomsDocument {
  id: string;
  documentNumber: string;
  type: string;
  direction: string;
  shipmentRef: string;
  status: string;
  filedDate: string;
  clearedDate: string | null;
}

const statusVariant = (s: string) => {
  if (s === 'CLEARED') return 'success';
  if (s === 'DRAFT') return 'default';
  if (s === 'SUBMITTED') return 'info';
  if (s === 'IN_REVIEW') return 'warning';
  if (s === 'REJECTED') return 'danger';
  return 'default';
};

export default function CustomsPage() {
  const client = useApiClient();
  const [documents, setDocuments] = useState<CustomsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [sortBy, setSortBy] = useState('documentNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ documentNumber: '', type: 'IMPORT_DECLARATION', direction: 'IMPORT', shipmentRef: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', sortBy, sortOrder });
      const res = await client.get<{ data: CustomsDocument[]; total: number; page: number; pageCount: number }>(`/supply-chain/customs?${params}`);
      setDocuments(res.data ?? []);
      setPageCount(res.pageCount ?? 1);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, sortBy, sortOrder]);

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.documentNumber) return;
    setSaving(true);
    try {
      await client.post('/supply-chain/customs', form);
      setCreateOpen(false);
      setForm({ documentNumber: '', type: 'IMPORT_DECLARATION', direction: 'IMPORT', shipmentRef: '' });
      setPage(1);
      fetchData(1);
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const columns: Column<CustomsDocument>[] = [
    {
      key: 'documentNumber', header: 'Document #', sortable: true,
      render: (row) => <Link href={`/supply-chain/customs/${row.id}`} className="ui-link">{row.documentNumber}</Link>,
    },
    { key: 'type', header: 'Type', sortable: true, render: (row) => <Badge variant="info">{row.type.replace(/_/g, ' ')}</Badge> },
    { key: 'direction', header: 'Direction', render: (row) => <Badge variant={row.direction === 'IMPORT' ? 'primary' : 'warning'}>{row.direction}</Badge> },
    { key: 'shipmentRef', header: 'Shipment Ref', sortable: true },
    {
      key: 'status', header: 'Status', sortable: true,
      render: (row) => (
        <Badge variant={statusVariant(row.status)}>{row.status.replace(/_/g, ' ')}</Badge>
      ),
    },
    { key: 'filedDate', header: 'Filed Date', sortable: true, render: (row) => new Date(row.filedDate).toLocaleDateString() },
    { key: 'clearedDate', header: 'Cleared Date', render: (row) => row.clearedDate ? new Date(row.clearedDate).toLocaleDateString() : <span className="ui-text-xs-muted">—</span> },
    {
      key: 'actions', header: 'Actions', align: 'right',
      render: (row) => (
        <div className="ui-flex ui-gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="ui-btn-icon" onClick={() => window.open(`/supply-chain/customs/${row.id}`, '_blank')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button className="ui-btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <RouteGuard permission="supply-chain.customs.read">
    <div className="ui-stack-6">
      <PageHeader title="Customs Documents" description="Manage import/export customs declarations and clearance"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Customs' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Customs Document</Button>}
      />

      <Card padding="none">
        <DataTable columns={columns} data={documents} loading={loading} rowKey={r => r.id}
          sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSort}
          emptyTitle="No customs documents" emptyMessage="Create your first customs declaration." emptyIcon={<Globe size={48} />} />
      </Card>

      {pageCount > 1 && (
        <div className="ui-flex ui-justify-center">
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Customs Document" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={saving}>{saving ? 'Saving...' : 'Create Document'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <TextField label="Document #" required placeholder="CD-2026-001" value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value })} />
          <div className="ui-grid-2 ui-gap-3">
            <FormField label="Type"><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="IMPORT_DECLARATION">Import Declaration</option><option value="EXPORT_DECLARATION">Export Declaration</option>
              <option value="CERT_OF_ORIGIN">Cert of Origin</option><option value="BILL_OF_LADING">Bill of Lading</option>
            </Select></FormField>
            <FormField label="Direction"><Select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
              <option value="IMPORT">Import</option><option value="EXPORT">Export</option>
            </Select></FormField>
          </div>
          <TextField label="Shipment Reference" placeholder="SHP-2026-001" value={form.shipmentRef} onChange={e => setForm({ ...form, shipmentRef: e.target.value })} />
        </form>
      </Modal>
    </div>
    </RouteGuard>
  );
}
