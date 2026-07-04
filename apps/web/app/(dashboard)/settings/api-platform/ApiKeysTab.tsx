'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Button, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, Spinner, ConfirmDialog,
} from '@unerp/ui';
import { Key, Plus, Trash2, Copy, CheckCircle } from 'lucide-react';

interface ApiKeyData {
  id: string;
  name: string;
  prefix: string;
  rateLimit: number;
  status: string;
  scopes: string[];
  createdAt: string;
}

const SCOPES = [
  { value: 'projects.project.read', label: 'View Projects' },
  { value: 'projects.project.create', label: 'Create Projects' },
  { value: 'pos.terminal.read', label: 'View POS Counters' },
  { value: 'analytics.report.read', label: 'Run Reports' },
  { value: 'admin.setting.read', label: 'View Settings' },
];

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState(120);
  const [newScopes, setNewScopes] = useState<string[]>(['projects.project.read']);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/admin/api-keys', {
          headers: { Authorization: `Bearer ${getToken() || ''}` },
        });
        if (res.ok) {
          const data = await res.json();
          setKeys(Array.isArray(data) ? data : data?.data || []);
        }
      } catch { /* use empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/v1/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ name: newName, rateLimit: newRate, scopes: newScopes }),
      });
      if (res.ok) {
        const data = await res.json();
        setKeys((prev) => [...prev, data]);
      }
    } catch { /* handled */ }
    finally {
      setCreating(false);
      setCreateOpen(false);
      setNewName('');
    }
  };

  const handleCopy = (prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedId(prefix);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns: Column<ApiKeyData>[] = [
    {
      key: 'name', header: 'API Key',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-light)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
          >
            <Key size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <code style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{row.prefix}...</code>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(row.prefix); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-text-tertiary)' }}
                title="Copy key prefix"
              >
                {copiedId === row.prefix ? <CheckCircle size={12} style={{ color: 'var(--color-success)' }} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'scopes', header: 'Scopes',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
          {row.scopes.slice(0, 2).map((s) => <Badge key={s} variant="info">{s.split('.').pop()}</Badge>)}
          {row.scopes.length > 2 && <Badge variant="default">+{row.scopes.length - 2}</Badge>}
        </div>
      ),
    },
    {
      key: 'rateLimit', header: 'Rate Limit',
      render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.rateLimit}/min</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'danger'}>{row.status}</Badge>,
    },
    {
      key: 'createdAt', header: 'Created',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '60px',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
          title="Revoke"
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus size={14} style={{ marginRight: 6 }} /> Create API Key
        </Button>
      </div>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={keys}
          loading={loading}
          rowKey={(row) => row.id}
          emptyTitle="No API keys"
          emptyMessage="Create your first API key to enable external integrations."
          emptyIcon={<Key size={48} />}
        />
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create API Key"
        description="Generate a new API key with specific scopes and rate limits"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? <><Spinner size="sm" /> Creating...</> : 'Create Key'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Key Name" placeholder="e.g. Production Integration" required value={newName} onChange={(e) => setNewName(e.target.value)} />
          <FormField label="Rate Limit (requests/minute)">
            <Select value={newRate} onChange={(e) => setNewRate(Number(e.target.value))}>
              <option value={60}>60/min</option>
              <option value={120}>120/min</option>
              <option value={300}>300/min</option>
              <option value={600}>600/min</option>
              <option value={1000}>1000/min</option>
            </Select>
          </FormField>
          <FormField label="Scopes" required>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)', background: 'var(--color-bg)', maxHeight: 200, overflowY: 'auto',
            }}
            >
              {SCOPES.map((scope) => (
                <label key={scope.value} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newScopes.includes(scope.value)}
                    onChange={(e) => {
                      setNewScopes(e.target.checked
                        ? [...newScopes, scope.value]
                        : newScopes.filter((s) => s !== scope.value));
                    }}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontWeight: 'var(--weight-medium)' }}>{scope.label}</span>
                  <code style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{scope.value}</code>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setKeys(keys.filter((k) => k.id !== deleteTarget?.id)); setDeleteTarget(null); }}
        title="Revoke API Key"
        message={deleteTarget ? <span>Revoke <strong>{deleteTarget.name}</strong>? This cannot be undone and will immediately break any integrations using this key.</span> : undefined}
        confirmLabel="Revoke Key"
        variant="danger"
      />
    </div>
  );
}
