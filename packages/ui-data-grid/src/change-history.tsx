'use client';

import { type FC, useState, useEffect, useCallback } from 'react';

interface FieldChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
}

interface ChangeEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  fieldChanges: FieldChange[];
  createdAt: string;
}

export interface ChangeHistoryProps {
  entityType: string;
  entityId: string;
  apiBase?: string;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function actionLabel(action: string): string {
  switch (action) {
    case 'CREATE': return 'created this record';
    case 'UPDATE': return 'updated this record';
    case 'DELETE': return 'deleted this record';
    case 'STATUS_CHANGE': return 'changed status';
    default: return action.toLowerCase();
  }
}

export const ChangeHistory: FC<ChangeHistoryProps> = ({
  entityType,
  entityId,
  apiBase = '/api/v1',
}) => {
  const [entries, setEntries] = useState<ChangeEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(
        `${apiBase}/change-history/${entityType}/${entityId}?page=${pageNum}&limit=20`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) return;
      const result = await res.json();
      const newEntries = result.data || [];
      setEntries((prev) => pageNum === 1 ? newEntries : [...prev, ...newEntries]);
      setHasMore(pageNum < (result.meta?.totalPages || 1));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [apiBase, entityType, entityId]);

  useEffect(() => {
    if (entityId) fetchHistory(1);
  }, [entityId, fetchHistory]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchHistory(next);
  };

  if (entries.length === 0 && !loading) return null;

  return (
    <div style={{
      marginTop: 'var(--space-8)',
      padding: 'var(--space-6)',
      background: 'var(--color-bg-subtle, #f9fafb)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border-subtle, #e5e7eb)',
    }}>
      <h4 style={{
        margin: '0 0 var(--space-4)',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: 'var(--color-text-muted, #6b7280)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Activity
      </h4>

      <div style={{ position: 'relative', paddingLeft: 'var(--space-6)' }}>
        {/* Timeline line */}
        <div style={{
          position: 'absolute',
          left: '7px',
          top: 0,
          bottom: 0,
          width: '2px',
          background: 'var(--color-border, #e5e7eb)',
        }} />

        {entries.map((entry) => (
          <div key={entry.id} style={{
            position: 'relative',
            marginBottom: 'var(--space-4)',
            paddingBottom: 'var(--space-4)',
          }}>
            {/* Timeline dot */}
            <div style={{
              position: 'absolute',
              left: '-19px',
              top: '6px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: entry.action === 'CREATE'
                ? 'var(--color-success, #22c55e)'
                : entry.action === 'DELETE'
                  ? 'var(--color-danger, #ef4444)'
                  : 'var(--color-primary, #3b82f6)',
              border: '2px solid var(--color-bg-subtle, #f9fafb)',
            }} />

            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted, #6b7280)',
            }}>
              <span style={{ fontWeight: 500, color: 'var(--color-text, #111827)' }}>
                {entry.userName}
              </span>
              {' '}{actionLabel(entry.action)}
              <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                {formatDate(entry.createdAt)}
              </span>
            </div>

            {entry.fieldChanges && entry.fieldChanges.length > 0 && entry.action !== 'CREATE' && (
              <div style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted, #6b7280)',
              }}>
                {entry.fieldChanges.map((fc, i) => (
                  <div key={i} style={{ marginBottom: '2px' }}>
                    <span style={{ fontWeight: 500 }}>{fc.label}:</span>{' '}
                    <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>
                      {formatValue(fc.oldValue)}
                    </span>
                    {' → '}
                    <span style={{ fontWeight: 500 }}>
                      {formatValue(fc.newValue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
          Loading...
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={loadMore}
          style={{
            display: 'block',
            margin: '0 auto',
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-primary, #3b82f6)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Load more
        </button>
      )}
    </div>
  );
};
