'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileCode2,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  Layers,
  Globe,
} from 'lucide-react';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';

const MODULES = ['All Modules', 'Sales', 'HR', 'Procurement', 'CRM', 'Manufacturing', 'Admin'];

export function ERPFormsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [sortBy, setSortBy] = useState<'name' | 'submissions' | 'lastEdited'>('name');

  // API Data State
  const [formsList, setFormsList] = useState<any[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, totalSubmissions: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load stats
  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/builder/forms/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setStats(d);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load forms
  const loadForms = async () => {
    setLoadingForms(true);
    try {
      const token = localStorage.getItem('token') || '';
      const query = new URLSearchParams();
      if (debouncedSearch) query.append('search', debouncedSearch);
      if (moduleFilter && moduleFilter !== 'All Modules') query.append('module', moduleFilter);

      const res = await fetch(`/api/v1/builder/forms?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        const forms = (d.data || d).map((f: any) => ({
          id: f.id,
          name: f.name,
          slug: f.slug,
          module: f.module || 'Sales',
          submissions: f.submissions || 0,
          lastEdited: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : 'N/A',
          status: f.status || 'DRAFT',
          fields: Array.isArray(f.fields) ? f.fields.length : (typeof f.fields === 'string' ? JSON.parse(f.fields).length : 0),
        }));
        setFormsList(forms);
      }
    } catch (err) {
      console.error('Error loading forms:', err);
    } finally {
      setLoadingForms(false);
    }
  };

  // Trigger loading of data
  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadForms();
  }, [debouncedSearch, moduleFilter]);

  // Check if '?new=1' query is present to auto-open creation dialog
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Create blank form and redirect
  const handleSave = async (data: any) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/builder/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          module: data.module || 'Sales',
          fields: [
            { id: 'f_1', type: 'Section Break', label: 'General Info', name: 'general_info_section', required: false, readOnly: false, weight: 1, columnSpan: 12 },
            { id: 'f_2', type: 'Data', label: 'Form Name', name: 'form_name', required: true, readOnly: false, columnSpan: 12 },
            { id: 'f_3', type: 'Select', label: 'Status', name: 'status', required: false, readOnly: false, options: 'Draft\nPublished', columnSpan: 12 },
          ],
          settings: {},
        })
      });
      if (res.ok) {
        const newForm = await res.json();
        setIsModalOpen(false);
        router.push(`/builder/erp/forms/${newForm.id}`);
      } else {
        const err = await res.json();
        alert(`Failed to create form: ${err.message || 'Check backend.'}`);
      }
    } catch (err) {
      alert("Failed to create form. Please check backend.");
    }
  };

  // Duplicate Form
  const handleDuplicate = async (form: any) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/builder/forms/${form.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch original form');
      const original = await res.json();

      const dupRes = await fetch('/api/v1/builder/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: `Copy of ${original.name}`,
          slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
          module: original.module || 'Sales',
          fields: typeof original.fields === 'string' ? JSON.parse(original.fields) : original.fields,
          settings: typeof original.settings === 'string' ? JSON.parse(original.settings) : original.settings
        })
      });
      if (dupRes.ok) {
        loadForms();
        loadStats();
      } else {
        const err = await dupRes.json();
        alert(`Failed to duplicate: ${err.message || 'Server error'}`);
      }
    } catch (err) {
      alert('Error duplicating form');
    }
  };

  // Delete Form
  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to delete this form?')) {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/forms/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          loadForms();
          loadStats();
        } else {
          alert('Failed to delete form');
        }
      } catch (err) {
        alert('Error deleting form');
      }
    }
  };

  // Local sorting
  const sortedForms = [...formsList].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'submissions') return b.submissions - a.submissions;
    return b.id.localeCompare(a.id);
  });

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="builder-header">
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
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/page?tab=erp')}>
            ← ERP Builder
          </button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => setIsModalOpen(true)}>
            <PlusCircle size={15} />
            <span>New Form</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="builder-stats-grid">
        {[
          { label: 'Total Forms', value: stats.total.toString(), icon: FileCode2, color: 'var(--color-primary)' },
          { label: 'Published', value: stats.published.toString(), icon: CheckCircle, color: '#059669' },
          { label: 'Drafts', value: stats.draft.toString(), icon: Edit3, color: '#d97706' },
          { label: 'Total Submissions', value: stats.totalSubmissions.toLocaleString(), icon: Layers, color: '#7c3aed' },
        ].map(stat => (
          <div key={stat.label} className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            {loadingStats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', width: '80px' }}>
                <div className="animate-pulse" style={{ height: '24px', backgroundColor: 'var(--color-bg-hover)', borderRadius: 'var(--radius-sm)' }}></div>
                <div className="animate-pulse" style={{ height: '12px', backgroundColor: 'var(--color-bg-hover)', borderRadius: 'var(--radius-sm)', width: '50px' }}></div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{stat.value}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{stat.label}</p>
              </div>
            )}
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
            {loadingForms ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div className="animate-pulse" style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                      <div className="animate-pulse" style={{ width: '120px', height: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div className="animate-pulse" style={{ width: '60px', height: '18px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div className="animate-pulse" style={{ width: '30px', height: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div className="animate-pulse" style={{ width: '40px', height: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div className="animate-pulse" style={{ width: '80px', height: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div className="animate-pulse" style={{ width: '70px', height: '18px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <div className="animate-pulse" style={{ width: '28px', height: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                      <div className="animate-pulse" style={{ width: '28px', height: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                      <div className="animate-pulse" style={{ width: '28px', height: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                      <div className="animate-pulse" style={{ width: '28px', height: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-hover)' }}></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : sortedForms.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No forms found
                </td>
              </tr>
            ) : (
              sortedForms.map((form, idx) => (
                <tr
                  key={form.id}
                  style={{
                    borderBottom: idx < sortedForms.length - 1 ? '1px solid var(--color-border)' : 'none',
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
                    {(() => {
                      const isPublished = form.status === 'PUBLISHED' || form.status === 'Published';
                      return (
                        <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: isPublished ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: isPublished ? 'var(--color-success)' : 'var(--color-warning)' }}>
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }} title="Edit Form" onClick={() => router.push(`/builder/erp/forms/${form.id}`)}>
                        <Edit3 size={13} />
                      </button>
                      <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }} title="Duplicate" onClick={() => handleDuplicate(form)}>
                        <Copy size={13} />
                      </button>
                      <button className="frappe-btn" style={{ padding: 'var(--space-1) var(--space-2)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }} title="Delete" onClick={() => handleDelete(form.id)}>
                        <Trash2 size={13} />
                      </button>
                      <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }} title="Preview" onClick={() => router.push(`/builder/erp/forms/${form.id}?preview=true`)}>
                        <Eye size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title="Create New Form"
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'slug', label: 'Slug', type: 'text', required: true },
          {
            name: 'module',
            label: 'Module',
            type: 'select',
            required: true,
            options: [
              { label: 'Sales', value: 'Sales' },
              { label: 'HR', value: 'HR' },
              { label: 'Procurement', value: 'Procurement' },
              { label: 'CRM', value: 'CRM' },
              { label: 'Manufacturing', value: 'Manufacturing' },
              { label: 'Admin', value: 'Admin' }
            ]
          }
        ]}
      />
    </div>
  );
}

import { Suspense } from 'react';

export default function ERPFormsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Loading Form Builder...</div>}>
      <ERPFormsPageContent />
    </Suspense>
  );
}
