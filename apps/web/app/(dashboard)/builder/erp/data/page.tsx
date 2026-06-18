'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/builder/data-imports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setImports(Array.isArray(data) ? data : data.data || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, []);

  const handleStartImport = async () => {
    if (!selectedFile || !importName) return;
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/builder/data-imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: importName,
          targetModel,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          totalRows: 0,
          columnMapping,
        }),
      });
      if (res.ok) {
        setShowWizard(false);
        setSelectedFile(null);
        setImportName('');
        setStep(1);
        fetchImports();
      }
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
    return <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: c.bg, color: c.color }}>{status}</span>;
  };

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="builder-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Upload size={20} style={{ color: '#059669' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Data Import
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Import records from CSV/Excel files into any ERP module
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/erp')}>← ERP Builder</button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => setShowWizard(true)}>
            <Upload size={15} /> <span>New Import</span>
          </button>
        </div>
      </div>

      {/* Import Wizard Modal */}
      {showWizard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowWizard(false)}
        >
          <div className="frappe-card" style={{ width: '560px', maxHeight: '80vh', overflow: 'auto', zIndex: 1001 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>New Data Import</h3>
                <button className="frappe-btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }} onClick={() => setShowWizard(false)}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= s ? 'var(--color-primary)' : 'var(--color-border)' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-1.5)' }}>
                <span style={{ fontSize: '11px', color: step >= 1 ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: step >= 1 ? 600 : 400 }}>Select File</span>
                <span style={{ fontSize: '11px', color: step >= 2 ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: step >= 2 ? 600 : 400 }}>Map Columns</span>
                <span style={{ fontSize: '11px', color: step >= 3 ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: step >= 3 ? 600 : 400 }}>Confirm</span>
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)' }}>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group">
                    <label className="frappe-label">Import Name</label>
                    <input className="frappe-input" type="text" placeholder="e.g. Q1 Customer Import" value={importName} onChange={e => setImportName(e.target.value)} />
                  </div>
                  <div className="frappe-form-group">
                    <label className="frappe-label">Target Module</label>
                    <select className="frappe-input" value={targetModel} onChange={e => setTargetModel(e.target.value)}>
                      {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="frappe-form-group">
                    <label className="frappe-label">CSV / Excel File</label>
                    <div
                      style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer', transition: 'all var(--duration-fast)' }}
                      onClick={() => fileInputRef.current?.click()}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-light)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = ''; }}
                    >
                      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                      {selectedFile ? (
                        <div>
                          <FileSpreadsheet size={32} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-2)', display: 'block' }} />
                          <p style={{ fontWeight: 'var(--weight-semibold)', margin: 0 }}>{selectedFile.name}</p>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <div>
                          <Upload size={32} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto var(--space-2)', display: 'block', opacity: 0.4 }} />
                          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Click to select a CSV or Excel file</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <button className="frappe-btn frappe-btn-secondary" onClick={() => setShowWizard(false)}>Cancel</button>
                    <button className="frappe-btn frappe-btn-primary" disabled={!selectedFile || !importName} onClick={() => setStep(2)}>Next: Map Columns</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>Map CSV columns to database fields:</p>
                  {['name', 'email', 'phone', 'status'].map(col => (
                    <div key={col} className="frappe-form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', width: '100px', color: 'var(--color-text-secondary)' }}>{col}</span>
                      <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                      <select className="frappe-input" value={columnMapping[col] || col} onChange={e => setColumnMapping({ ...columnMapping, [col]: e.target.value })}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button className="frappe-btn frappe-btn-secondary" onClick={() => setStep(1)}>← Back</button>
                    <button className="frappe-btn frappe-btn-primary" onClick={() => setStep(3)}>Next: Confirm</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ background: 'var(--color-bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-2) 0' }}>Import Summary</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Name:</span><span>{importName}</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Target:</span><span>{MODELS.find(m => m.value === targetModel)?.label}</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>File:</span><span>{selectedFile?.name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button className="frappe-btn frappe-btn-secondary" onClick={() => setStep(2)}>← Back</button>
                    <button className="frappe-btn frappe-btn-primary" onClick={handleStartImport}>
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
      <div className="builder-stats-grid">
        {[
          { label: 'Total Imports', value: imports.length.toString(), icon: Upload, color: '#059669' },
          { label: 'Completed', value: imports.filter(i => i.status === 'COMPLETED').length.toString(), icon: CheckCircle, color: '#10b981' },
          { label: 'Failed', value: imports.filter(i => i.status === 'FAILED').length.toString(), icon: AlertCircle, color: '#ef4444' },
          { label: 'Total Rows', value: imports.reduce((a, i) => a + i.totalRows, 0).toLocaleString(), icon: Database, color: '#3b82f6' },
        ].map(stat => (
          <div key={stat.label} className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{stat.value}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Import Jobs Table */}
      <div className="frappe-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Name', 'Target', 'File', 'Rows', 'Imported', 'Failed', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--color-bg-elevated)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</td></tr>
            ) : imports.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <Upload size={24} style={{ opacity: 0.3, margin: '0 auto var(--space-2)', display: 'block' }} />
                No imports yet. Click "New Import" to start.
              </td></tr>
            ) : imports.map((imp, idx) => (
              <tr key={imp.id} style={{ borderBottom: idx < imports.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background var(--duration-fast)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{imp.name}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}><span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: '#3b82f620', color: '#3b82f6', fontWeight: 600 }}>{imp.targetModel}</span></td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{imp.fileName}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>{imp.totalRows}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-success)' }}>{imp.importedRows}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: imp.failedRows > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>{imp.failedRows}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{statusBadge(imp.status)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{imp.createdAt ? new Date(imp.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}