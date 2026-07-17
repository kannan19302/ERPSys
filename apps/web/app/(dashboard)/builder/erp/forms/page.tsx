'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, DataTable, ConfirmDialog } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
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
  const client = useApiClient();
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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
      setStats(await client.get('/builder/forms/stats'));
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
      const query = new URLSearchParams();
      if (debouncedSearch) query.append('search', debouncedSearch);
      if (moduleFilter && moduleFilter !== 'All Modules') query.append('module', moduleFilter);

      const d = await client.get<any>(`/builder/forms?${query.toString()}`);
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
      const newForm = await client.post<{ id: string }>('/builder/forms', {
          name: data.name,
          slug: data.slug,
          module: data.module || 'Sales',
          fields: [
            { id: 'f_1', type: 'Section Break', label: 'General Info', name: 'general_info_section', required: false, readOnly: false, weight: 1, columnSpan: 12 },
            { id: 'f_2', type: 'Data', label: 'Form Name', name: 'form_name', required: true, readOnly: false, columnSpan: 12 },
            { id: 'f_3', type: 'Select', label: 'Status', name: 'status', required: false, readOnly: false, options: 'Draft\nPublished', columnSpan: 12 },
          ],
          settings: {},
      });
      setIsModalOpen(false);
      router.push(`/builder/erp/forms/${newForm.id}`);
    } catch (err) {
      alert("Failed to create form. Please check backend.");
    }
  };

  // Duplicate Form
  const handleDuplicate = async (form: any) => {
    try {
      const original = await client.get<any>(`/builder/forms/${form.id}`);

      await client.post('/builder/forms', {
          name: `Copy of ${original.name}`,
          slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
          module: original.module || 'Sales',
          fields: typeof original.fields === 'string' ? JSON.parse(original.fields) : original.fields,
          settings: typeof original.settings === 'string' ? JSON.parse(original.settings) : original.settings
      });
      loadForms();
      loadStats();
    } catch (err) {
      alert('Error duplicating form');
    }
  };

  // Delete Form
  const executeDelete = async (id: string) => {
    try {
      await client.delete(`/builder/forms/${id}`);
      loadForms();
      loadStats();
    } catch (err) {
      alert('Error deleting form');
    }
  };

  // Local sorting
  const sortedForms = [...formsList].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'submissions') return b.submissions - a.submissions;
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="p-6 ui-stack-5">
      {/* Header */}
      <PageHeader
        title="Form Builder"
        description="Create, manage, and publish custom DocType forms across all ERP modules"
        actions={
          <div className="ui-flex ui-gap-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder/erp')}>
              ← App Studio
            </button>
            <button className="ui-btn ui-btn-primary" onClick={() => setIsModalOpen(true)}>
              <PlusCircle size={15} />
              <span>New Form</span>
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="builder-stats-grid">
        {[
          { label: 'Total Forms', value: stats.total.toString(), icon: FileCode2, color: 'var(--color-primary)' },
          { label: 'Published', value: stats.published.toString(), icon: CheckCircle, color: '#059669' },
          { label: 'Drafts', value: stats.draft.toString(), icon: Edit3, color: '#d97706' },
          { label: 'Total Submissions', value: stats.totalSubmissions.toLocaleString(), icon: Layers, color: '#7c3aed' },
        ].map(stat => (
          <div key={stat.label} className={`ui-card ${styles.s1}`} >
            <div style={{ background: `${stat.color}20` }} className={styles.s2}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            {loadingStats ? (
              <div className={styles.s3}>
                <div className={`animate-pulse ${styles.s4}`} ></div>
                <div className={`animate-pulse ${styles.s5}`} ></div>
              </div>
            ) : (
              <div>
                <p className={styles.s6}>{stat.value}</p>
                <p className="ui-text-xs-muted m-0">{stat.label}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className={styles.s7}>
        <div className={styles.s8}>
          <Search size={15} className="ui-input-icon-abs" />
          <input className={`ui-input ${styles.s9}`} type="text" placeholder="Search forms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}  />
        </div>
        <div className={styles.s10}>
          {MODULES.map(mod => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              style={{ border: `1px solid ${moduleFilter === mod ? 'var(--color-primary)' : 'var(--color-border)'}`, background: moduleFilter === mod ? 'var(--color-primary-light)' : 'transparent', color: moduleFilter === mod ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: moduleFilter === mod ? 'var(--weight-semibold)' : 'var(--weight-normal)' }} className={styles.s11}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Forms Table */}
      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Form Name',
            render: (row: any) => (
              <div className="ui-hstack-2">
                <div className={styles.s12}>
                  <FileCode2 size={13} className="ui-text-primary" />
                </div>
                <span className="font-medium">{row.name}</span>
              </div>
            ),
          },
          {
            key: 'module',
            header: 'Module',
            render: (row: any) => (
              <span className={styles.s13}>
                {row.module}
              </span>
            ),
          },
          { key: 'fields', header: 'Fields' },
          {
            key: 'submissions',
            header: 'Submissions',
            render: (row: any) => <span className="font-medium">{row.submissions.toLocaleString()}</span>,
          },
          {
            key: 'lastEdited',
            header: 'Last Edited',
            render: (row: any) => <span className={styles.s14}>{row.lastEdited}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (row: any) => {
              const isPublished = row.status === 'PUBLISHED' || row.status === 'Published';
              return (
                <span style={{ background: isPublished ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: isPublished ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s15}>
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              );
            },
          },
          {
            key: 'actions',
            header: 'Actions',
            width: '140px',
            render: (row: any) => (
              <div className="ui-flex ui-gap-1" onClick={(e) => e.stopPropagation()}>
                <button className={`ui-btn ui-btn-secondary ${styles.s16}`}  title="Edit Form" onClick={() => router.push(`/builder/erp/forms/${row.id}`)}>
                  <Edit3 size={13} />
                </button>
                <button className={`ui-btn ui-btn-secondary ${styles.s16}`}  title="Duplicate" onClick={() => handleDuplicate(row)}>
                  <Copy size={13} />
                </button>
                <button className={`ui-btn ${styles.s17}`}  title="Delete" onClick={() => setDeleteTarget(row.id)}>
                  <Trash2 size={13} />
                </button>
                <button className={`ui-btn ui-btn-secondary ${styles.s16}`}  title="Preview" onClick={() => router.push(`/builder/erp/forms/${row.id}?preview=true`)}>
                  <Eye size={13} />
                </button>
              </div>
            ),
          },
        ]}
        data={sortedForms}
        loading={loadingForms}
        rowKey={(row: any) => row.id}
        onRowClick={(row: any) => router.push(`/builder/erp/forms/${row.id}`)}
        emptyTitle="No forms found"
        emptyMessage="Create your first form to get started."
      />
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
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { executeDelete(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Form"
        message="Are you sure you want to delete this form? All submissions will also be lost."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

import { Suspense } from 'react';

export default function ERPFormsPage() {
  return (
    <Suspense fallback={<div className={styles.s18}>Loading Form Builder...</div>}>
      <ERPFormsPageContent />
    </Suspense>
  );
}
