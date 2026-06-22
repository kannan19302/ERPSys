'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react';
import { DynamicFormRenderer } from '@/components/builder/DynamicFormRenderer';
import { useToast } from '@/components/builder/ToastProvider';

type ViewMode = 'list' | 'form';
type SortOrder = 'asc' | 'desc';

export default function CustomAppPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const moduleName = params.module as string;
  const slug = params.slug as string;

  // ── Page mapping (all hooks before any conditional return) ──
  const [mapping, setMapping] = useState<any | null | undefined>(undefined);
  const [view, setView] = useState<ViewMode>('list');
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Load page mapping ──
  useEffect(() => {
    let isMounted = true;
    async function loadPage() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/page-registries/${moduleName}/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          setMapping(data);
        } else {
          setMapping(null);
        }
      } catch {
        if (isMounted) setMapping(null);
      }
    }
    loadPage();
    return () => {
      isMounted = false;
    };
  }, [moduleName, slug]);

  // ── Derived fields ──
  const parsedLayout = mapping ? (typeof mapping.layout === 'string' ? JSON.parse(mapping.layout) : mapping.layout) : null;
  const formFields: any[] = Array.isArray(parsedLayout) ? parsedLayout : parsedLayout?.fields || [];
  const listColumns = formFields
    .filter((f) => f.inListView && f.type !== 'Section Break' && f.type !== 'Column Break')
    .slice(0, 6);
  if (listColumns.length === 0 && formFields.length > 0) {
    listColumns.push(...formFields.filter((f) => f.type === 'Data' || f.type === 'Select').slice(0, 3));
  }
  const schemaId = mapping?.schemaId;

  // ── Fetch records ──
  const fetchRecords = useCallback(async () => {
    if (!schemaId) return;
    setLoadingRecords(true);
    try {
      const token = localStorage.getItem('token') || '';
      const qp = new URLSearchParams();
      if (search) qp.set('search', search);
      if (sortBy) qp.set('sortBy', sortBy);
      qp.set('sortOrder', sortOrder);
      qp.set('page', String(page));
      qp.set('pageSize', String(pageSize));

      const res = await fetch(`/api/v1/builder/custom-records/${schemaId}?${qp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRecords(false);
    }
  }, [schemaId, search, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    if (view === 'list' && schemaId) {
      fetchRecords();
    }
  }, [view, schemaId, fetchRecords]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // ── Handlers ──
  const handleSubmit = async (data: Record<string, any>) => {
    if (!schemaId) {
      showToast('Schema ID is missing. Cannot save custom record.', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('token') || '';
      const isEdit = !!editingRecord;
      const res = await fetch(`/api/v1/builder/custom-records/${schemaId}${isEdit ? `/${editingRecord.id}` : ''}`, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        showToast(isEdit ? 'Record updated successfully!' : 'Record created successfully!', 'success');
        setEditingRecord(null);
        setView('list');
      } else {
        const errorData = await res.json();
        showToast(`Failed to save: ${errorData.message || 'Unknown error'}`, 'error');
      }
    } catch {
      showToast('An error occurred while saving', 'error');
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!schemaId) return;
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/builder/custom-records/${schemaId}/${recordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Record deleted.', 'success');
        setDeleteConfirmId(null);
        fetchRecords();
      } else {
        showToast('Failed to delete record.', 'error');
      }
    } catch {
      showToast('An error occurred while deleting.', 'error');
    }
  };

  const handleSort = (colName: string) => {
    if (sortBy === colName) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(colName);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  // ── Loading state ──
  if (mapping === undefined) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-8)' }}>Loading dynamic page...</p>
      </div>
    );
  }

  // ── Not found ──
  if (mapping === null) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>Page Not Found</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
          This custom page does not exist or was removed.
        </p>
        <button onClick={() => router.back()} style={{ marginTop: 'var(--space-4)' }}>
          Go Back
        </button>
      </div>
    );
  }

  // ── Custom Layout Page Render ──
  if (mapping.type === 'CUSTOM') {
    return (
      <CustomLayoutRuntimeRenderer
        mapping={mapping}
        moduleName={moduleName}
      />
    );
  }

  // ── Form view (create or edit) ──
  if (view === 'form') {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
              {editingRecord ? `Edit Record` : `New ${mapping.title}`}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              {mapping.schemaRegistry?.description || `Custom form for ${mapping.module} module`}
            </p>
          </div>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => { setEditingRecord(null); setView('list'); }}>
            Back to List
          </button>
        </div>
        <DynamicFormRenderer
          schema={formFields}
          onSubmit={handleSubmit}
          initialData={editingRecord ? (editingRecord.data ?? {}) : {}}
          submitLabel={editingRecord ? 'Update Record' : 'Create Record'}
        />
      </div>
    );
  }

  // ── List view ──
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
            {mapping.title}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            {mapping.schemaRegistry?.description || `Custom form for ${mapping.module} module`}
          </p>
        </div>
        <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingRecord(null); setView('form'); }}>
          <Plus size={14} />
          <span>New {mapping.title}</span>
        </button>
      </div>

      {/* Search + page size */}
      <div className="frappe-card">
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1' }}>
            <Search size={14} style={{ position: 'absolute', color: 'var(--color-text-tertiary)', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="frappe-input pl-8"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Rows:</span>
            <select
              className="frappe-input w-auto"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loadingRecords ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading records...
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              {search ? 'No records match your search.' : 'No records found.'}
            </p>
            <button className="frappe-btn frappe-btn-primary mx-auto" onClick={() => { setEditingRecord(null); setView('form'); }}>
              <Plus size={14} />
              <span>Create First Record</span>
            </button>
          </div>
        ) : (
          <div className="builder-table-wrapper">
            <table style={{ width: '100%', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>
                    ID
                  </th>
                  {listColumns.map((col: any) => (
                    <th
                      key={col.name}
                      onClick={() => handleSort(col.name)}
                      style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        {col.label}
                        <ArrowUpDown
                          size={12}
                          style={{ opacity: sortBy === col.name ? 1 : 0.3, transform: sortBy === col.name && sortOrder === 'desc' ? 'scaleY(-1)' : 'none', transition: 'transform var(--duration-fast)' }}
                        />
                      </span>
                    </th>
                  ))}
                  <th style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>
                    Created
                  </th>
                  <th style={{ padding: 'var(--space-3)' }}></th>
                </tr>
              </thead>
              <tbody>
                {records.map((row: any) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {row.id.substring(0, 8)}
                    </td>
                    {listColumns.map((col: any) => (
                      <td key={col.name} style={{ padding: 'var(--space-3)' }}>
                        {typeof row.data[col.name] === 'object'
                          ? JSON.stringify(row.data[col.name])
                          : String(row.data[col.name] ?? '-')}
                      </td>
                    ))}
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      {deleteConfirmId === row.id ? (
                        <div className="delete-confirm-bar">
                          <span className="confirm-text">Delete?</span>
                          <button
                            className="frappe-btn frappe-btn-danger"
                            style={{ padding: '2px var(--space-2)', fontSize: 'var(--text-xs)' }}
                            onClick={() => handleDelete(row.id)}
                          >
                            Yes
                          </button>
                          <button
                            className="frappe-btn frappe-btn-secondary"
                            style={{ padding: '2px var(--space-2)', fontSize: 'var(--text-xs)' }}
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                          <button
                            className="frappe-btn frappe-btn-icon frappe-btn-secondary"
                            title="Edit record"
                            onClick={() => { setEditingRecord(row); setView('form'); }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="frappe-btn frappe-btn-icon frappe-btn-danger"
                            title="Delete record"
                            onClick={() => setDeleteConfirmId(row.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              <button
                className="frappe-btn frappe-btn-icon frappe-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`frappe-btn frappe-btn-icon ${page === pageNum ? 'frappe-btn-primary' : 'frappe-btn-secondary'}`}
                    onClick={() => setPage(pageNum)}
                    style={{ minWidth: '32px' }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="frappe-btn frappe-btn-icon frappe-btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM LAYOUT RUNTIME RENDER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

interface CustomLayoutRuntimeRendererProps {
  mapping: any;
  moduleName: string;
}

function CustomLayoutRuntimeRenderer({ mapping, moduleName }: CustomLayoutRuntimeRendererProps) {
  const layout = Array.isArray(mapping.layout) ? mapping.layout : [];
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSchemas() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/schema-registries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          const filtered = data.filter((s: any) => s.module.toLowerCase() === moduleName.toLowerCase());
          setSchemas(filtered);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoadingSchemas(false);
      }
    }
    loadSchemas();
    return () => { isMounted = false; };
  }, [moduleName]);

  if (layout.length === 0) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div className="frappe-card-body py-10">
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>Empty Custom Page Layout</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            No layout components have been configured for this page yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        {layout.map((w: any) => {
          if (w.type === 'header') {
            return (
              <div key={w.id} style={{ gridColumn: `span ${w.gridSpan || 12}`, padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{w.title}</h2>
                    {w.config?.subtitle && <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontSize: '13px' }}>{w.config.subtitle}</p>}
                  </div>
                  {w.config?.badge && (
                    <span className="builder-pill active" style={{ display: 'inline-block', fontSize: '11px', padding: '2px 10px' }}>{w.config.badge}</span>
                  )}
                </div>
              </div>
            );
          }

          if (w.type === 'stats') {
            const items = w.config?.items || [];
            return (
              <div key={w.id} style={{ gridColumn: `span ${w.gridSpan || 12}`, padding: 'var(--space-6)' }}>
                <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>{w.title}</h3>
                <div className="frappe-grid-3">
                  {items.map((item: any, i: number) => (
                    <div key={i} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', borderLeft: `4px solid ${item.color || 'var(--color-primary)'}` }}>
                      <div style={{ fontSize: '24px', color: item.color, fontWeight: 800 }}>{item.value || '0'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontWeight: 'var(--weight-medium)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (w.type === 'alert') {
            const text = w.config?.text || '';
            const type = w.config?.type || 'info';
            let borderLeftColor = 'var(--color-primary)';
            let bg = 'rgba(59, 130, 246, 0.05)';
            let color = 'var(--color-primary)';

            if (type === 'danger') {
              borderLeftColor = 'var(--color-danger)';
              bg = 'rgba(239, 68, 68, 0.05)';
              color = 'var(--color-danger-text)';
            } else if (type === 'warning') {
              borderLeftColor = 'var(--color-warning)';
              bg = 'rgba(245, 158, 11, 0.05)';
              color = 'var(--color-warning-text)';
            } else if (type === 'success') {
              borderLeftColor = 'var(--color-success)';
              bg = 'rgba(16, 185, 129, 0.05)';
              color = 'var(--color-success-text)';
            }

            return (
              <div
                key={w.id}
                style={{ gridColumn: `span ${w.gridSpan || 12}`, borderLeft: `4px solid ${borderLeftColor}`, background: bg, color: color }}
                style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid transparent', fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center' }}
              >
                <div>{text}</div>
              </div>
            );
          }

          if (w.type === 'form') {
            return (
              <RuntimeFormWidget
                key={w.id}
                widget={w}
              />
            );
          }

          if (w.type === 'table') {
            return (
              <RuntimeTableWidget
                key={w.id}
                widget={w}
                schemas={schemas}
                moduleName={moduleName}
              />
            );
          }

          if (w.type === 'chart') {
            return (
              <RuntimeChartWidget
                key={w.id}
                widget={w}
                schemas={schemas}
                moduleName={moduleName}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

// ── Form Widget Runtime ──
function RuntimeFormWidget({ widget }: { widget: any }) {
  const { formId } = widget.config || {};
  const [formSchema, setFormSchema] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!formId) return;
    let isMounted = true;
    async function loadForm() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/forms/${formId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setFormSchema(data);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadForm();
    return () => { isMounted = false; };
  }, [formId]);

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!formSchema) return;
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/builder/custom-records/${formSchema.slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast('Submission saved successfully!', 'success');
        setSubmitted(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`Submission failed: ${errorData.message || 'Server error'}`, 'error');
      }
    } catch {
      showToast('An error occurred during submission', 'error');
    }
  };

  if (!formId) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}`, padding: 'var(--space-6)' }}>
        <p style={{ fontWeight: 'var(--weight-medium)', textAlign: 'center' }}>Form Widget: No form selected.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}`, padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading form definition...
      </div>
    );
  }

  if (!formSchema) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}`, padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Failed to load form definition.
      </div>
    );
  }

  return (
    <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className="frappe-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{widget.title || formSchema.name}</span>
        {submitted && (
          <button className="frappe-btn frappe-btn-secondary" onClick={() => setSubmitted(false)} style={{ padding: '2px 8px', fontSize: 'var(--text-xs)' }}>
            Submit Another
          </button>
        )}
      </div>
      <div className="frappe-card-body">
        {submitted ? (
          <div style={{ textAlign: 'center', paddingBlock: 'var(--space-6)' }}>
            <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)' }}>Thank You!</p>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Your response has been submitted successfully.</p>
          </div>
        ) : (
          <DynamicFormRenderer
            schema={formSchema.fields || []}
            onSubmit={handleSubmit}
            initialData={{}}
            submitLabel="Submit Response"
          />
        )}
      </div>
    </div>
  );
}

