'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column,
  ProtectedComponent, useToast,
} from '@unerp/ui';
import { Database, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface BackupRecord {
  id: string;
  filename: string;
  sizeBytes: number;
  createdBy: string;
  createdAt: string;
  source: 'REAL' | 'SIMULATED';
}

const PERMISSION = 'system.operations.backup';

function formatSize(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function BackupPage() {
  const client = useApiClient();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.get<BackupRecord[] | { data?: BackupRecord[] }>('/admin/operations/backups');
      setBackups(Array.isArray(data) ? data : data?.data || []);
    } catch {
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  }, [client, toast]);

  useEffect(() => {
    void fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await client.post('/admin/operations/backups/create');
      toast.success('Simulated backup entry recorded', 'No file was written — this feature is not yet connected to real storage.');
      void fetchBackups();
    } catch {
      toast.error('Failed to record simulated backup');
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<BackupRecord>[] = [
    {
      key: 'filename', header: 'Backup Entry',
      render: (row) => (
        <div className="ui-hstack-2">
          <span className={styles.p1}>{row.filename}</span>
          {row.source === 'SIMULATED' && <Badge variant="warning">Simulated</Badge>}
        </div>
      ),
    },
    {
      key: 'sizeBytes', header: 'Size',
      render: (row) => <span className="text-xs">{formatSize(row.sizeBytes)}</span>,
    },
    {
      key: 'createdBy', header: 'Recorded By',
      render: (row) => <span className="ui-text-xs-muted">{row.createdBy}</span>,
    },
    {
      key: 'createdAt', header: 'Recorded At',
      render: (row) => <span className="ui-text-xs-muted">{new Date(row.createdAt).toLocaleString()}</span>,
    },
  ];

  return (
    <RouteGuard permission="system.operations.backup">
    <div className="ui-stack-6">
      <PageHeader
        title="Backup & Restore Manager (Preview)"
        description="This is a preview of the backup workflow. Generated entries are simulated and do not yet produce a restorable database file."
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Database Backups' },
        ]}
        actions={
          <ProtectedComponent permission={PERMISSION}>
            <div className="ui-flex ui-gap-3">
              <Button variant="primary" onClick={handleCreateBackup} disabled={creating} leftIcon={<Plus size={14} />}>
                {creating ? 'Recording...' : 'Simulate Backup Run'}
              </Button>
              <Button variant="outline" onClick={fetchBackups} disabled={loading} leftIcon={<RefreshCw size={14} className={loading ? 'spin' : ''} />}>
                Refresh
              </Button>
            </div>
          </ProtectedComponent>
        }
      />

      <ProtectedComponent
        permission={PERMISSION}
        fallback={
          <Card>
            <div className={styles.p2}>
              You do not have permission to view backup records. Contact your Platform Admin if you believe this is an error.
            </div>
          </Card>
        }
      >
        <div className={styles.s1}>
          <ShieldAlert size={18} className={styles.p3} />
          <p className={styles.p4}>
            <strong className={styles.p5}>Simulated data</strong> — Backup &amp; Restore is not yet connected to a real storage backend.
            No production DR coverage exists via this page today. Contact your platform team for actual database backup status.
          </p>
        </div>

        <Card padding="none">
          <DataTable
            columns={columns}
            data={backups}
            loading={loading}
            rowKey={(row) => row.id}
            emptyTitle="No backup entries"
            emptyMessage="Simulate a backup run to see an entry appear here."
            emptyIcon={<Database size={48} />}
          />
        </Card>
      </ProtectedComponent>
    </div>
    </RouteGuard>
  );
}
