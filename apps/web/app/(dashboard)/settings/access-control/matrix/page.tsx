'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Spinner, Button, Tooltip, Drawer, Disclosure, EmptyState } from '@unerp/ui';
import { Check, X, Minus, Shield, Search, ArrowLeft } from 'lucide-react';
import { PERMISSION_REGISTRY, getPermissionsByModule, getCategoriesForModule, getPermissionsByCategory } from '@unerp/shared';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface RoleData {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
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
  const client = useApiClient();
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [drillIn, setDrillIn] = useState<RoleData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setRoles(await client.get<RoleData[]>('/admin/roles'));
      } catch {
        setRoles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

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
    <RouteGuard permission="settings.access-control.read">
    <div className="ui-stack-6">
      <PageHeader
        title="Permission Matrix"
        description="Visual overview of role-to-module access levels across your organization"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Identity & Access', href: '/settings/identity-access' },
          { label: 'Permission Matrix' },
        ]}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => { window.location.href = '/settings/identity-access?tab=roles'; }}
        style={{ alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={14} /> Back to Identity & Access
      </Button>

      {/* Filter */}
      <div className={styles.s1}>
        <Search size={16} className={styles.s20} />
        <input
          type="text" placeholder="Filter modules..."
          value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
          className={styles.s2}
        />
      </div>

      {loading ? (
        <div className="ui-center-pad">
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
        <Card padding="none" className="builder-table-wrapper">
          <table className={styles.s3}>
            <thead>
              <tr className={styles.s4}>
                <th className={styles.s5}>
                  Role
                </th>
                {modules.map((mod) => {
                  const categories = getCategoriesForModule(mod);
                  return (
                    <th key={mod} className={styles.s6}>
                      {mod}
                      {categories.length > 0 && (
                        <div className={styles.s7}>
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
                  <td className={styles.s8}>
                    <div className="ui-hstack-2">
                      <span className={styles.s9}>{role.name}</span>
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
                      <div style={{ background: config.bg, color: config.color }} className={styles.s10}>
                        {config.icon}
                      </div>
                    );
                    return (
                      <td key={mod} style={{ background: level === 'full' ? 'rgba(16, 185, 129, 0.06)' : level === 'partial' ? 'rgba(245, 158, 11, 0.06)' : 'transparent' }} className={styles.s11}>
                        {hasCategories ? (
                          <button
                            type="button"
                            onClick={() => setDrillIn(role)}
                            aria-label={`View ${mod} permission detail for ${role.name}`}
                            className={styles.s12}
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
          <div className={styles.s13}>
            {Object.entries(levelConfig).map(([key, config]) => (
              <span key={key} className="ui-flex ui-items-center ui-gap-1">
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
    </RouteGuard>
  );
}

function AdminCategoryBreakdown({ role }: { role: RoleData }) {
  const categories = getCategoriesForModule('admin');

  if (categories.length === 0) {
    return <EmptyState title="No admin categories defined" description="This module has no category grouping configured." />;
  }

  return (
    <div className="ui-stack-3">
      {categories.map((category) => {
        const perms = getPermissionsByCategory('admin', category);
        const granted = perms.filter((p) => role.permissions.includes(p.code)).length;
        const percentage = perms.length > 0 ? Math.round((granted / perms.length) * 100) : 0;
        const badgeVariant = percentage === 100 ? 'success' : percentage > 0 ? 'warning' : 'default';

        return (
          <div key={category} className={`ui-card ${styles.s14}`} >
            <Disclosure
              summary={
                <div className={styles.s15}>
                  <span className="ui-heading-sm">{category}</span>
                  <Badge variant={badgeVariant}>{granted}/{perms.length}</Badge>
                </div>
              }
            >
              <div className={styles.s16}>
                <div className={styles.s17}>
                  <div style={{ width: `${percentage}%`, background: percentage === 100 ? 'var(--color-success)' : percentage > 0 ? 'var(--color-warning)' : 'transparent' }} className={styles.s18} />
                </div>
                <div className="ui-stack-2">
                  {perms.map((perm) => {
                    const has = role.permissions.includes(perm.code);
                    return (
                      <div key={perm.code} style={{ color: has ? 'var(--color-text)' : 'var(--color-text-tertiary)' }} className={styles.s19}>
                        {has ? <Check size={13} className={styles.s21} /> : <X size={12} className={styles.s22} />}
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
