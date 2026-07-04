'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Badge, Spinner, Button, Modal, TextField, FormField,
  Textarea, DataTable, type Column, ProtectedComponent,
} from '@unerp/ui';
import { Package, Plus, Edit2, Trash2 } from 'lucide-react';
import { PERMISSION_REGISTRY, getPermissionsByModule } from '@unerp/shared';

interface AccessPackageData {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  fieldAccessRules: string[];
  recordFilters: string[];
  assignedRoles: string[];
}

const API_BASE = '/api/v1/admin';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` };
}

function allModules(): string[] {
  const set = new Set<string>();
  PERMISSION_REGISTRY.forEach((p) => set.add(p.module));
  return Array.from(set);
}

export default function PackagesTab() {
  const [packages, setPackages] = useState<AccessPackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/access-packages`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (!loaded) fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<AccessPackageData>[] = [
    {
      key: 'name', header: 'Package', width: '35%',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-lg)',
            background: 'var(--color-primary-light)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Package size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'permissions', header: 'Contents',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
          <Badge variant="info">{row.permissions.length} perms</Badge>
          {row.fieldAccessRules.length > 0 && <Badge variant="warning">{row.fieldAccessRules.length} field rules</Badge>}
          {row.recordFilters.length > 0 && <Badge variant="default">{row.recordFilters.length} filters</Badge>}
        </div>
      ),
    },
    {
      key: 'assignedRoles', header: 'Assigned To',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
          {row.assignedRoles.map((r) => <Badge key={r} variant="success">{r}</Badge>)}
        </div>
      ),
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '80px',
      render: () => (
        <ProtectedComponent permission="admin.access-package.update">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
            <button title="Edit" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}>
              <Edit2 size={14} />
            </button>
            <button title="Delete" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}>
              <Trash2 size={14} />
            </button>
          </div>
        </ProtectedComponent>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ProtectedComponent permission="admin.access-package.create">
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} style={{ marginRight: 6 }} /> Create Package
          </Button>
        </ProtectedComponent>
      </div>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={packages}
          loading={loading}
          rowKey={(row) => row.id}
          emptyTitle="No access packages yet"
          emptyMessage="Create your first access package to bundle permissions for easy role assignment."
          emptyIcon={<Package size={48} />}
        />
      </Card>

      <CreatePackageModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); fetchPackages(); }}
      />
    </div>
  );
}

function CreatePackageModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [fieldRules, setFieldRules] = useState('');
  const [recordFilters, setRecordFilters] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modules = allModules();

  const togglePerm = (code: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Package name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/access-packages`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          name, description, permissions: Array.from(selectedPerms),
          fieldAccessRules: fieldRules.split('\n').filter(Boolean),
          recordFilters: recordFilters.split('\n').filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error();
      onCreated();
    } catch {
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Access Package"
      description="Bundle permissions, field rules, and record filters"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit as any} disabled={saving}>
            {saving ? <><Spinner size="sm" /> Creating...</> : 'Create Package'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && (
          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
            {error}
          </div>
        )}

        <TextField label="Package Name" placeholder="e.g. Finance Full Access" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Description" placeholder="What does this package grant?" value={description} onChange={(e) => setDescription(e.target.value)} />

        <FormField label={`Permissions (${selectedPerms.size} selected)`}>
          <div style={{
            maxHeight: 240, overflowY: 'auto', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', background: 'var(--color-bg)',
          }}>
            {modules.map((mod) => {
              const modPerms = getPermissionsByModule(mod);
              return (
                <div key={mod} style={{ marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>{mod}</span>
                  <div style={{ paddingLeft: 'var(--space-4)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                    {modPerms.map((perm) => (
                      <label key={perm.code} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedPerms.has(perm.code)} onChange={() => togglePerm(perm.code)} style={{ accentColor: 'var(--color-primary)' }} />
                        {perm.description || perm.code}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </FormField>

        <FormField label="Field Access Rules" hint="One rule per line, e.g. finance.invoice.amount:hidden">
          <Textarea rows={3} value={fieldRules} onChange={(e) => setFieldRules(e.target.value)} placeholder="finance.invoice.amount:hidden" />
        </FormField>

        <FormField label="Record Filters" hint="One filter per line, e.g. crm.lead:owned_by_user">
          <Textarea rows={3} value={recordFilters} onChange={(e) => setRecordFilters(e.target.value)} placeholder="crm.lead:owned_by_user" />
        </FormField>
      </form>
    </Modal>
  );
}
