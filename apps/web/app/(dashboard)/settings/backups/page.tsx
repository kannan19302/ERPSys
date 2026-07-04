'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column,
  ProtectedComponent, useToast,
} from '@unerp/ui';
import { Database, Plus, RefreshCw, ShieldAlert } from 'lucide-react';

interface BackupRecord {
  id: string;
  filename: string;
  sizeBytes: number;
  createdBy: string;
  createdAt: string;
  source: 'REAL' | 'SIMULATED';
}

const PERMISSION = 'system.operations.backup';

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` };
}

function formatSize(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/operations/backups', { headers: getHeaders() });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setBackups(Array.isArray(data) ? data : data?.data || []);
    } catch {
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    // eslint-disable-next-line
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/v1/admin/operations/backups/create', {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      toast.success('Simulated backup entry recorded', 'No file was written — this feature is not yet connected to real storage.');
      fetchBackups();
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{row.filename}</span>
          {row.source === 'SIMULATED' && <Badge variant="warning">Simulated</Badge>}
        </div>
      ),
    },
    {
      key: 'sizeBytes', header: 'Size',
      render: (row) => <span style={{ fontSize: 'var(--text-xs)' }}>{formatSize(row.sizeBytes)}</span>,
    },
    {
      key: 'createdBy', header: 'Recorded By',
      render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{row.createdBy}</span>,
    },
    {
      key: 'createdAt', header: 'Recorded At',
      render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{new Date(row.createdAt).toLocaleString()}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Backup & Restore Manager (Preview)"
        description="This is a preview of the backup workflow. Generated entries are simulated and do not yet produce a restorable database file."
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Database Backups' },
        ]}
        actions={
          <ProtectedComponent permission={PERMISSION}>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              You do not have permission to view backup records. Contact your Platform Admin if you believe this is an error.
            </div>
          </Card>
        }
      >
        <div style={{
          display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start',
          padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
          background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)',
        }}>
          <ShieldAlert size={18} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
            <strong style={{ color: 'var(--color-text)' }}>Simulated data</strong> — Backup &amp; Restore is not yet connected to a real storage backend.
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
  );
}
