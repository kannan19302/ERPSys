'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle, X, Check,
} from 'lucide-react';

/* ─── types ─── */
interface RecycleItem {
  id: string;
  entityType: string;
  entityName: string;
  deletedBy: string;
  deletedAt: string;
  expiresAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  [entityType: string]: number;
}

/* ─── api helpers ─── */
const API = '/api/v1/admin/recycle-bin';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/* ─── helpers ─── */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ENTITY_COLORS: Record<string, string> = {
  Customer: '#3b82f6', Product: '#8b5cf6', Employee: '#10b981',
  Invoice: '#f59e0b', Order: '#ef4444', Vendor: '#6366f1',
};

function badgeColor(type: string) {
  return ENTITY_COLORS[type] || 'var(--color-text-tertiary)';
}

/* ─── component ─── */
export default function RecycleBinPage() {
  const [items, setItems] = useState<RecycleItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [stats, setStats] = useState<Stats>({});
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'delete' | 'purge'; id?: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (entityFilter) params.set('entityType', entityFilter);
      const res = await apiFetch<{ data: RecycleItem[]; meta: PaginationMeta }>(`${API}?${params}`);
      setItems(res.data);
      setMeta(res.meta);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [entityFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Stats }>(`${API}/stats`);
      setStats(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchItems(1); }, [fetchItems]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const restore = async (id: string) => {
    try {
      await apiFetch<void>(`${API}/${id}/restore`, { method: 'POST' });
      showToast('Record restored successfully');
      fetchItems(meta.page);
      fetchStats();
    } catch { showToast('Failed to restore', 'error'); }
  };

  const permDelete = async (id: string) => {
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders() });
      showToast('Record permanently deleted');
      setConfirmModal(null);
      fetchItems(meta.page);
      fetchStats();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const purgeAll = async () => {
    try {
      await apiFetch<void>(`${API}/purge`, { method: 'POST' });
      showToast('Recycle bin emptied');
      setConfirmModal(null);
      fetchItems(1);
      fetchStats();
    } catch { showToast('Failed to purge', 'error'); }
  };

  const entityTypes = Object.keys(stats);

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? '#059669' : '#dc2626', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
          boxShadow: '0 4px 12px rgba(0,0,0,.15)',
        }}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)', width: 420, maxWidth: '90vw',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <AlertTriangle size={20} color="#dc2626" />
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
                {confirmModal.type === 'purge' ? 'Empty Recycle Bin' : 'Permanent Delete'}
              </span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
              {confirmModal.type === 'purge'
                ? 'This will permanently delete ALL items in the recycle bin. This action cannot be undone.'
                : 'This record will be permanently deleted and cannot be recovered.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button onClick={() => setConfirmModal(null)} style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-primary)', background: 'transparent',
                color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
              }}>Cancel</button>
              <button onClick={() => confirmModal.type === 'purge' ? purgeAll() : permDelete(confirmModal.id!)} style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Trash2 size={24} color="var(--color-text-primary)" />
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
              Recycle Bin
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Recover deleted records within the retention window
          </p>
        </div>
        <button onClick={() => setConfirmModal({ type: 'purge' })} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
          border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
        }}>
          <Trash2 size={14} /> Empty Recycle Bin
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)',
        padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-primary)',
      }}>
        {entityTypes.length === 0 && (
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>No deleted records</span>
        )}
        {entityTypes.map(type => (
          <div key={type} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
            padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-bg-primary)', fontSize: 'var(--text-sm)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: badgeColor(type),
            }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>{type}</span>
            <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>{stats[type]}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          style={{
            padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', cursor: 'pointer',
          }}
        >
          <option value="">All Entity Types</option>
          {['Customer', 'Product', 'Employee', 'Invoice', 'Order', 'Vendor'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{
        border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', marginBottom: 'var(--space-4)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-secondary)' }}>
              {['Entity Type', 'Entity Name', 'Deleted By', 'Deleted At', 'Expires At', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: 'var(--space-3) var(--space-4)', textAlign: 'left',
                  fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--color-border-primary)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>No items in recycle bin</td></tr>
            )}
            {!loading && items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                    background: `${badgeColor(item.entityType)}18`, color: badgeColor(item.entityType),
                  }}>{item.entityType}</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--weight-medium)' }}>
                  {item.entityName}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {item.deletedBy}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {relativeTime(item.deletedAt)}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {new Date(item.expiresAt).toLocaleDateString()}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => restore(item.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 'var(--radius-md)',
                      border: 'none', background: '#05966918', color: '#059669',
                      cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                    }}><RotateCcw size={12} /> Restore</button>
                    <button onClick={() => setConfirmModal({ type: 'delete', id: item.id })} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 'var(--radius-md)',
                      border: 'none', background: '#dc262618', color: '#dc2626',
                      cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                    }}><Trash2 size={12} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {meta.total} item{meta.total !== 1 ? 's' : ''} &middot; Page {meta.page} of {meta.totalPages}
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button disabled={meta.page <= 1} onClick={() => fetchItems(meta.page - 1)} style={{
            padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)',
            cursor: meta.page <= 1 ? 'not-allowed' : 'pointer', opacity: meta.page <= 1 ? 0.4 : 1,
            color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center',
          }}><ChevronLeft size={16} /></button>
          <button disabled={meta.page >= meta.totalPages} onClick={() => fetchItems(meta.page + 1)} style={{
            padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)',
            cursor: meta.page >= meta.totalPages ? 'not-allowed' : 'pointer', opacity: meta.page >= meta.totalPages ? 0.4 : 1,
            color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center',
          }}><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
