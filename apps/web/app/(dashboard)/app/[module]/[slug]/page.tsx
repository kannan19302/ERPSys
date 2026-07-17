'use client';
import styles from './page.module.css';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react';
import { DynamicFormRenderer } from '@/components/builder/DynamicFormRenderer';
import { useToast } from '@/components/builder/ToastProvider';
import { RouteGuard, useApiClient } from '@unerp/framework';

type ViewMode = 'list' | 'form';
type SortOrder = 'asc' | 'desc';

function CustomAppPageContent() {
  const client = useApiClient();
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
        const data = await client.get(`/builder/page-registries/${moduleName}/${slug}`);
        if (isMounted) setMapping(data);
      } catch {
        if (isMounted) setMapping(null);
      }
    }
    loadPage();
    return () => {
      isMounted = false;
    };
  }, [moduleName, slug, client]);

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
      const qp = new URLSearchParams();
      if (search) qp.set('search', search);
      if (sortBy) qp.set('sortBy', sortBy);
      qp.set('sortOrder', sortOrder);
      qp.set('page', String(page));
      qp.set('pageSize', String(pageSize));

      const data = await client.get<{ data?: unknown[]; total?: number }>(`/builder/custom-records/${schemaId}?${qp}`);
      setRecords(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // ignore
    } finally {
      setLoadingRecords(false);
    }
  }, [schemaId, search, sortBy, sortOrder, page, pageSize, client]);

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
      const isEdit = !!editingRecord;
      const endpoint = `/builder/custom-records/${schemaId}${isEdit ? `/${editingRecord.id}` : ''}`;
      if (isEdit) await client.patch(endpoint, data);
      else await client.post(endpoint, data);
      showToast(isEdit ? 'Record updated successfully!' : 'Record created successfully!', 'success');
      setEditingRecord(null);
      setView('list');
    } catch (error) {
      showToast(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!schemaId) return;
    try {
      await client.delete(`/builder/custom-records/${schemaId}/${recordId}`);
      showToast('Record deleted.', 'success');
      setDeleteConfirmId(null);
      fetchRecords();
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
      <div className={styles.s1}>
        <p className={styles.s2}>Loading dynamic page...</p>
      </div>
    );
  }

  // ── Not found ──
  if (mapping === null) {
    return (
      <div className={styles.s3}>
        <h2 className="text-2xl">Page Not Found</h2>
        <p className={styles.s4}>
          This custom page does not exist or was removed.
        </p>
        <button onClick={() => router.back()} className={styles.s5}>
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

  // ── Remote Page Render (data lives in the app's out-of-process service) ──
  if (mapping.type === 'REMOTE') {
    return <RemoteAppPageRenderer mapping={mapping} moduleName={moduleName} />;
  }

  // ── Form view (create or edit) ──
  if (view === 'form') {
    return (
      <div className="p-6">
        <div className={styles.s6}>
          <div>
            <h1 className="text-2xl">
              {editingRecord ? `Edit Record` : `New ${mapping.title}`}
            </h1>
            <p className="ui-text-muted mt-1">
              {mapping.schemaRegistry?.description || `Custom form for ${mapping.module} module`}
            </p>
          </div>
          <button className="ui-btn ui-btn-secondary" onClick={() => { setEditingRecord(null); setView('list'); }}>
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
    <div className="p-6">
      {/* Header */}
      <div className={styles.s7}>
        <div>
          <h1 className="text-2xl">
            {mapping.title}
          </h1>
          <p className="ui-text-muted mt-1">
            {mapping.schemaRegistry?.description || `Custom form for ${mapping.module} module`}
          </p>
        </div>
        <button className="ui-btn ui-btn-primary" onClick={() => { setEditingRecord(null); setView('form'); }}>
          <Plus size={14} />
          <span>New {mapping.title}</span>
        </button>
      </div>

      {/* Search + page size */}
      <div className="ui-card">
        <div className={styles.s8}>
          <div className={styles.s9}>
            <Search size={14} className={styles.s84} />
            <input
              className={`ui-input pl-8 ${styles.s10}`}
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className={styles.s11}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="ui-hstack-2">
            <span className="ui-text-xs-muted">Rows:</span>
            <select
              className="ui-input w-auto"
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
          <div className={styles.s12}>
            Loading records...
          </div>
        ) : records.length === 0 ? (
          <div className={styles.s1}>
            <p className={styles.s13}>
              {search ? 'No records match your search.' : 'No records found.'}
            </p>
            <button className="ui-btn ui-btn-primary mx-auto" onClick={() => { setEditingRecord(null); setView('form'); }}>
              <Plus size={14} />
              <span>Create First Record</span>
            </button>
          </div>
        ) : (
          <div className="builder-table-wrapper">
            <table className={styles.s14}>
              <thead>
                <tr className="border-b">
                  <th className={styles.s15}>
                    ID
                  </th>
                  {listColumns.map((col: any) => (
                    <th
                      key={col.name}
                      onClick={() => handleSort(col.name)}
                      className={styles.s16}
                    >
                      <span className={styles.s17}>
                        {col.label}
                        <ArrowUpDown
                          size={12}
                          style={{ opacity: sortBy === col.name ? 1 : 0.3, transform: sortBy === col.name && sortOrder === 'desc' ? 'scaleY(-1)' : 'none' }} className={styles.s85}
                        />
                      </span>
                    </th>
                  ))}
                  <th className={styles.s18}>
                    Created
                  </th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((row: any) => (
                  <tr key={row.id} className="border-b">
                    <td className={styles.s19}>
                      {row.id.substring(0, 8)}
                    </td>
                    {listColumns.map((col: any) => (
                      <td key={col.name} className="p-3">
                        {typeof row.data[col.name] === 'object'
                          ? JSON.stringify(row.data[col.name])
                          : String(row.data[col.name] ?? '-')}
                      </td>
                    ))}
                    <td className={styles.s20}>
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {deleteConfirmId === row.id ? (
                        <div className="delete-confirm-bar">
                          <span className="confirm-text">Delete?</span>
                          <button
                            className={`ui-btn ui-btn-danger ${styles.s21}`}
                            
                            onClick={() => handleDelete(row.id)}
                          >
                            Yes
                          </button>
                          <button
                            className={`ui-btn ui-btn-secondary ${styles.s21}`}
                            
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className={styles.s22}>
                          <button
                            className="ui-btn ui-btn-icon ui-btn-secondary"
                            title="Edit record"
                            onClick={() => { setEditingRecord(row); setView('form'); }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="ui-btn ui-btn-icon ui-btn-danger"
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
          <div className={styles.s23}>
            <span className="ui-text-muted">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="ui-flex ui-gap-1">
              <button
                className="ui-btn ui-btn-icon ui-btn-secondary"
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
                    className={`ui-btn ui-btn-icon ${page === pageNum ? 'ui-btn-primary' : 'ui-btn-secondary'} ${styles.s24}`}
                    onClick={() => setPage(pageNum)}
                    
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="ui-btn ui-btn-icon ui-btn-secondary"
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
export default function CustomAppPage() {
  return (
    <RouteGuard permission="builder.pages.read">
      <CustomAppPageContent />
    </RouteGuard>
  );
}

// CUSTOM LAYOUT RUNTIME RENDER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

interface CustomLayoutRuntimeRendererProps {
  mapping: any;
  moduleName: string;
}

function CustomLayoutRuntimeRenderer({ mapping, moduleName }: CustomLayoutRuntimeRendererProps) {
  const client = useApiClient();
  const layout = Array.isArray(mapping.layout) ? mapping.layout : [];
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSchemas() {
      try {
        const data = await client.get<unknown[]>('/builder/schema-registries');
        if (isMounted) {
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
  }, [moduleName, client]);

  if (layout.length === 0) {
    return (
      <div className={styles.s3}>
        <div className="ui-card-body py-10">
          <h2 className={styles.s25}>Empty Custom Page Layout</h2>
          <p className="ui-text-sm-muted">
            No layout components have been configured for this page yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className={styles.s26}>
        {layout.map((w: any) => {
          if (w.type === 'header') {
            return (
              <div key={w.id} style={{ gridColumn: `span ${w.gridSpan || 12}` }} className={styles.s27}>
                <div className={styles.s28}>
                  <div>
                    <h2 className={styles.s29}>{w.title}</h2>
                    {w.config?.subtitle && <p className={styles.s30}>{w.config.subtitle}</p>}
                  </div>
                  {w.config?.badge && (
                    <span className={`builder-pill active ${styles.s31}`} >{w.config.badge}</span>
                  )}
                </div>
              </div>
            );
          }

          if (w.type === 'stats') {
            const items = w.config?.items || [];
            return (
              <div key={w.id} style={{ gridColumn: `span ${w.gridSpan || 12}` }} className={styles.s27}>
                <h3 className={styles.s32}>{w.title}</h3>
                <div className="ui-grid-3">
                  {items.map((item: any, i: number) => (
                    <div key={i} style={{ borderLeft: `4px solid ${item.color || 'var(--color-primary)'}` }} className={styles.s33}>
                      <div style={{ color: item.color }} className={styles.s34}>{item.value || '0'}</div>
                      <div className={styles.s35}>{item.label}</div>
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
                style={{ gridColumn: `span ${w.gridSpan || 12}`, borderLeft: `4px solid ${borderLeftColor}`, background: bg, color: color }} className={styles.s36}
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

          if (w.type === 'kpi') {
            return <RuntimeKpiWidget key={w.id} widget={w} moduleName={moduleName} />;
          }

          return null;
        })}
      </div>
    </div>
  );
}

// ── Form Widget Runtime ──
function RuntimeFormWidget({ widget }: { widget: any }) {
  const client = useApiClient();
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
        const data = await client.get(`/builder/forms/${formId}`);
        if (isMounted) {
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
  }, [formId, client]);

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!formSchema) return;
    try {
      await client.post(`/builder/custom-records/${formSchema.slug}`, formData);
      showToast('Submission saved successfully!', 'success');
      setSubmitted(true);
    } catch (error) {
      showToast(`Submission failed: ${error instanceof Error ? error.message : 'Server error'}`, 'error');
    }
  };

  if (!formId) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className={styles.s27}>
        <p className={styles.s37}>Form Widget: No form selected.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className={styles.s38}>
        Loading form definition...
      </div>
    );
  }

  if (!formSchema) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className={styles.s38}>
        Failed to load form definition.
      </div>
    );
  }

  return (
    <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className="ui-card">
      <div className="ui-flex-between">
        <span>{widget.title || formSchema.name}</span>
        {submitted && (
          <button className={`ui-btn ui-btn-secondary ${styles.s39}`} onClick={() => setSubmitted(false)} >
            Submit Another
          </button>
        )}
      </div>
      <div className="ui-card-body">
        {submitted ? (
          <div className={styles.s40}>
            <p className={styles.s41}>Thank You!</p>
            <p className="ui-text-muted mt-1">Your response has been submitted successfully.</p>
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
  const client = useApiClient();
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
      const qp = new URLSearchParams();
      if (search) qp.set('search', search);
      qp.set('page', String(page));
      qp.set('pageSize', String(maxRows));

      const data = await client.get<{ data?: unknown[]; total?: number }>(`/builder/custom-records/${matchingSchema.id}?${qp}`);
      setRecords(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [matchingSchema, search, page, maxRows, client]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  if (!dataModelId && !dataModelSlug) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className={styles.s27}>
        <p className={styles.s37}>Table Widget: No data model selected.</p>
      </div>
    );
  }

  if (!matchingSchema) {
    return (
      <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className={styles.s38}>
        Finding data model schema...
      </div>
    );
  }

  const fields: any[] = Array.isArray(matchingSchema.fields) ? matchingSchema.fields : [];
  const columns = fields.filter((f: any) => f.type !== 'Section Break' && f.type !== 'Column Break').slice(0, 4);
  const totalPages = Math.ceil(total / maxRows);

  return (
    <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className="ui-card">
      <div className={styles.s42}>
        <span className="font-bold">{widget.title || matchingSchema.name}</span>
        <div className="relative">
          <input
            className={styles.s43}
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>
      <div className="ui-card-body p-0">
        {loading && records.length === 0 ? (
          <div className={styles.s38}>Loading records...</div>
        ) : records.length === 0 ? (
          <div className={styles.s38}>No records found.</div>
        ) : (
          <div className="builder-table-wrapper">
            <table className={styles.s44}>
              <thead>
                <tr className={styles.s45}>
                  <th className={styles.s46}>ID</th>
                  {columns.map((col: any) => (
                    <th key={col.name} className={styles.s46}>{col.label || col.name}</th>
                  ))}
                  <th className={styles.s47}>Created</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row: any) => (
                  <tr key={row.id} className="hover:bg-muted/10 transition-colors border-b">
                    <td className={styles.s48}>{row.id.substring(0, 6)}</td>
                    {columns.map((col: any) => (
                      <td key={col.name} className="p-2">
                        {typeof row.data[col.name] === 'object'
                          ? JSON.stringify(row.data[col.name])
                          : String(row.data[col.name] ?? '-')}
                      </td>
                    ))}
                    <td className={styles.s49}>
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.s50}>
            <span className="ui-text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="ui-flex ui-gap-1">
              <button
                className={`ui-btn ui-btn-icon ui-btn-secondary ${styles.s51}`}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                
              >
                Prev
              </button>
              <button
                className={`ui-btn ui-btn-icon ui-btn-secondary ${styles.s51}`}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                
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
// ── KPI Widget Runtime (live computed metrics) ──
function RuntimeKpiWidget({ widget, moduleName }: { widget: any, moduleName: string }) {
  const client = useApiClient();
  const items: any[] = widget.config?.items || [];
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await client.get<{ metrics?: Record<string, number> }>(`/admin/marketplace/installed/${moduleName}/metrics`);
        if (mounted) {
          setMetrics(data.metrics || {});
        }
      } catch { /* ignore */ } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [moduleName, client]);

  return (
    <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className={styles.s27}>
      {widget.title && <h3 className={styles.s52}>{widget.title}</h3>}
      <div className={`ui-grid-3 ${styles.s53}`} style={{ gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))` }}>
        {items.map((item: any, i: number) => {
          const value = metrics[item.metric];
          return (
            <div key={i} style={{ borderLeft: `4px solid ${item.color || 'var(--color-primary)'}` }} className={styles.s54}>
              <div style={{ color: item.color || 'var(--color-text)' }} className={styles.s55}>{loading ? '…' : (value ?? 0)}</div>
              <div className={styles.s35}>{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    <div style={{ gridColumn: `span ${widget.gridSpan || 12}` }} className={styles.s27}>
      <div className={styles.s6}>
        <h3 className="ui-heading-sm">{widget.title || 'Analytics Chart'}</h3>
        <span className={styles.s56}>{chartType} View</span>
      </div>

      {chartType === 'donut' ? (
        <div className={styles.s57}>
          <div className={styles.s58}>
            <div className={styles.s59}>
              <span className={styles.s60}>100%</span>
              <span className="ui-text-muted">Share</span>
            </div>
          </div>
          <div className={styles.s61}>
            <div className={styles.s62}><div /> <span>Active (40%)</span></div>
            <div className={styles.s63}><div /> <span>Completed (30%)</span></div>
            <div className={styles.s64}><div /> <span>Pending (20%)</span></div>
            <div className={styles.s62}><div /> <span>Draft (10%)</span></div>
          </div>
        </div>
      ) : chartType === 'line' ? (
        <div className={styles.s65}>
          <div className={styles.s66}>
            <svg className={styles.s67} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                points={fallbackData.map((d, i) => `${(i / (fallbackData.length - 1)) * 100}%,${100 - (d.value / maxVal) * 90}%`).join(' ')}
                className={styles.s68}
              />
              <path
                fill="rgba(99, 102, 241, 0.08)"
                stroke="none"
                d={`M0,100 L${fallbackData.map((d, i) => `${(i / (fallbackData.length - 1)) * 100}%,${100 - (d.value / maxVal) * 90}%`).join(' L')} L100,100 Z`}
                className={styles.s68}
              />
            </svg>
            {fallbackData.map((d, i) => (
              <div key={i} className={styles.s69}>
                <div className={`bottom-full bg-text text-card text-[10px] py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${styles.s70}`} >
                  {d.label}: {d.value}
                </div>
                <div
                  className={`w-2.5 h-2.5 border-2 border-card bg-primary hover:scale-125 transition-transform ${styles.s71}`}
                  style={{ bottom: `${(d.value / maxVal) * 90}%` }}
                />
              </div>
            ))}
          </div>
          <div className={styles.s72}>
            {fallbackData.map((d, i) => <span key={i}>{d.label}</span>)}
          </div>
        </div>
      ) : (
        <div className={styles.s65}>
          <div className={styles.s73}>
            {fallbackData.map((d, i) => (
              <div key={i} className={styles.s74}>
                <div className={`bottom-full bg-text text-card text-[10px] py-1 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${styles.s75}`} >
                  {d.value} units
                </div>
                <div
                  className={`rounded-t hover:brightness-110 transition-all ${styles.s76}`}
                  style={{ height: `${(d.value / maxVal) * 90}%`, background: `linear-gradient(to top, ${d.color}cc, ${d.color})` }}
                />
              </div>
            ))}
          </div>
          <div className={styles.s72}>
            {fallbackData.map((d, i) => <span key={i} className={styles.s1}>{d.label}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Remote page: renders a table from the app's out-of-process service (#4) ──
// The bundle ships this page (nav + columns + data endpoint); data is fetched
// live from /api/v1/ext/<module>/<endpoint>. Uninstalling the app removes the
// PageRegistry row, so the UI disappears with it — no core deploy needed.
function RemoteAppPageRenderer({ mapping, moduleName }: { mapping: any; moduleName: string }) {
  const client = useApiClient();
  const layout = typeof mapping.layout === 'string' ? JSON.parse(mapping.layout) : (mapping.layout || {});
  const endpoint: string = layout.dataUrl || layout.endpoint || '';
  const columns: { key: string; label?: string }[] = Array.isArray(layout.columns) ? layout.columns : [];
  const [rows, setRows] = useState<any[]>([]);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await client.get<unknown>(`/ext/${moduleName}/${endpoint.replace(/^\//, '')}`);
        if (!mounted) return;
        const response = data as { data?: unknown[]; items?: unknown[] };
        setRows(Array.isArray(data) ? data : response.data ?? response.items ?? []);
        setState('ok');
      } catch {
        if (mounted) { setState('error'); setMessage('Network error contacting the app service.'); }
      }
    })();
    return () => { mounted = false; };
  }, [moduleName, endpoint, client]);

  const cols: { key: string; label?: string }[] = columns.length ? columns : (rows[0] ? Object.keys(rows[0]).filter((k) => !k.startsWith('_')).slice(0, 6).map((k) => ({ key: k })) : []);

  return (
    <div className="p-6">
      <h1 className={styles.s77}>{mapping.title}</h1>
      {state === 'loading' && <p className="ui-text-muted">Loading…</p>}
      {state === 'error' && <p className={styles.s78}>{message}</p>}
      {state === 'ok' && (
        <div className={styles.s79}>
          <table className={styles.s80}>
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c.key} className={styles.s81}>
                    {c.label || c.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={cols.length || 1} className={styles.s82}>No records.</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id || r._id || i}>
                  {cols.map((c) => (
                    <td key={c.key} className={styles.s83}>
                      {formatRemoteCell(r[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatRemoteCell(v: any): string {
  if (v == null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
