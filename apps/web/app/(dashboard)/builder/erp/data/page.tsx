'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Search,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
  Table,
  Columns,
  RefreshCw,
} from 'lucide-react';

const IMPORT_JOBS = [
  { id: 1, name: 'Q1 Customer Import', module: 'CRM', records: 1240, status: 'Completed', date: '2 days ago', errors: 0 },
  { id: 2, name: 'Product Catalog Update', module: 'Inventory', records: 386, status: 'Completed', date: '1 week ago', errors: 3 },
  { id: 3, name: 'Employee Payroll Data', module: 'HR', records: 128, status: 'Failed', date: '2 weeks ago', errors: 14 },
  { id: 4, name: 'Vendor Master Upload', module: 'Procurement', records: 95, status: 'Completed', date: '3 weeks ago', errors: 0 },
];

const SAMPLE_COLUMNS = ['Customer Name', 'Email', 'Phone', 'Country', 'Annual Revenue', 'Industry', 'Account Manager', 'Status'];
const ERP_FIELDS = ['name', 'email', 'phone', 'country', 'revenue', 'industry', 'assigned_to', 'status', '— Skip Field —'];

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ComponentType<{ size?: number }> }> = {
  Completed: { bg: 'var(--color-success-light)', text: 'var(--color-success)', icon: CheckCircle },
  Failed: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)', icon: XCircle },
  Processing: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)', icon: RefreshCw },
};

export default function ERPDataPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'jobs' | 'mapper'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('CRM');
  const [mappings, setMappings] = useState<Record<string, string>>({
    'Customer Name': 'name',
    'Email': 'email',
    'Phone': 'phone',
    'Country': 'country',
    'Annual Revenue': 'revenue',
    'Industry': 'industry',
    'Account Manager': 'assigned_to',
    'Status': 'status',
  });
  const [isDragOver, setIsDragOver] = useState(false);

  const filtered = IMPORT_JOBS.filter(j =>
    j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.module.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Database size={20} style={{ color: '#059669' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Data Import & Mapper
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Map CSV/Excel columns to ERP model fields, validate data, and bulk-import records
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/erp')}>
            ← ERP Builder
          </button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => setActiveTab('mapper')}>
            <Upload size={15} />
            <span>New Import</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-1)' }}>
        {[
          { id: 'jobs', label: 'Import History', icon: FileText },
          { id: 'mapper', label: 'Column Mapper', icon: Columns },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2.5) var(--space-4)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: activeTab === tab.id ? '#059669' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid #059669' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all var(--duration-fast)',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Import Jobs */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ position: 'relative', maxWidth: '28rem' }}>
            <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input className="frappe-input" type="text" placeholder="Search import jobs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
          </div>

          <div className="frappe-card" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
                  {['Import Name', 'Module', 'Records', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(job => {
                  const sc = (STATUS_COLORS[job.status] ?? STATUS_COLORS['Processing'])!;
                  const Icon = sc.icon;
                  return (
                    <tr key={job.id} style={{ borderBottom: '1px solid var(--color-border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Table size={14} style={{ color: '#059669' }} />
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{job.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{job.module}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{job.records.toLocaleString()}</span>
                        {job.errors > 0 && <span style={{ fontSize: '10px', marginLeft: 'var(--space-1)', color: 'var(--color-danger)' }}>{job.errors} errors</span>}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: sc.bg, color: sc.text }}>
                          <Icon size={10} />
                          {job.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{job.date}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2.5)' }} onClick={() => setActiveTab('mapper')}>
                          <RefreshCw size={12} />
                          <span>Re-import</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Column Mapper */}
      {activeTab === 'mapper' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Step 1: Upload */}
          <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4) 0', color: 'var(--color-text)' }}>
              Step 1 — Upload File & Select Target Module
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-4)', alignItems: 'start' }}>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); }}
                style={{
                  border: `2px dashed ${isDragOver ? '#059669' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  background: isDragOver ? 'rgba(5,150,105,0.05)' : 'var(--color-bg)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <Upload size={28} style={{ color: '#059669', margin: '0 auto var(--space-2)', display: 'block' }} />
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-1) 0', color: 'var(--color-text)' }}>
                  Drop your CSV or Excel file here
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0 }}>
                  or click to browse — .csv, .xlsx up to 50MB
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: '200px' }}>
                <div className="frappe-form-group" style={{ margin: 0 }}>
                  <label className="frappe-label">Target ERP Module</label>
                  <select className="frappe-input" value={selectedModule} onChange={e => setSelectedModule(e.target.value)}>
                    {['CRM', 'Inventory', 'HR', 'Finance', 'Procurement', 'Sales'].map(m => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="frappe-form-group" style={{ margin: 0 }}>
                  <label className="frappe-label">Record Type</label>
                  <select className="frappe-input">
                    <option>Customer</option>
                    <option>Contact</option>
                    <option>Lead</option>
                  </select>
                </div>
                <button className="frappe-btn frappe-btn-secondary" style={{ justifyContent: 'center' }}>
                  <FileText size={14} />
                  <span>Use Demo File</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Column Mapping */}
          <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4) 0', color: 'var(--color-text)' }}>
              Step 2 — Map Columns to ERP Fields
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              {['CSV Column', '', 'ERP Field', 'Validation'].map(h => (
                <span key={h} style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
              ))}
            </div>
            {SAMPLE_COLUMNS.map(col => {
              const mapped = mappings[col] || '— Skip Field —';
              const isSkipped = mapped === '— Skip Field —';
              return (
                <div key={col} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr 1fr', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', background: isSkipped ? 'transparent' : 'rgba(5,150,105,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text)', fontFamily: 'monospace' }}>
                    {col}
                  </div>
                  <ArrowRight size={14} style={{ color: isSkipped ? 'var(--color-text-tertiary)' : '#059669' }} />
                  <select
                    className="frappe-input"
                    style={{ fontSize: 'var(--text-xs)' }}
                    value={mapped}
                    onChange={e => setMappings({ ...mappings, [col]: e.target.value })}
                  >
                    {ERP_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <span style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: isSkipped ? 'var(--color-text-tertiary)' : '#059669' }}>
                    {isSkipped ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
                    {isSkipped ? 'Skipped' : 'Mapped'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step 3: Validate & Import */}
          <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4) 0', color: 'var(--color-text)' }}>
              Step 3 — Validate & Import
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {[
                { label: 'Total Rows', value: '1,240', color: 'var(--color-text)' },
                { label: 'Valid Rows', value: '1,226', color: '#059669' },
                { label: 'Rows with Errors', value: '14', color: 'var(--color-danger)' },
              ].map(stat => (
                <div key={stat.label} style={{ padding: 'var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: stat.color }}>{stat.value}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{stat.label}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="frappe-btn frappe-btn-secondary">
                <AlertTriangle size={14} />
                <span>Preview Errors</span>
              </button>
              <button className="frappe-btn frappe-btn-secondary">Test Import (10 rows)</button>
              <button className="frappe-btn frappe-btn-primary" style={{ marginLeft: 'auto' }}>
                <CheckCircle size={14} />
                <span>Import {(1226).toLocaleString()} Valid Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
