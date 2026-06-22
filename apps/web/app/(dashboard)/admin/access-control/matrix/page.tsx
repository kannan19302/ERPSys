'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Badge, Spinner } from '@unerp/ui';
import { Check, X, AlertCircle } from 'lucide-react';
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

export default function MatrixTab() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Permissions Matrix"
        description="Visualize and audit access authorizations across all modules at a glance."
        breadcrumbs={[
          { label: 'Administration', href: '/admin/users' },
          { label: 'Access Control', href: '/admin/access-control/roles' },
          { label: 'Permissions Matrix' },
        ]}
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <CenteredSpinner />
      ) : roles.length === 0 ? (
        <Card padding="lg" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No roles available to display matrix.</p>
        </Card>
      ) : (
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
      )}
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
