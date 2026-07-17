'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { PageHeader, StatCardRow, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import {
  Upload,
  Download,
  Search,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  Database,
  ChevronDown,
  ChevronRight,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface ImportJob {
  id: string;
  name: string;
  targetModel: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  status: string;
  errorLog: any[];
  createdAt: string;
  completedAt?: string;
}

export default function DataImportPage() {
  const client = useApiClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetModel, setTargetModel] = useState('customers');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importName, setImportName] = useState('');

  const MODELS = [
    { value: 'customers', label: 'Customers' },
    { value: 'vendors', label: 'Vendors' },
    { value: 'products', label: 'Products' },
    { value: 'employees', label: 'Employees' },
    { value: 'invoices', label: 'Invoices' },
    { value: 'contacts', label: 'Contacts' },
    { value: 'leads', label: 'Leads' },
    { value: 'opportunities', label: 'Opportunities' },
  ];

  const fetchImports = async () => {
    setLoading(true);
    try {
      const data = await client.get<any[] | { data?: any[] }>('/builder/data-imports');
      setImports(Array.isArray(data) ? data : data.data || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, [client]);

  const handleStartImport = async () => {
    if (!selectedFile || !importName) return;
    try {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data;
          
          const job = await client.post<any>('/builder/data-imports', {
              name: importName,
              targetModel,
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              totalRows: rows.length,
              columnMapping,
          });
          setShowWizard(false);
          setSelectedFile(null);
          setImportName('');
          setStep(1);
          fetchImports();

            // Execute import
          await client.post(`/builder/data-imports/${job.id}/execute`, { rows });
            
            // Refresh status
          fetchImports();
        }
      });
    } catch { /* ignore */ }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      COMPLETED: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
      FAILED: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
      IMPORTING: { bg: '#3b82f620', color: '#3b82f6' },
      VALIDATING: { bg: '#f59e0b20', color: '#f59e0b' },
      PENDING: { bg: '#64748b20', color: '#64748b' },
    };
    const c = colors[status] || { bg: '#64748b20', color: '#64748b' };
    return <span style={{ background: c.bg, color: c.color }} className={styles.s1}>{status}</span>;
  };

  const importColumns: ListColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'targetModel', header: 'Target', render: (v) => <span className={styles.s2}>{String(v)}</span> },
    { key: 'fileName', header: 'File' },
    { key: 'totalRows', header: 'Rows' },
    { key: 'importedRows', header: 'Imported', render: (v) => <span className="ui-text-success">{String(v)}</span> },
    { key: 'failedRows', header: 'Failed', render: (v, row) => { const r = row as unknown as ImportJob; return <span style={{ color: r.failedRows > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>{String(v)}</span>; } },
    { key: 'status', header: 'Status', render: (v) => statusBadge(String(v)) },
    { key: 'createdAt', header: 'Date', render: (v) => v ? new Date(String(v)).toLocaleDateString() : 'N/A' },
  ];

  return (
    <div className="p-6 ui-stack-5">
      {/* Header */}
      <PageHeader
        title="Data Import"
        description="Import records from CSV/Excel files into any ERP module"
        actions={
          <div className="ui-flex ui-gap-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder/erp')}>← App Studio</button>
            <button className="ui-btn ui-btn-primary" onClick={() => setShowWizard(true)}>
              <Upload size={15} /> <span>New Import</span>
            </button>
          </div>
        }
      />

      {/* Import Wizard Modal */}
      {showWizard && (
        <div className={styles.s3}
          onClick={() => setShowWizard(false)}
        >
          <div className={`ui-card ${styles.s4}`} 
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.s5}>
              <div className="ui-flex-between">
                <h3 className={styles.s6}>New Data Import</h3>
                <button className={`ui-btn ${styles.s7}`}  onClick={() => setShowWizard(false)}>×</button>
              </div>
              <div className={styles.s8}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ background: step >= s ? 'var(--color-primary)' : 'var(--color-border)' }} className={styles.s9} />
                ))}
              </div>
              <div className={styles.s10}>
                <span style={{ color: step >= 1 ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: step >= 1 ? 600 : 400 }} className={styles.s11}>Select File</span>
                <span style={{ color: step >= 2 ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: step >= 2 ? 600 : 400 }} className={styles.s11}>Map Columns</span>
                <span style={{ color: step >= 3 ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: step >= 3 ? 600 : 400 }} className={styles.s11}>Confirm</span>
              </div>
            </div>

            <div className="p-4">
              {step === 1 && (
                <div className="ui-stack-4">
                  <div className="ui-form-group">
                    <label className="ui-label">Import Name</label>
                    <input className="ui-input" type="text" placeholder="e.g. Q1 Customer Import" value={importName} onChange={e => setImportName(e.target.value)} />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Target Module</label>
                    <select className="ui-input" value={targetModel} onChange={e => setTargetModel(e.target.value)}>
                      {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">CSV / Excel File</label>
                    <div
                      className={`${styles.s12} ${styles.fileDropzone}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className={styles.s13} onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                      {selectedFile ? (
                        <div>
                          <FileSpreadsheet size={32} className={styles.s14} />
                          <p className={styles.s15}>{selectedFile.name}</p>
                          <p className="ui-text-xs-muted m-0">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <div>
                          <Upload size={32} className={styles.s16} />
                          <p className={styles.s17}>Click to select a CSV or Excel file</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ui-flex-end ui-gap-2">
                    <button className="ui-btn ui-btn-secondary" onClick={() => setShowWizard(false)}>Cancel</button>
                    <button className="ui-btn ui-btn-primary" disabled={!selectedFile || !importName} onClick={() => setStep(2)}>Next: Map Columns</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="ui-stack-4">
                  <p className={styles.s18}>Map CSV columns to database fields:</p>
                  {['name', 'email', 'phone', 'status'].map(col => (
                    <div key={col} className="ui-form-group ui-hstack-2">
                      <span className={styles.s19}>{col}</span>
                      <ChevronRight size={12} className="ui-text-tertiary" />
                      <select className="ui-input" value={columnMapping[col] || col} onChange={e => setColumnMapping({ ...columnMapping, [col]: e.target.value })}>
                        <option value="">Skip column</option>
                        <option value="name">Name</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="status">Status</option>
                        <option value="notes">Notes</option>
                        <option value="address">Address</option>
                      </select>
                    </div>
                  ))}
                  <div className="ui-flex-between">
                    <button className="ui-btn ui-btn-secondary" onClick={() => setStep(1)}>← Back</button>
                    <button className="ui-btn ui-btn-primary" onClick={() => setStep(3)}>Next: Confirm</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="ui-stack-4">
                  <div className={styles.s20}>
                    <p className={styles.s21}>Import Summary</p>
                    <div className={styles.s22}>
                      <span className="ui-text-muted">Name:</span><span>{importName}</span>
                      <span className="ui-text-muted">Target:</span><span>{MODELS.find(m => m.value === targetModel)?.label}</span>
                      <span className="ui-text-muted">File:</span><span>{selectedFile?.name}</span>
                    </div>
                  </div>
                  <div className="ui-flex-between">
                    <button className="ui-btn ui-btn-secondary" onClick={() => setStep(2)}>← Back</button>
                    <button className="ui-btn ui-btn-primary" onClick={handleStartImport}>
                      <Upload size={14} /> <span>Start Import</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <StatCardRow stats={[
        { label: 'Total Imports', value: imports.length.toString(), color: '#059669' },
        { label: 'Completed', value: imports.filter(i => i.status === 'COMPLETED').length.toString(), color: '#10b981' },
        { label: 'Failed', value: imports.filter(i => i.status === 'FAILED').length.toString(), color: '#ef4444' },
        { label: 'Total Rows', value: imports.reduce((a, i) => a + i.totalRows, 0).toLocaleString(), color: '#3b82f6' },
      ]} />

      {/* Import Jobs Table */}
      <ListPageTemplate
        title=""
        columns={importColumns}
        data={imports as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No imports yet"
        emptyDescription='Click "New Import" to start.'
      />
    </div>
  );
}
