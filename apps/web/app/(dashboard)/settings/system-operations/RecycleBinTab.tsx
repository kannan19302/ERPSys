'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle, Check,
} from 'lucide-react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import styles from './RecycleBinTab.module.css';

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

const API = '/admin/recycle-bin';

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

export default function RecycleBinTab() {
  const client = useApiClient();
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
      const res = await client.get<{ data: RecycleItem[]; meta: PaginationMeta }>(`${API}?${params}`);
      setItems(res.data);
      setMeta(res.meta);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [client, entityFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await client.get<{ data: Stats }>(`${API}/stats`);
      setStats(res.data);
    } catch { /* ignore */ }
  }, [client]);

  useEffect(() => { fetchItems(1); }, [fetchItems]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const restore = async (id: string) => {
    try {
      await client.post(`${API}/${id}/restore`);
      showToast('Record restored successfully');
      fetchItems(meta.page);
      fetchStats();
    } catch { showToast('Failed to restore', 'error'); }
  };

  const permDelete = async (id: string) => {
    try {
      await client.delete(`${API}/${id}`);
      showToast('Record permanently deleted');
      setConfirmModal(null);
      fetchItems(meta.page);
      fetchStats();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const purgeAll = async () => {
    try {
      await client.post(`${API}/purge`);
      showToast('Recycle bin emptied');
      setConfirmModal(null);
      fetchItems(1);
      fetchStats();
    } catch { showToast('Failed to purge', 'error'); }
  };

  const entityTypes = Object.keys(stats);

  return (
    <div>
      {toast && (
        <div className={styles.s1} style={{background: toast.type === 'success' ? '#059669' : '#dc2626'}}
        >
          {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {confirmModal && (
        <div className={styles.s2}
        >
          <div className={styles.s3}
          >
            <div className="ui-hstack-2 mb-4">
              <AlertTriangle size={20} color="#dc2626" />
              <span className={styles.s4}>
                {confirmModal.type === 'purge' ? 'Empty Recycle Bin' : 'Permanent Delete'}
              </span>
            </div>
            <p className={styles.s5}>
              {confirmModal.type === 'purge'
                ? 'This will permanently delete ALL items in the recycle bin. This action cannot be undone.'
                : 'This record will be permanently deleted and cannot be recovered.'}
            </p>
            <div className="ui-flex-end ui-gap-2">
              <button onClick={() => setConfirmModal(null)} className={styles.s6}
              >Cancel
              </button>
              <button onClick={() => (confirmModal.type === 'purge' ? purgeAll() : permDelete(confirmModal.id!))} className={styles.s7}
              >Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.s8}>
        <button onClick={() => setConfirmModal({ type: 'purge' })} className={styles.s9}
        >
          <Trash2 size={14} /> Empty Recycle Bin
        </button>
      </div>

      <div className={styles.s10}
      >
        {entityTypes.length === 0 && (
          <span className={styles.s11}>No deleted records</span>
        )}
        {entityTypes.map((type) => (
          <div key={type} className={styles.s12}
          >
            <span className={styles.s13} style={{background: badgeColor(type) }} />
            <span className="ui-text-muted">{type}</span>
            <span className={styles.s14}>{stats[type]}</span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className={styles.s15}
        >
          <option value="">All Entity Types</option>
          {['Customer', 'Product', 'Employee', 'Invoice', 'Order', 'Vendor'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <ListPageTemplate
          columns={[
            { key: 'entityType', header: 'Entity Type', render: (v) => (
              <span className={styles.s16} style={{background: `${badgeColor(String(v))}18`, color: badgeColor(String(v))}}
              >{String(v)}
              </span>
            ) },
            { key: 'entityName', header: 'Entity Name', render: (v) => <span className={styles.s17}>{String(v)}</span> },
            { key: 'deletedBy', header: 'Deleted By' },
            { key: 'deletedAt', header: 'Deleted At', render: (v) => relativeTime(String(v)) },
            { key: 'expiresAt', header: 'Expires At', render: (v) => new Date(String(v)).toLocaleDateString() },
            { key: 'id', header: 'Actions', render: (v, row) => (
              <div className="ui-flex ui-gap-2">
                <button onClick={() => restore(String(v))} className={styles.s18}
                ><RotateCcw size={12} /> Restore
                </button>
                <button onClick={() => setConfirmModal({ type: 'delete', id: String(v) })} className={styles.s19}
                ><Trash2 size={12} /> Delete
                </button>
              </div>
            ) },
          ] as ListColumn[]}
          data={items as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyTitle="No items"
          emptyDescription="No items in recycle bin."
        />
      </div>

      <div className="ui-flex-between">
        <span className="ui-text-sm-muted">
          {meta.total} item{meta.total !== 1 ? 's' : ''} &middot; Page {meta.page} of {meta.totalPages}
        </span>
        <div className="ui-flex ui-gap-2">
          <button disabled={meta.page <= 1} onClick={() => fetchItems(meta.page - 1)} className={styles.s20} style={{cursor: meta.page <= 1 ? 'not-allowed' : 'pointer', opacity: meta.page <= 1 ? 0.4 : 1}}
          ><ChevronLeft size={16} />
          </button>
          <button disabled={meta.page >= meta.totalPages} onClick={() => fetchItems(meta.page + 1)} className={styles.s21} style={{cursor: meta.page >= meta.totalPages ? 'not-allowed' : 'pointer', opacity: meta.page >= meta.totalPages ? 0.4 : 1}}
          ><ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
