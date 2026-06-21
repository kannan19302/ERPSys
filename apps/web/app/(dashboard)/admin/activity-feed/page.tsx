'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  action: string;
  fieldChanges: FieldChange[];
  metadata?: any;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'var(--color-success)',
  UPDATE: 'var(--color-primary)',
  DELETE: 'var(--color-danger)',
};

export default function ActivityFeedPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchFeed = useCallback(async (page = 1, append = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (userFilter) params.set('userId', userFilter);
      const res = await fetch(`/api/v1/admin/activity-feed?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const newItems: ActivityItem[] = (json.data || []).map((item: any) => ({
          ...item,
          fieldChanges: Array.isArray(item.fieldChanges) ? item.fieldChanges : [],
        }));
        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setPagination(json.pagination || { page, limit: 20, total: 0, totalPages: 0 });
      }
    } catch {
      // network error
    } finally {
      setLoading(false);
    }
  }, [entityTypeFilter, userFilter]);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchFeed(1), 30000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchFeed(pagination.page + 1, true);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
      {/* Filter Sidebar */}
      <aside style={{
        width: '260px',
        flexShrink: 0,
      }}>
        <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
            Filters
          </h3>

          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
            Entity Type
          </label>
          <input
            className="frappe-input"
            placeholder="e.g. User, Product"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            style={{ marginBottom: 'var(--space-3)', width: '100%' }}
          />

          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
            User ID
          </label>
          <input
            className="frappe-input"
            placeholder="Filter by user"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ marginBottom: 'var(--space-3)', width: '100%' }}
          />

          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
            Date From
          </label>
          <input
            className="frappe-input"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ marginBottom: 'var(--space-3)', width: '100%' }}
          />

          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
            Date To
          </label>
          <input
            className="frappe-input"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ marginBottom: 'var(--space-4)', width: '100%' }}
          />

          <button
            className="frappe-btn frappe-btn-primary"
            style={{ width: '100%' }}
            onClick={() => fetchFeed(1)}
          >
            Apply Filters
          </button>
        </div>
      </aside>

      {/* Main Feed */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
              Activity Feed
            </h1>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Company-wide change stream &middot; Auto-refreshes every 30s
            </p>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            {pagination.total} total changes
          </span>
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: 'var(--space-8)' }}>
          {/* Vertical timeline line */}
          <div style={{
            position: 'absolute',
            left: '11px',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'var(--color-border)',
          }} />

          {items.map((item) => (
            <div key={item.id} style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
              {/* Timeline dot */}
              <div style={{
                position: 'absolute',
                left: '-29px',
                top: 'var(--space-4)',
                width: '12px',
                height: '12px',
                borderRadius: 'var(--radius-full)',
                background: ACTION_COLORS[item.action] || 'var(--color-text-tertiary)',
                border: '2px solid var(--color-bg)',
                zIndex: 1,
              }} />

              <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  {/* Avatar placeholder */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-xs)',
                    flexShrink: 0,
                  }}>
                    {item.userName ? item.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                        {item.userName || 'Unknown User'}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'var(--weight-semibold)',
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: ACTION_COLORS[item.action] ? `${ACTION_COLORS[item.action]}20` : 'var(--color-bg-subtle)',
                        color: ACTION_COLORS[item.action] || 'var(--color-text-secondary)',
                      }}>
                        {item.action}
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {item.entityType}
                      </span>
                      <code style={{
                        fontSize: '10px',
                        background: 'var(--color-bg-subtle)',
                        padding: '1px 4px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text-tertiary)',
                      }}>
                        {item.entityId.slice(0, 12)}
                      </code>
                    </div>
                  </div>

                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                    {formatTime(item.createdAt)}
                  </span>
                </div>

                {/* Field changes */}
                {item.fieldChanges.length > 0 && (
                  <div style={{ marginTop: 'var(--space-2)', paddingLeft: 'calc(32px + var(--space-3))' }}>
                    {item.fieldChanges.map((fc, i) => (
                      <div key={i} style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-1) 0',
                      }}>
                        <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{fc.field}</span>
                        <span style={{
                          textDecoration: 'line-through',
                          color: 'var(--color-danger)',
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {String(fc.oldValue ?? '(empty)')}
                        </span>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>&rarr;</span>
                        <span style={{
                          color: 'var(--color-success)',
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {String(fc.newValue ?? '(empty)')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {items.length === 0 && !loading && (
            <div className="frappe-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No activity found. Changes will appear here as users interact with the system.
            </div>
          )}
        </div>

        {/* Load More */}
        {pagination.page < pagination.totalPages && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <button
              className="frappe-btn frappe-btn-secondary"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
            Loading activity feed...
          </div>
        )}
      </div>
    </div>
  );
}
