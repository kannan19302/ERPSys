'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable, ConfirmDialog } from '@unerp/ui';
import { GitFork, ArrowUpCircle, RefreshCw } from 'lucide-react';

export default function EnvironmentsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [environments, setEnvironments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionConfirm, setActionConfirm] = useState<{ type: 'staging' | 'production'; name: string } | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/modules', {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        setApps(list);
        if (list.length > 0) {
          setSelectedAppId(list[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchEnvironments = useCallback(async (appId: string) => {
    if (!appId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/governance/modules/${appId}/environments`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setEnvironments(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    if (selectedAppId) {
      fetchEnvironments(selectedAppId);
    }
  }, [selectedAppId, fetchEnvironments]);

  const executePromotion = async (target: 'staging' | 'production') => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = target === 'staging' ? 'promote-staging' : 'promote-production';
      const res = await fetch(`/api/v1/builder/governance/modules/${selectedAppId}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        fetchEnvironments(selectedAppId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { key: 'environment', header: 'Environment' },
    { 
      key: 'version', 
      header: 'Active Version',
      render: (row: any) => row.version ? `v${row.version}` : 'Not Promoted'
    },
    { 
      key: 'promotedAt', 
      header: 'Deployed At',
      render: (row: any) => row.promotedAt ? new Date(row.promotedAt).toLocaleString() : '—'
    },
    { key: 'promotedBy', header: 'Deployed By' },
    {
      key: 'actions',
      header: 'Promotion Actions',
      render: (row: any) => {
        if (row.environment === 'DRAFT') {
          return (
            <button 
              className="frappe-btn frappe-btn-primary" 
              onClick={() => setActionConfirm({ type: 'staging', name: 'Staging' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '11px', padding: '4px 10px' }}
            >
              <ArrowUpCircle size={12} /> Promote to Staging
            </button>
          );
        }
        if (row.environment === 'STAGING') {
          return (
            <button 
              className="frappe-btn" 
              onClick={() => setActionConfirm({ type: 'production', name: 'Production' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '11px', padding: '4px 10px', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
            >
              <ArrowUpCircle size={12} /> Promote to Production
            </button>
          );
        }
        return <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Latest Deployment Staged</span>;
      }
    }
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="Environment Promotion Pipeline" 
        description="Promote custom apps across isolation environments (Development → Staging → Production)."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Select App:</span>
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              className="frappe-input"
              style={{ minWidth: 200 }}
            >
              {apps.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading promotion mapping...</div>
      ) : (
        <div className="frappe-card">
          <DataTable columns={columns} data={environments} />
        </div>
      )}

      <ConfirmDialog
        open={!!actionConfirm}
        onClose={() => setActionConfirm(null)}
        onConfirm={() => {
          if (actionConfirm) {
            executePromotion(actionConfirm.type);
            setActionConfirm(null);
          }
        }}
        title={`Promote App Release`}
        message={`Are you sure you want to promote the active release version to ${actionConfirm?.name}?`}
        confirmLabel="Promote Version"
        variant="primary"
      />
    </div>
  );
}
