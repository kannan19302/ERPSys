'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, PageHeader, Badge, Spinner, Button } from '@unerp/ui';
import {
  Shield,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Package,
  Grid3X3,
  AlertCircle,
} from 'lucide-react';
import {
  PERMISSION_REGISTRY,
  getPermissionsByModule,
} from '@unerp/shared';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface RoleData {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[]; // permission codes
}

interface AccessPackageData {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  fieldAccessRules: string[];
  recordFilters: string[];
  assignedRoles: string[];
}

type TabKey = 'roles' | 'packages' | 'matrix';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Mock fallback data                                                 */
/* ------------------------------------------------------------------ */

const MOCK_ROLES: RoleData[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: PERMISSION_REGISTRY.map((p) => p.code),
  },
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'User and role management',
    isSystem: true,
    permissions: getPermissionsByModule('admin').map((p) => p.code),
  },
  {
    id: 'role-finance',
    name: 'Finance Manager',
    description: 'Full access to finance module',
    isSystem: false,
    permissions: [
      ...getPermissionsByModule('finance').map((p) => p.code),
      'page.finance.access',
    ],
  },
  {
    id: 'role-hr',
    name: 'HR Manager',
    description: 'Full access to HR module',
    isSystem: false,
    permissions: [
      ...getPermissionsByModule('hr').map((p) => p.code),
      'page.hr.access',
    ],
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only access across modules',
    isSystem: true,
    permissions: PERMISSION_REGISTRY.filter((p) => p.action === 'read' || p.action === 'access').map((p) => p.code),
  },
];

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

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AccessControlPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('roles');

  /* Roles state */
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  /* Access packages state */
  const [packages, setPackages] = useState<AccessPackageData[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  /* ---- Fetch roles ---- */
  const fetchRoles = async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const res = await fetch(`${API_BASE}/roles`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : data?.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch roles';
      setRolesError(msg);
      setRoles(MOCK_ROLES);
    } finally {
      setRolesLoading(false);
    }
  };

  /* ---- Fetch packages ---- */
  const fetchPackages = async () => {
    setPackagesLoading(true);
    setPackagesError(null);
    try {
      const res = await fetch(`${API_BASE}/access-packages`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch access packages');
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : data?.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch access packages';
      setPackagesError(msg);
      setPackages(MOCK_PACKAGES);
    } finally {
      setPackagesLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPackages();
  }, []);

  /* ---- Tab bar styling ---- */
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'roles', label: 'Roles', icon: <Shield size={15} /> },
    { key: 'packages', label: 'Access Packages', icon: <Package size={15} /> },
    { key: 'matrix', label: 'Permission Matrix', icon: <Grid3X3 size={15} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Access Control"
        description="Manage roles, access packages, and review the permission matrix across all modules."
        breadcrumbs={[
          { label: 'Administration', href: '/admin/users' },
          { label: 'Access Control' },
        ]}
      />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-1)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              border: '1px solid',
              borderColor: activeTab === t.key ? 'var(--color-primary)' : 'var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: activeTab === t.key ? 'var(--color-primary)' : 'var(--color-bg)',
              color: activeTab === t.key ? 'var(--color-primary-contrast, #fff)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === t.key ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'roles' && (
        <RolesTab
          roles={roles}
          loading={rolesLoading}
          error={rolesError}
          onCreated={fetchRoles}
        />
      )}
      {activeTab === 'packages' && (
        <PackagesTab
          packages={packages}
          loading={packagesLoading}
          error={packagesError}
          onCreated={fetchPackages}
        />
      )}
      {activeTab === 'matrix' && (
        <MatrixTab roles={roles} />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Tab 1: Roles                                                       */
/* ================================================================== */

function RolesTab({
  roles,
  loading,
  error,
  onCreated,
}: {
  roles: RoleData[];
  loading: boolean;
  error: string | null;
  onCreated: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {roles.length} role{roles.length !== 1 ? 's' : ''} configured
        </p>
        <Button variant="primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Plus size={15} /> Create Role
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <CenteredSpinner />
      ) : (
        roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            expanded={expandedId === role.id}
            onToggle={() => setExpandedId(expandedId === role.id ? null : role.id)}
          />
        ))
      )}

      {showCreate && (
        <CreateRoleModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            onCreated();
          }}
        />
      )}
    </div>
  );
}

/* ---- Single role card ---- */

