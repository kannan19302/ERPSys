'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Badge, Spinner, Button, Modal, TextField, FormField,
  Textarea, DataTable, type Column, ProtectedComponent,
} from '@unerp/ui';
import { Package, Plus, Edit2, Trash2 } from 'lucide-react';
import { PERMISSION_REGISTRY, getPermissionsByModule } from '@unerp/shared';
import { useApiClient } from '@unerp/framework';
import styles from './PackagesTab.module.css';

interface AccessPackageData {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  fieldAccessRules: string[];
  recordFilters: string[];
  assignedRoles: string[];
}

function allModules(): string[] {
  const set = new Set<string>();
  PERMISSION_REGISTRY.forEach((p) => set.add(p.module));
  return Array.from(set);
}

export default function PackagesTab() {
  const client = useApiClient();
  const [packages, setPackages] = useState<AccessPackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.get<AccessPackageData[] | { data?: AccessPackageData[] }>('/admin/access-packages');
      setPackages(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchPackages();
  }, [fetchPackages]);

  const columns: Column<AccessPackageData>[] = [
    {
      key: 'name', header: 'Package', width: '35%',
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={styles.s1}>
            <Package size={18} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.name}</div>
            <div className="ui-text-xs-tertiary">{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'permissions', header: 'Contents',
      render: (row) => (
        <div className={styles.s2}>
          <Badge variant="info">{row.permissions.length} perms</Badge>
          {row.fieldAccessRules.length > 0 && <Badge variant="warning">{row.fieldAccessRules.length} field rules</Badge>}
          {row.recordFilters.length > 0 && <Badge variant="default">{row.recordFilters.length} filters</Badge>}
        </div>
      ),
    },
    {
      key: 'assignedRoles', header: 'Assigned To',
      render: (row) => (
        <div className={styles.s3}>
          {row.assignedRoles.map((r) => <Badge key={r} variant="success">{r}</Badge>)}
        </div>
      ),
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '80px',
      render: () => (
        <ProtectedComponent permission="admin.access-package.update">
          <div className={styles.s4}>
            <button title="Edit" className={styles.s5}>
              <Edit2 size={14} />
            </button>
            <button title="Delete" className={styles.s6}>
              <Trash2 size={14} />
            </button>
          </div>
        </ProtectedComponent>
      ),
    },
  ];

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <ProtectedComponent permission="admin.access-package.create">
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-2" /> Create Package
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
  const client = useApiClient();
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
      await client.post('/admin/access-packages', {
        name, description, permissions: Array.from(selectedPerms),
        fieldAccessRules: fieldRules.split('\n').filter(Boolean),
        recordFilters: recordFilters.split('\n').filter(Boolean),
      });
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
      <form onSubmit={handleSubmit} className="ui-stack-4">
        {error && (
          <div className={styles.s7}>
            {error}
          </div>
        )}

        <TextField label="Package Name" placeholder="e.g. Finance Full Access" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Description" placeholder="What does this package grant?" value={description} onChange={(e) => setDescription(e.target.value)} />

        <FormField label={`Permissions (${selectedPerms.size} selected)`}>
          <div className={styles.s8}>
            {modules.map((mod) => {
              const modPerms = getPermissionsByModule(mod);
              return (
                <div key={mod} className={styles.s9}>
                  <span className={styles.s10}>{mod}</span>
                  <div className={styles.s11}>
                    {modPerms.map((perm) => (
                      <label key={perm.code} className={styles.s12}>
                        <input type="checkbox" checked={selectedPerms.has(perm.code)} onChange={() => togglePerm(perm.code)} className={styles.s13} />
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
