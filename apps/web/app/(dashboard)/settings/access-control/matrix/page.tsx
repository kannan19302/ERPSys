'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Spinner, Tabs, Tooltip, Drawer, Disclosure, EmptyState } from '@unerp/ui';
import { Check, X, Minus, Shield, Search } from 'lucide-react';
import { PERMISSION_REGISTRY, getPermissionsByModule, getCategoriesForModule, getPermissionsByCategory } from '@unerp/shared';

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

const levelConfig = {
  full: { bg: 'var(--color-success-light)', color: 'var(--color-success)', icon: <Check size={14} />, label: 'Full' },
  partial: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', icon: <Minus size={14} />, label: 'Partial' },
  none: { bg: 'transparent', color: 'var(--color-text-tertiary)', icon: <X size={12} />, label: 'None' },
};

type AccessLevel = keyof typeof levelConfig;

export default function MatrixPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [drillIn, setDrillIn] = useState<RoleData | null>(null);

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

  const getAccessLevel = (role: RoleData, mod: string): AccessLevel => {
    const modPerms = getPermissionsByModule(mod);
    if (modPerms.length === 0) return 'none';
    const count = modPerms.filter((p) => role.permissions.includes(p.code)).length;
    if (count === modPerms.length) return 'full';
    if (count > 0) return 'partial';
    return 'none';
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
      ) : roles.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Shield size={48} />}
            title="No roles found"
            description="Create a role in the Roles tab to see it reflected in the permission matrix."
          />
        </Card>
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
                {modules.map((mod) => {
                  const categories = getCategoriesForModule(mod);
                  return (
                    <th key={mod} style={{
                      padding: 'var(--space-3) var(--space-3)', textAlign: 'center',
                      fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)',
                      textTransform: 'capitalize', borderBottom: '2px solid var(--color-border)',
                      borderRight: '1px solid var(--color-border)', whiteSpace: 'nowrap', minWidth: 80,
                    }}>
                      {mod}
                      {categories.length > 0 && (
                        <div style={{ fontSize: '10px', fontWeight: 'var(--weight-normal)', textTransform: 'none', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                          ({categories.length} categories)
                        </div>
                      )}
                    </th>
                  );
                })}
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
                    const hasCategories = getCategoriesForModule(mod).length > 0;
                    const cellInner = (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 'var(--radius-md)',
                        background: config.bg, color: config.color,
                      }}>
                        {config.icon}
                      </div>
                    );
                    return (
                      <td key={mod} style={{
                        padding: 'var(--space-2)', textAlign: 'center',
                        borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)',
                        background: level === 'full' ? 'rgba(16, 185, 129, 0.06)' : level === 'partial' ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                      }}>
                        {hasCategories ? (
                          <button
                            type="button"
                            onClick={() => setDrillIn(role)}
                            aria-label={`View ${mod} permission detail for ${role.name}`}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          >
                            <Tooltip content={`${role.name}: ${count}/${modPerms.length} ${mod} permissions — click to view by category`}>
                              {cellInner}
                            </Tooltip>
                          </button>
                        ) : (
                          <Tooltip content={`${role.name}: ${count}/${modPerms.length} ${mod} permissions`}>
                            {cellInner}
                          </Tooltip>
                        )}
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

      {/* Admin permission drill-in drawer (Section 2.2) */}
      <Drawer
        open={!!drillIn}
        onClose={() => setDrillIn(null)}
        title={drillIn ? `${drillIn.name} — Admin permissions` : ''}
        width={480}
      >
        {drillIn && <AdminCategoryBreakdown role={drillIn} />}
      </Drawer>
    </div>
  );
}

function AdminCategoryBreakdown({ role }: { role: RoleData }) {
  const categories = getCategoriesForModule('admin');

  if (categories.length === 0) {
    return <EmptyState title="No admin categories defined" description="This module has no category grouping configured." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {categories.map((category) => {
        const perms = getPermissionsByCategory('admin', category);
        const granted = perms.filter((p) => role.permissions.includes(p.code)).length;
        const percentage = perms.length > 0 ? Math.round((granted / perms.length) * 100) : 0;
        const badgeVariant = percentage === 100 ? 'success' : percentage > 0 ? 'warning' : 'default';

        return (
          <div key={category} className="frappe-card" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
            <Disclosure
              summary={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{category}</span>
                  <Badge variant={badgeVariant}>{granted}/{perms.length}</Badge>
                </div>
              }
            >
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div style={{ height: 4, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-sunken)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
                  <div style={{
                    height: '100%', width: `${percentage}%`, borderRadius: 'var(--radius-full)',
                    background: percentage === 100 ? 'var(--color-success)' : percentage > 0 ? 'var(--color-warning)' : 'transparent',
                  }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {perms.map((perm) => {
                    const has = role.permissions.includes(perm.code);
                    return (
                      <div key={perm.code} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: has ? 'var(--color-text)' : 'var(--color-text-tertiary)' }}>
                        {has ? <Check size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} /> : <X size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
                        <span>{perm.description || perm.code}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Disclosure>
          </div>
        );
      })}
    </div>
  );
}
