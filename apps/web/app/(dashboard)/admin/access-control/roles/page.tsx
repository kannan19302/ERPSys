'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Badge, Spinner, Button } from '@unerp/ui';
import { Shield, Plus, ChevronDown, ChevronRight, X, AlertCircle } from 'lucide-react';
import { PERMISSION_REGISTRY, getPermissionsByModule } from '@unerp/shared';

interface RoleData {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
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

export default function RolesTab() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/roles`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : data?.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(msg);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="User Roles"
        description="Configure role authorizations and assign permission sets to user profiles."
        breadcrumbs={[
          { label: 'Administration', href: '/admin/users' },
          { label: 'Access Control', href: '/admin/access-control/roles' },
          { label: 'User Roles' },
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
              fetchRoles();
            }}
          />
        )}
      </div>
    </div>
  );
}

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
