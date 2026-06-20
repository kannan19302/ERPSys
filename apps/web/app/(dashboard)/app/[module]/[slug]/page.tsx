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
      <div className="frappe-card m-6 text-center">
        <p className="text-muted-foreground p-8">Loading dynamic page...</p>
      </div>
    );
  }

  // ── Not found ──
  if (mapping === null) {
    return (
      <div className="frappe-card m-6 text-center p-6">
        <h2 className="text-danger text-2xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground mt-2">
          This custom page does not exist or was removed.
        </p>
        <button onClick={() => router.back()} className="frappe-btn frappe-btn-secondary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  // ── Form view (create or edit) ──
  if (view === 'form') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text">
              {editingRecord ? `Edit Record` : `New ${mapping.title}`}
            </h1>
            <p className="text-muted-foreground mt-1">
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="builder-header mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {mapping.title}
          </h1>
          <p className="text-muted-foreground mt-1">
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
        <div className="p-4 border-b flex justify-between items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[360px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
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
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground flex"
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows:</span>
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
          <div className="p-8 text-center text-muted-foreground">
            Loading records...
          </div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              {search ? 'No records match your search.' : 'No records found.'}
            </p>
            <button className="frappe-btn frappe-btn-primary mx-auto" onClick={() => { setEditingRecord(null); setView('form'); }}>
              <Plus size={14} />
              <span>Create First Record</span>
            </button>
          </div>
        ) : (
          <div className="builder-table-wrapper">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-muted-foreground font-medium w-20">
                    ID
                  </th>
                  {listColumns.map((col: any) => (
                    <th
                      key={col.name}
                      onClick={() => handleSort(col.name)}
                      className="p-3 text-muted-foreground font-medium cursor-pointer select-none whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown
                          size={12}
                          style={{
                            opacity: sortBy === col.name ? 1 : 0.3,
                            transform: sortBy === col.name && sortOrder === 'desc' ? 'scaleY(-1)' : 'none',
                            transition: 'transform var(--duration-fast)',
                          }}
                        />
                      </span>
                    </th>
                  ))}
                  <th className="p-3 text-muted-foreground font-medium text-right w-[120px]">
                    Created
                  </th>
                  <th className="p-3 w-[100px]"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((row: any) => (
                  <tr key={row.id} className="border-b">
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {row.id.substring(0, 8)}
                    </td>
                    {listColumns.map((col: any) => (
                      <td key={col.name} className="p-3">
                        {typeof row.data[col.name] === 'object'
                          ? JSON.stringify(row.data[col.name])
                          : String(row.data[col.name] ?? '-')}
                      </td>
                    ))}
                    <td className="p-3 text-right text-muted-foreground whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
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
                        <div className="flex gap-1 justify-end">
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
          <div className="p-3 border-t flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex gap-1">
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
