'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileCode2,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  Download,
  Layers,
} from 'lucide-react';

const FORMS_LIST = [
  { id: 1, name: 'Sales Order Form', module: 'Sales', submissions: 1240, lastEdited: '2 hours ago', status: 'Published', fields: 18 },
  { id: 2, name: 'Expense Claim Form', module: 'HR', submissions: 340, lastEdited: '5 hours ago', status: 'Published', fields: 12 },
  { id: 3, name: 'Purchase Request Form', module: 'Procurement', submissions: 89, lastEdited: '1 day ago', status: 'Published', fields: 9 },
  { id: 4, name: 'Leave Application Form', module: 'HR', submissions: 560, lastEdited: '2 days ago', status: 'Published', fields: 7 },
  { id: 5, name: 'Vendor Evaluation Form', module: 'Procurement', submissions: 45, lastEdited: '3 days ago', status: 'Draft', fields: 14 },
  { id: 6, name: 'Customer Feedback Form', module: 'CRM', submissions: 0, lastEdited: '1 week ago', status: 'Draft', fields: 8 },
  { id: 7, name: 'Work Order Checklist', module: 'Manufacturing', submissions: 222, lastEdited: '4 days ago', status: 'Published', fields: 11 },
  { id: 8, name: 'Asset Requisition Form', module: 'Admin', submissions: 67, lastEdited: '2 weeks ago', status: 'Published', fields: 9 },
];

const MODULES = ['All Modules', 'Sales', 'HR', 'Procurement', 'CRM', 'Manufacturing', 'Admin'];

export default function ERPFormsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [sortBy, setSortBy] = useState<'name' | 'submissions' | 'lastEdited'>('name');

  const filtered = FORMS_LIST
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(f => moduleFilter === 'All Modules' || f.module === moduleFilter)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'submissions') return b.submissions - a.submissions;
      return b.id - a.id;
    });

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <FileCode2 size={20} style={{ color: 'var(--color-primary)' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Form Builder
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Create, manage, and publish custom DocType forms across all ERP modules
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/erp')}>
            ← ERP Builder
          </button>
          <button className="frappe-btn frappe-btn-primary">
            <PlusCircle size={15} />
            <span>New Form</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { label: 'Total Forms', value: FORMS_LIST.length.toString(), icon: FileCode2, color: 'var(--color-primary)' },
          { label: 'Published', value: FORMS_LIST.filter(f => f.status === 'Published').length.toString(), icon: CheckCircle, color: '#059669' },
          { label: 'Drafts', value: FORMS_LIST.filter(f => f.status === 'Draft').length.toString(), icon: Edit3, color: '#d97706' },
          { label: 'Total Submissions', value: FORMS_LIST.reduce((a, b) => a + b.submissions, 0).toLocaleString(), icon: Layers, color: '#7c3aed' },
        ].map(stat => (
          <div key={stat.label} className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{stat.value}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '28rem' }}>
          <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input className="frappe-input" type="text" placeholder="Search forms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {MODULES.map(mod => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              style={{
                padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-full)',
                border: `1px solid ${moduleFilter === mod ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: moduleFilter === mod ? 'var(--color-primary-light)' : 'transparent',
                color: moduleFilter === mod ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: 'var(--text-xs)', fontWeight: moduleFilter === mod ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                cursor: 'pointer', transition: 'all var(--duration-fast)',
              }}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Forms Table */}
      <div className="frappe-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {[
                { label: 'Form Name', key: 'name' },
                { label: 'Module', key: 'module' },
                { label: 'Fields', key: 'fields' },
                { label: 'Submissions', key: 'submissions' },
                { label: 'Last Edited', key: 'lastEdited' },
                { label: 'Status', key: 'status' },
                { label: 'Actions', key: 'actions' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => col.key !== 'actions' && col.key !== 'module' && col.key !== 'status' && setSortBy(col.key as typeof sortBy)}
                  style={{
                    padding: 'var(--space-3) var(--space-4)', textAlign: 'left',
                    fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-text-tertiary)', textTransform: 'uppercase',
                    letterSpacing: '0.05em', cursor: col.key !== 'actions' ? 'pointer' : 'default',
                    background: 'var(--color-bg-elevated)', whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((form, idx) => (
              <tr
                key={form.id}
                style={{
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background var(--duration-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileCode2 size={13} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{form.name}</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                    {form.module}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{form.fields}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{form.submissions.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{form.lastEdited}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: form.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: form.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {form.status}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }} title="Edit" onClick={() => router.push('/builder/erp')}>
                      <Edit3 size={13} />
                    </button>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }} title="Preview">
                      <Eye size={13} />
                    </button>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }} title="Duplicate">
                      <Copy size={13} />
                    </button>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }} title="Export">
                      <Download size={13} />
                    </button>
                    <button className="frappe-btn" style={{ padding: 'var(--space-1) var(--space-2)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