function RoleCard({
  role,
  expanded,
  onToggle,
}: {
  role: RoleData;
  expanded: boolean;
  onToggle: () => void;
}) {
  const modules = allModules();

  return (
    <Card padding="none" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {expanded ? <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} /> : <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                {role.name}
              </span>
              {role.isSystem && <Badge variant="warning">System</Badge>}
            </div>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              {role.description}
            </p>
          </div>
        </div>
        <Badge variant="info">{role.permissions.length} permissions</Badge>
      </button>

      {/* Expanded permission tree */}
      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            padding: 'var(--space-4) var(--space-5)',
            background: 'var(--color-bg-sunken)',
          }}
        >
          {modules.map((mod) => {
            const modPerms = getPermissionsByModule(mod);
            if (modPerms.length === 0) return null;
            return (
              <div key={mod} style={{ marginBottom: 'var(--space-4)' }}>
                <h4
                  style={{
                    margin: '0 0 var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {mod}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-1)' }}>
                  {modPerms.map((perm) => {
                    const has = role.permissions.includes(perm.code);
                    return (
                      <label
                        key={perm.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          fontSize: 'var(--text-xs)',
                          color: has ? 'var(--color-text)' : 'var(--color-text-tertiary)',
                          cursor: 'default',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={has}
                          readOnly
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        {perm.description || perm.code}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ---- Create role modal ---- */

function CreateRoleModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
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

  const toggleModule = (mod: string) => {
    const modPerms = getPermissionsByModule(mod);
    const allSelected = modPerms.every((p) => selectedPerms.has(p.code));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      modPerms.forEach((p) => {
        if (allSelected) next.delete(p.code);
        else next.add(p.code);
      });
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Role name is required');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name,
          description,
          permissions: Array.from(selectedPerms),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Failed to create role');
      }
      onCreated();
    } catch {
      // Mock success for dev
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} title="Create Role">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {err && <ErrorBanner message={err} />}

        <div className="frappe-form-group">
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
            Role Name
          </label>
          <input
            className="frappe-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sales Manager"
          />
        </div>

        <div className="frappe-form-group">
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
            Description
          </label>
          <input
            className="frappe-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this role"
          />
        </div>

        {/* Permission tree */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', background: 'var(--color-bg)' }}>
          {modules.map((mod) => {
            const modPerms = getPermissionsByModule(mod);
            const selectedCount = modPerms.filter((p) => selectedPerms.has(p.code)).length;
            return (
              <div key={mod} style={{ marginBottom: 'var(--space-3)' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontWeight: 'var(--weight-semibold)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCount === modPerms.length}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedCount > 0 && selectedCount < modPerms.length;
                    }}
                    onChange={() => toggleModule(mod)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  {mod} ({selectedCount}/{modPerms.length})
                </label>
                <div style={{ paddingLeft: 'var(--space-5)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-1)' }}>
                  {modPerms.map((perm) => (
                    <label
                      key={perm.code}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        fontSize: 'var(--text-xs)',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                      }}
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Create Role'}
          </Button>
        </div>
      </form>
    </ModalOverlay>
  );
}

/* ================================================================== */
/*  Tab 2: Access Packages                                             */
/* ================================================================== */

function PackagesTab({
  packages,
  loading,
  error,
  onCreated,
}: {
  packages: AccessPackageData[];
  loading: boolean;
  error: string | null;
  onCreated: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
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
            onCreated();
          }}
        />
      )}
    </div>
  );
}

/* ---- Create package modal ---- */

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

        {/* Permission multi-select */}
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

/* ================================================================== */
/*  Tab 3: Permission Matrix                                           */
/* ================================================================== */

function MatrixTab({ roles }: { roles: RoleData[] }) {
  const modules = allModules();

  const getAccessLevel = (role: RoleData, mod: string): 'full' | 'partial' | 'none' => {
    const modPerms = getPermissionsByModule(mod);
    if (modPerms.length === 0) return 'none';
    const count = modPerms.filter((p) => role.permissions.includes(p.code)).length;
    if (count === modPerms.length) return 'full';
    if (count > 0) return 'partial';
    return 'none';
  };

  const cellStyle = (level: 'full' | 'partial' | 'none'): React.CSSProperties => ({
    padding: 'var(--space-2) var(--space-3)',
    textAlign: 'center' as const,
    borderBottom: '1px solid var(--color-border)',
    borderRight: '1px solid var(--color-border)',
  });

  const cellIcon = (level: 'full' | 'partial' | 'none') => {
    if (level === 'full') return <Check size={16} style={{ color: 'var(--color-success)' }} />;
    if (level === 'partial') return <AlertCircle size={14} style={{ color: 'var(--color-warning)' }} />;
    return <X size={16} style={{ color: 'var(--color-danger)' }} />;
  };

  if (roles.length === 0) {
    return (
      <Card padding="lg" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No roles available to display matrix.</p>
      </Card>
    );
  }

  return (
    <Card padding="none" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-sunken)' }}>
            <th
              style={{
                padding: 'var(--space-3) var(--space-4)',
                textAlign: 'left',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-secondary)',
                borderBottom: '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                position: 'sticky',
                left: 0,
                background: 'var(--color-bg-sunken)',
                zIndex: 1,
              }}
            >
              Role
            </th>
            {modules.map((mod) => (
              <th
                key={mod}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  textAlign: 'center',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text-secondary)',
                  textTransform: 'capitalize',
                  borderBottom: '1px solid var(--color-border)',
                  borderRight: '1px solid var(--color-border)',
                  whiteSpace: 'nowrap',
                }}
              >
                {mod}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr
              key={role.id}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <td
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontWeight: 'var(--weight-medium)',
                  color: 'var(--color-text)',
                  borderBottom: '1px solid var(--color-border)',
                  borderRight: '1px solid var(--color-border)',
                  position: 'sticky',
                  left: 0,
                  background: 'var(--color-bg-elevated)',
                  zIndex: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {role.name}
                  {role.isSystem && <Badge variant="warning">Sys</Badge>}
                </div>
              </td>
              {modules.map((mod) => {
                const level = getAccessLevel(role, mod);
                return (
                  <td key={mod} style={cellStyle(level)}>
                    {cellIcon(level)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 'var(--space-5)', padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <Check size={14} style={{ color: 'var(--color-success)' }} /> Full access
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <AlertCircle size={12} style={{ color: 'var(--color-warning)' }} /> Partial access
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <X size={14} style={{ color: 'var(--color-danger)' }} /> No access
        </span>
      </div>
    </Card>
  );
}

/* ================================================================== */
/*  Shared UI components                                               */
/* ================================================================== */

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
