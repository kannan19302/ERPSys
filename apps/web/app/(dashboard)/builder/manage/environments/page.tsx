'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable, ConfirmDialog } from '@unerp/ui';
import { GitFork, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function EnvironmentsPage() {
  const client = useApiClient();
  const [apps, setApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [environments, setEnvironments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionConfirm, setActionConfirm] = useState<{ type: 'staging' | 'production'; name: string } | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const data = await client.get<any>('/builder/modules');
      const list = Array.isArray(data) ? data : (data.data || []);
      setApps(list);
      if (list.length > 0) {
        setSelectedAppId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [client]);

  const fetchEnvironments = useCallback(async (appId: string) => {
    if (!appId) return;
    setLoading(true);
    try {
      setEnvironments(await client.get(`/builder/governance/modules/${appId}/environments`));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [client]);

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
      const endpoint = target === 'staging' ? 'promote-staging' : 'promote-production';
      await client.post(`/builder/governance/modules/${selectedAppId}/${endpoint}`);
      fetchEnvironments(selectedAppId);
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
              className={`ui-btn ui-btn-primary ${styles.s1}`} 
              onClick={() => setActionConfirm({ type: 'staging', name: 'Staging' })}
              
            >
              <ArrowUpCircle size={12} /> Promote to Staging
            </button>
          );
        }
        if (row.environment === 'STAGING') {
          return (
            <button 
              className={`ui-btn ${styles.s2}`} 
              onClick={() => setActionConfirm({ type: 'production', name: 'Production' })}
              
            >
              <ArrowUpCircle size={12} /> Promote to Production
            </button>
          );
        }
        return <span className="ui-text-xs-soft">Latest Deployment Staged</span>;
      }
    }
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader 
        title="Environment Promotion Pipeline" 
        description="Promote custom apps across isolation environments (Development → Staging → Production)."
        actions={
          <div className="ui-hstack-3">
            <span className={styles.s3}>Select App:</span>
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              className={`ui-input ${styles.s4}`}
              
            >
              {apps.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className={styles.s5}>Loading promotion mapping...</div>
      ) : (
        <div className="ui-card">
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