// ── Table Widget Runtime ──
function RuntimeTableWidget({ widget, schemas, moduleName }: { widget: any, schemas: any[], moduleName: string }) {
  const { dataModelId, dataModelSlug, maxRows = 5 } = widget.config || {};
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchingSchema, setMatchingSchema] = useState<any>(null);

  useEffect(() => {
    if (!dataModelId && !dataModelSlug) return;
    const schema = schemas.find(s => {
      const cleanSlug = s.slug.replace(`${moduleName.toLowerCase()}_`, '');
      return s.id === dataModelId || s.slug === dataModelId || cleanSlug === dataModelSlug || s.slug === `${moduleName.toLowerCase()}_${dataModelSlug}`;
    });
    setMatchingSchema(schema || null);
  }, [dataModelId, dataModelSlug, schemas, moduleName]);

  const fetchRecords = useCallback(async () => {
    if (!matchingSchema) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const qp = new URLSearchParams();
      if (search) qp.set('search', search);
      qp.set('page', String(page));
      qp.set('pageSize', String(maxRows));

      const res = await fetch(`/api/v1/builder/custom-records/${matchingSchema.id}?${qp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [matchingSchema, search, page, maxRows]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  if (!dataModelId && !dataModelSlug) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}`, padding: 'var(--space-6)' }}>
        <p style={{ fontWeight: 'var(--weight-medium)', textAlign: 'center' }}>Table Widget: No data model selected.</p>
      </div>
    );
  }

  if (!matchingSchema) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}`, padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Finding data model schema...
      </div>
    );
  }

  const fields: any[] = Array.isArray(matchingSchema.fields) ? matchingSchema.fields : [];
  const columns = fields.filter((f: any) => f.type !== 'Section Break' && f.type !== 'Column Break').slice(0, 4);
  const totalPages = Math.ceil(total / maxRows);

  return (
    <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className="frappe-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <span style={{ fontWeight: 'var(--weight-bold)' }}>{widget.title || matchingSchema.name}</span>
        <div style={{ position: 'relative' }}>
          <input
            style={{ fontSize: 'var(--text-xs)' }}
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: '4px 8px' }}
          />
        </div>
      </div>
      <div className="frappe-card-body p-0">
        {loading && records.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading records...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No records found.</div>
        ) : (
          <div className="builder-table-wrapper">
            <table style={{ width: '100%', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={{ padding: 'var(--space-2)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>ID</th>
                  {columns.map((col: any) => (
                    <th key={col.name} style={{ padding: 'var(--space-2)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>{col.label || col.name}</th>
                  ))}
                  <th style={{ padding: 'var(--space-2)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row: any) => (
                  <tr key={row.id} className="hover:bg-muted/10 transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>{row.id.substring(0, 6)}</td>
                    {columns.map((col: any) => (
                      <td key={col.name} style={{ padding: 'var(--space-2)' }}>
                        {typeof row.data[col.name] === 'object'
                          ? JSON.stringify(row.data[col.name])
                          : String(row.data[col.name] ?? '-')}
                      </td>
                    ))}
                    <td style={{ padding: 'var(--space-2)', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: 'var(--space-2)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              <button
                className="frappe-btn frappe-btn-icon frappe-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ padding: '2px 6px', minWidth: 'auto', minHeight: 'auto' }}
              >
                Prev
              </button>
              <button
                className="frappe-btn frappe-btn-icon frappe-btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: '2px 6px', minWidth: 'auto', minHeight: 'auto' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chart Widget Runtime ──
function RuntimeChartWidget({ widget, schemas, moduleName }: { widget: any, schemas: any[], moduleName: string }) {
  const { chartType = 'bar' } = widget.config || {};
  const fallbackData = [
    { label: 'Mon', value: 40, color: 'var(--color-primary)' },
    { label: 'Tue', value: 75, color: '#10b981' },
    { label: 'Wed', value: 50, color: '#f59e0b' },
    { label: 'Thu', value: 90, color: '#8b5cf6' },
    { label: 'Fri', value: 65, color: '#ec4899' },
    { label: 'Sat', value: 30, color: '#3b82f6' },
    { label: 'Sun', value: 45, color: '#14b8a6' },
  ];

  const maxVal = Math.max(...fallbackData.map(d => d.value));

  return (
    <div style={{ gridColumn: `span ${widget.gridSpan || 12}`, padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{widget.title || 'Analytics Chart'}</h3>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>{chartType} View</span>
      </div>

      {chartType === 'donut' ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'conic-gradient(var(--color-primary) 0% 40%, #10b981 40% 70%, #f59e0b 70% 90%, #8b5cf6 90% 100%)' }}>
            <div style={{ position: 'absolute', borderRadius: '9999px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-bg-elevated)' }}>
              <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>100%</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Share</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--text-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '9999px', background: 'var(--color-primary)' }}><div /> <span>Active (40%)</span></div>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '9999px', background: '#10b981' }}><div /> <span>Completed (30%)</span></div>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '9999px', background: '#f59e0b' }}><div /> <span>Pending (20%)</span></div>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '9999px', background: '#8b5cf6' }}><div /> <span>Draft (10%)</span></div>
          </div>
        </div>
      ) : chartType === 'line' ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingInline: 'var(--space-2)' }}>
            <svg style={{ position: 'absolute', width: '100%', height: '100%' }} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                points={fallbackData.map((d, i) => `${(i / (fallbackData.length - 1)) * 100}%,${100 - (d.value / maxVal) * 90}%`).join(' ')}
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />
              <path
                fill="rgba(99, 102, 241, 0.08)"
                stroke="none"
                d={`M0,100 L${fallbackData.map((d, i) => `${(i / (fallbackData.length - 1)) * 100}%,${100 - (d.value / maxVal) * 90}%`).join(' L')} L100,100 Z`}
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />
            </svg>
            {fallbackData.map((d, i) => (
              <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '10%' }}>
                <div className="bottom-full bg-text text-card text-[10px] py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ position: 'absolute', marginBottom: 'var(--space-2)', paddingInline: 'var(--space-2)', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--color-text)', color: 'var(--color-bg-elevated)' }}>
                  {d.label}: {d.value}
                </div>
                <div
                  className="w-2.5 h-2.5 border-2 border-card bg-primary hover:scale-125 transition-transform" style={{ borderRadius: '9999px', cursor: 'pointer' }}
                  style={{
                    position: 'absolute',
                    bottom: `${(d.value / maxVal) * 90}%`,
                    transform: 'translateY(50%)',
                    borderColor: 'var(--color-bg-elevated)',
                    backgroundColor: 'var(--color-primary)',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', paddingInline: 'var(--space-2)' }}>
            {fallbackData.map((d, i) => <span key={i}>{d.label}</span>)}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ flex: '1', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingInline: 'var(--space-2)', gap: 'var(--space-3)' }}>
            {fallbackData.map((d, i) => (
              <div key={i} style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                <div className="bottom-full bg-text text-card text-[10px] py-1 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ position: 'absolute', marginBottom: 'var(--space-1)', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--color-text)', color: 'var(--color-bg-elevated)' }}>
                  {d.value} units
                </div>
                <div
                  className="rounded-t hover:brightness-110 transition-all" style={{ width: '100%', cursor: 'pointer' }}
                  style={{
                    height: `${(d.value / maxVal) * 90}%`,
                    background: `linear-gradient(to top, ${d.color}cc, ${d.color})`,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', paddingInline: 'var(--space-2)' }}>
            {fallbackData.map((d, i) => <span key={i} style={{ textAlign: 'center' }}>{d.label}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
