'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Info, FileText, ShieldCheck, Send, CheckCircle, Play } from 'lucide-react';
import { Card, Button, Badge, DataTable, type Column } from '@unerp/ui';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface VendorRow {
  vendorId: string;
  name: string;
  taxId: string | null;
  ytdPaid: number;
  crossesThreshold: boolean;
  profile: {
    is1099Vendor: boolean;
    formType: string;
    defaultBox: string;
    w9OnFile: boolean;
    tinMatchStatus: string;
    backupWithholdingActive: boolean;
  } | null;
}

interface Form1099 {
  id: string;
  taxYear: number;
  formType: string;
  totalAmount: number;
  federalWithholding: number;
  status: 'DRAFT' | 'READY' | 'FILED' | 'CORRECTED' | 'VOID';
  vendor: { name: string; taxId: string | null };
  batchId: string | null;
}

interface Batch {
  id: string;
  name: string;
  taxYear: number;
  status: 'DRAFT' | 'GENERATED' | 'SUBMITTED';
  formCount: number;
  totalAmount: number;
  efileConfirmation: string | null;
}

interface Summary {
  taxYear: number;
  totalForms: number;
  totalAmount: number;
  batchCount: number;
  byStatus: { status: string; count: number; amount: number }[];
}

const CURRENT_YEAR = new Date().getFullYear();

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'default',
  READY: 'warning',
  FILED: 'success',
  CORRECTED: 'default',
  VOID: 'danger',
  GENERATED: 'warning',
  SUBMITTED: 'success',
};

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function Form1099ReportingPage() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [activeTab, setActiveTab] = useState<'vendors' | 'forms' | 'batches'>('vendors');
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [forms, setForms] = useState<Form1099[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorsRes, formsRes, batchesRes, summaryRes] = await Promise.all([
        apiGet<VendorRow[]>(`/advanced-finance/1099/vendors?taxYear=${taxYear}`),
        apiGet<Form1099[]>(`/advanced-finance/1099/forms?taxYear=${taxYear}`),
        apiGet<Batch[]>(`/advanced-finance/1099/batches?taxYear=${taxYear}`),
        apiGet<Summary>(`/advanced-finance/1099/summary?taxYear=${taxYear}`),
      ]);
      setVendors(vendorsRes || []);
      setForms(formsRes || []);
      setBatches(batchesRes || []);
      setSummary(summaryRes || null);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to load 1099 reporting dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [taxYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMark1099Vendor = async (vendorId: string, current: boolean) => {
    try {
      await apiPatch(`/advanced-finance/1099/vendor-profiles/${vendorId}`, { is1099Vendor: !current, formType: 'NEC', defaultBox: '1' });
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to update vendor 1099 flag.'));
    }
  };

  const handleTinMatch = async (vendorId: string) => {
    try {
      await apiPost(`/advanced-finance/1099/vendor-profiles/${vendorId}/tin-match`, {});
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to run TIN match.'));
    }
  };

  const handleGenerateForms = async () => {
    try {
      const result = await apiPost<{ createdCount: number; skippedExisting: number }>('/advanced-finance/1099/generate', { taxYear });
      setActiveTab('forms');
      loadData();
      alert(`Generated ${result.createdCount} draft form(s); ${result.skippedExisting} already existed.`);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to generate 1099 forms.'));
    }
  };

  const handleMarkReady = async (id: string) => {
    try {
      await apiPost(`/advanced-finance/1099/forms/${id}/mark-ready`, {});
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to mark form ready.'));
    }
  };

  const handleFile = async (id: string) => {
    try {
      await apiPost(`/advanced-finance/1099/forms/${id}/file`, {});
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to file form.'));
    }
  };

  const toggleFormSelection = (id: string) => {
    setSelectedFormIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleCreateBatch = async () => {
    if (selectedFormIds.length === 0) {
      setError('Select at least one READY form to batch.');
      return;
    }
    try {
      await apiPost('/advanced-finance/1099/batches', {
        taxYear,
        name: `1099 Batch ${taxYear}-${new Date().toISOString().slice(0, 10)}`,
        formIds: selectedFormIds,
      });
      setSelectedFormIds([]);
      setActiveTab('batches');
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to create e-file batch.'));
    }
  };

  const handleEfileBatch = async (id: string) => {
    if (!confirm('Submit this batch to the IRS FIRE e-file system? This marks all forms FILED.')) return;
    try {
      await apiPost(`/advanced-finance/1099/batches/${id}/efile`, {});
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to e-file batch.'));
    }
  };

  const readyForms = forms.filter((f) => f.status === 'READY' && !f.batchId);

  const vendorColumns: Column<VendorRow>[] = [
    { key: 'name', header: 'Vendor', sortable: true, render: (v) => <span className="font-medium">{v.name}</span> },
    { key: 'taxId', header: 'Tax ID', render: (v) => v.taxId || '—' },
    {
      key: 'ytdPaid',
      header: 'YTD Paid',
      sortable: true,
      render: (v) => (
        <span>
          ${v.ytdPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          {v.crossesThreshold && <Badge variant="warning" className="ml-2">Over $600</Badge>}
        </span>
      ),
    },
    {
      key: 'is1099Vendor',
      header: '1099 Vendor',
      render: (v) => <Badge variant={v.profile?.is1099Vendor ? 'success' : 'default'}>{v.profile?.is1099Vendor ? 'Yes' : 'No'}</Badge>,
    },
    {
      key: 'w9OnFile',
      header: 'W-9',
      render: (v) => <Badge variant={v.profile?.w9OnFile ? 'success' : 'danger'}>{v.profile?.w9OnFile ? 'On File' : 'Missing'}</Badge>,
    },
    {
      key: 'tinMatchStatus',
      header: 'TIN Match',
      render: (v) => (
        <Badge variant={v.profile?.tinMatchStatus === 'MATCHED' ? 'success' : v.profile?.tinMatchStatus === 'MISMATCH' ? 'danger' : 'default'}>
          {v.profile?.tinMatchStatus || 'NOT_CHECKED'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (v) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleMark1099Vendor(v.vendorId, v.profile?.is1099Vendor ?? false); }}>
            {v.profile?.is1099Vendor ? 'Unmark' : 'Mark 1099'}
          </Button>
          <Button variant="secondary" size="sm" className="flex items-center gap-1 inline-flex" onClick={(e) => { e.stopPropagation(); handleTinMatch(v.vendorId); }}>
            <ShieldCheck size={12} /> TIN Match
          </Button>
        </div>
      ),
    },
  ];

  const formColumns: Column<Form1099>[] = [
    {
      key: 'select',
      header: '',
      width: '2.5rem',
      render: (f) =>
        f.status === 'READY' && !f.batchId ? (
          <input
            type="checkbox"
            checked={selectedFormIds.includes(f.id)}
            onChange={(e) => { e.stopPropagation(); toggleFormSelection(f.id); }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : null,
    },
    { key: 'vendorName', header: 'Vendor', sortable: true, render: (f) => <span className="font-medium">{f.vendor.name}</span> },
    { key: 'formType', header: 'Form Type', render: (f) => `1099-${f.formType}` },
    { key: 'totalAmount', header: 'Total Amount', sortable: true, render: (f) => `$${Number(f.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { key: 'federalWithholding', header: 'Withholding', render: (f) => `$${Number(f.federalWithholding).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { key: 'status', header: 'Status', sortable: true, render: (f) => <Badge variant={statusVariant[f.status]}>{f.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (f) => (
        <div className="flex justify-end gap-2">
          {f.status === 'DRAFT' && (
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleMarkReady(f.id); }}>Mark Ready</Button>
          )}
          {f.status === 'READY' && !f.batchId && (
            <Button variant="primary" size="sm" className="flex items-center gap-1 inline-flex" onClick={(e) => { e.stopPropagation(); handleFile(f.id); }}>
              <CheckCircle size={12} /> File
            </Button>
          )}
        </div>
      ),
    },
  ];

  const batchColumns: Column<Batch>[] = [
    { key: 'name', header: 'Batch', sortable: true, render: (b) => <span className="font-medium">{b.name}</span> },
    { key: 'formCount', header: 'Forms', sortable: true },
    { key: 'totalAmount', header: 'Total Amount', sortable: true, render: (b) => `$${Number(b.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { key: 'status', header: 'Status', render: (b) => <Badge variant={statusVariant[b.status]}>{b.status}</Badge> },
    { key: 'efileConfirmation', header: 'E-File Confirmation', render: (b) => <span className="font-mono text-xs">{b.efileConfirmation || '—'}</span> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (b) =>
        b.status === 'GENERATED' ? (
          <Button variant="primary" size="sm" className="flex items-center gap-1 inline-flex" onClick={(e) => { e.stopPropagation(); handleEfileBatch(b.id); }}>
            <Send size={12} /> Submit E-File
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold ui-text-primary">1099 / Vendor Tax Reporting</h1>
          <p className="text-sm ui-text-muted mt-1">Track vendor 1099 eligibility, generate IRS forms, and submit e-file batches</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="ui-input text-sm" value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))}>
            {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={handleGenerateForms}>
            <Play size={16} /> Generate Forms
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs ui-text-muted">Total Forms ({taxYear})</p>
            <p className="text-2xl font-bold ui-text-primary">{summary.totalForms}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs ui-text-muted">Total Reportable Amount</p>
            <p className="text-2xl font-bold ui-text-primary">${summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs ui-text-muted">Filed</p>
            <p className="text-2xl font-bold text-green-600">{summary.byStatus.find((s) => s.status === 'FILED')?.count || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs ui-text-muted">E-File Batches</p>
            <p className="text-2xl font-bold ui-text-primary">{summary.batchCount}</p>
          </Card>
        </div>
      )}

      <div className="flex border-b border-gray-200">
        {(['vendors', 'forms', 'batches'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-4 font-medium text-sm border-b-2 transition-all capitalize ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab === 'vendors' ? `Vendor Eligibility (${vendors.length})` : tab === 'forms' ? `Forms (${forms.length})` : `Batches (${batches.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'vendors' ? (
        <DataTable
          columns={vendorColumns}
          data={vendors}
          loading={loading}
          rowKey={(v) => v.vendorId}
          emptyTitle="No vendors found"
          emptyMessage="Vendors will appear here once created in Procurement."
          emptyIcon={<Info size={48} />}
        />
      ) : activeTab === 'forms' ? (
        <div className="space-y-3">
          {readyForms.length > 0 && (
            <div className="flex justify-end">
              <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={handleCreateBatch}>
                <Send size={14} /> Create E-File Batch ({selectedFormIds.length} selected)
              </Button>
            </div>
          )}
          <DataTable
            columns={formColumns}
            data={forms}
            loading={loading}
            rowKey={(f) => f.id}
            emptyTitle={`No 1099 forms generated for ${taxYear}`}
            emptyMessage='Click "Generate Forms" to create draft forms for all eligible vendors crossing the $600 threshold.'
            emptyIcon={<FileText size={48} />}
          />
        </div>
      ) : (
        <DataTable
          columns={batchColumns}
          data={batches}
          loading={loading}
          rowKey={(b) => b.id}
          emptyTitle="No e-file batches yet"
          emptyMessage="Select READY forms in the Forms tab to bundle them into an e-file batch."
          emptyIcon={<Send size={48} />}
        />
      )}
    </div>
  );
}
