'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Spinner, Tabs, Tooltip } from '@unerp/ui';
import { Check, X, Minus, Shield, Search } from 'lucide-react';
import { PERMISSION_REGISTRY, getPermissionsByModule } from '@unerp/shared';

interface RoleData {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

const API_BASE = '/api/v1/admin';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function allModules(): string[] {
  const set = new Set<string>();
  PERMISSION_REGISTRY.forEach((p) => set.add(p.module));
  return Array.from(set);
}

export default function MatrixPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/roles`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : data?.data || []);
      } catch {
        setRoles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const modules = allModules().filter((m) =>
    !moduleFilter || m.toLowerCase().includes(moduleFilter.toLowerCase())
  );

  const getAccessLevel = (role: RoleData, mod: string): 'full' | 'partial' | 'none' => {
    const modPerms = getPermissionsByModule(mod);
    if (modPerms.length === 0) return 'none';
    const count = modPerms.filter((p) => role.permissions.includes(p.code)).length;
    if (count === modPerms.length) return 'full';
    if (count > 0) return 'partial';
    return 'none';
  };

  const levelConfig = {
    full: { bg: 'var(--color-success-light)', color: 'var(--color-success)', icon: <Check size={14} />, label: 'Full' },
    partial: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', icon: <Minus size={14} />, label: 'Partial' },
    none: { bg: 'transparent', color: 'var(--color-text-tertiary)', icon: <X size={12} />, label: 'None' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Permission Matrix"
        description="Visual overview of role-to-module access levels across your organization"
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Access Control' },
          { label: 'Permission Matrix' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'roles', label: 'Roles', icon: <Shield size={14} /> },
          { key: 'matrix', label: 'Permission Matrix' },
          { key: 'packages', label: 'Access Packages' },
        ]}
        value="matrix"
        onChange={(key) => {
          if (key === 'roles') window.location.href = '/admin/access-control/roles';
          if (key === 'packages') window.location.href = '/admin/access-control/packages';
        }}
      />

      {/* Filter */}
      <div style={{ position: 'relative', maxWidth: 320 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
        <input
          type="text" placeholder="Filter modules..."
          value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)',
            color: 'var(--color-text)', outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-sunken)' }}>
                <th style={{
                  padding: 'var(--space-3) var(--space-4)', textAlign: 'left',
                  fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)',
                  borderBottom: '2px solid var(--color-border)', borderRight: '1px solid var(--color-border)',
                  position: 'sticky', left: 0, background: 'var(--color-bg-sunken)', zIndex: 2, minWidth: 160,
                }}>
                  Role
                </th>
                {modules.map((mod) => (
                  <th key={mod} style={{
                    padding: 'var(--space-3) var(--space-3)', textAlign: 'center',
                    fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)',
                    textTransform: 'capitalize', borderBottom: '2px solid var(--color-border)',
                    borderRight: '1px solid var(--color-border)', whiteSpace: 'nowrap', minWidth: 80,
                  }}>
                    {mod}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)',
                    position: 'sticky', left: 0, background: 'var(--color-bg-elevated)', zIndex: 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'var(--weight-medium)', whiteSpace: 'nowrap' }}>{role.name}</span>
                      {role.isSystem && <Badge variant="warning">Sys</Badge>}
                    </div>
                  </td>
                  {modules.map((mod) => {
                    const level = getAccessLevel(role, mod);
                    const config = levelConfig[level];
                    const modPerms = getPermissionsByModule(mod);
                    const count = modPerms.filter((p) => role.permissions.includes(p.code)).length;
                    return (
                      <td key={mod} style={{
                        padding: 'var(--space-2)', textAlign: 'center',
                        borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)',
                        background: level === 'full' ? 'rgba(16, 185, 129, 0.06)' : level === 'partial' ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                      }}>
                        <Tooltip content={`${role.name}: ${count}/${modPerms.length} ${mod} permissions`}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 'var(--radius-md)',
                            background: config.bg, color: config.color,
                          }}>
                            {config.icon}
                          </div>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 'var(--space-5)', padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
          }}>
            {Object.entries(levelConfig).map(([key, config]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <span style={{ color: config.color }}>{config.icon}</span> {config.label} access
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
