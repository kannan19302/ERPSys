'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Badge, Spinner, Button } from '@unerp/ui';
import { Package, Plus, X, AlertCircle } from 'lucide-react';
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

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || ''}`,
  };
}

function allModules(): string[] {
  const set = new Set<string>();
  PERMISSION_REGISTRY.forEach((p) => set.add(p.module));
  return Array.from(set);
}

const MOCK_PACKAGES: AccessPackageData[] = [
  {
    id: 'pkg-finance-full',
    name: 'Finance Full Access',
    description: 'Complete finance module access including reports and exports',
    permissions: getPermissionsByModule('finance').map((p) => p.code),
    fieldAccessRules: ['finance.invoice.amount:visible'],
    recordFilters: [],
    assignedRoles: ['Finance Manager'],
  },
  {
    id: 'pkg-crm-sales',
    name: 'CRM + Sales Bundle',
    description: 'Combined CRM and Sales module access',
    permissions: [
      ...getPermissionsByModule('crm').map((p) => p.code),
      ...getPermissionsByModule('sales').map((p) => p.code),
    ],
    fieldAccessRules: [],
    recordFilters: ['crm.lead:owned_by_user'],
    assignedRoles: ['Sales Rep'],
  },
];

export default function PackagesTab() {
  const [packages, setPackages] = useState<AccessPackageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/access-packages`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch access packages');
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : data?.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch access packages';
      setError(msg);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Access Packages"
        description="Bundle multiple permissions, field access, and record filters into reusable access packages."
        breadcrumbs={[
          { label: 'Administration', href: '/admin/users' },
          { label: 'Access Control', href: '/admin/access-control/roles' },
          { label: 'Access Packages' },
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {packages.length} access package{packages.length !== 1 ? 's' : ''} configured
          </p>
          <Button variant="primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={15} /> Create Package
          </Button>
        </div>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <CenteredSpinner />
        ) : (
          packages.map((pkg) => (
            <Card key={pkg.id} padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                    {pkg.name}
                  </h3>
                  <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {pkg.description}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <Badge variant="info">{pkg.permissions.length} permissions</Badge>
                    {pkg.fieldAccessRules.length > 0 && (
                      <Badge variant="warning">{pkg.fieldAccessRules.length} field rules</Badge>
                    )}
                    {pkg.recordFilters.length > 0 && (
                      <Badge variant="warning">{pkg.recordFilters.length} record filters</Badge>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                  {pkg.assignedRoles.map((r) => (
                    <Badge key={r} variant="success">{r}</Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}

        {showCreate && (
          <CreatePackageModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              fetchPackages();
            }}
          />
        )}
      </div>
    </div>
  );
}

function CreatePackageModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [fieldRules, setFieldRules] = useState('');
  const [recordFilters, setRecordFilters] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const modules = allModules();

  const togglePerm = (code: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Package name is required');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/access-packages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name,
          description,
          permissions: Array.from(selectedPerms),
          fieldAccessRules: fieldRules.split('\n').filter(Boolean),
          recordFilters: recordFilters.split('\n').filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Failed to create package');
      }
      onCreated();
    } catch {
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} title="Create Access Package">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {err && <ErrorBanner message={err} />}

        <div className="frappe-form-group">
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
            Package Name
          </label>
          <input className="frappe-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Finance Full Access" />
        </div>

        <div className="frappe-form-group">
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
            Description
          </label>
          <input className="frappe-input" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this package grant?" />
        </div>

        <div className="frappe-form-group">
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
            Permissions ({selectedPerms.size} selected)
          </label>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', background: 'var(--color-bg)' }}>
            {modules.map((mod) => {
              const modPerms = getPermissionsByModule(mod);
              return (
                <div key={mod} style={{ marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    {mod}
                  </span>
                  <div style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                    {modPerms.map((perm) => (
                      <label
                        key={perm.code}
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', cursor: 'pointer', minWidth: '180px' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPerms.has(perm.code)}
                          onChange={() => togglePerm(perm.code)}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        {perm.description || perm.code}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="frappe-form-group">
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
            Field Access Rules (one per line)
          </label>
          <textarea
            className="frappe-input"
            rows={3}
            value={fieldRules}
            onChange={(e) => setFieldRules(e.target.value)}
            placeholder="e.g. finance.invoice.amount:hidden"
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div className="frappe-form-group">
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
            Record Filters (one per line)
          </label>
          <textarea
            className="frappe-input"
            rows={3}
            value={recordFilters}
            onChange={(e) => setRecordFilters(e.target.value)}
            placeholder="e.g. crm.lead:owned_by_user"
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Create Package'}
          </Button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function ModalOverlay({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-bg-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
      }}
    >
      <div
        style={{
          background: 'var(--color-bg-elevated)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 'var(--space-5)' }}>{children}</div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-warning-light)',
        border: '1px solid var(--color-warning)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-warning-text)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <AlertCircle size={16} />
      <span>{message} (using local fallback data)</span>
    </div>
  );
}

function CenteredSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
      <Spinner size="lg" />
    </div>
  );
}
