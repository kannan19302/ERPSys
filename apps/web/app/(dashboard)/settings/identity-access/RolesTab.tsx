'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Badge, Spinner, Button, Modal, TextField, FormField, ProtectedComponent,
} from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import { Shield, Plus, ChevronDown, ChevronRight, Search, Edit2, Copy, LayoutGrid } from 'lucide-react';
import { PERMISSION_REGISTRY, getPermissionsByModule, getCategoriesForModule, getPermissionsByCategory } from '@unerp/shared';
import styles from './RolesTab.module.css';

interface RoleData {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  userCount?: number;
}

function allModules(): string[] {
  const set = new Set<string>();
  PERMISSION_REGISTRY.forEach((p) => set.add(p.module));
  return Array.from(set);
}

export default function RolesTab() {
  const client = useApiClient();
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await client.get<RoleData[] | { data?: RoleData[] }>('/admin/roles');
      setRoles(Array.isArray(data) ? data : data.data || []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (!loaded) fetchRoles();
  }, [client, loaded]);

  const filteredRoles = roles.filter((r) =>
    !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end ui-gap-2">
        <Button variant="outline" onClick={() => { window.location.href = '/settings/access-control/matrix'; }}>
          <LayoutGrid size={14} className="mr-2" /> Permissions Matrix
        </Button>
        <ProtectedComponent permission="admin.role.create">
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-2" /> Create Role
          </Button>
        </ProtectedComponent>
      </div>

      {/* Search */}
      <Card>
        <div className={styles.s1}>
          <div className={styles.s2}>
            <Search size={16} className={styles.s3} />
            <input
              type="text" placeholder="Search roles..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.s4}
            />
          </div>
          <span className={styles.s5}>
            {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      {/* Roles List */}
      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="ui-stack-3">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              expanded={expandedId === role.id}
              onToggle={() => setExpandedId(expandedId === role.id ? null : role.id)}
            />
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      <CreateRoleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); fetchRoles(); }}
      />
    </div>
  );
}

function RoleCard({ role, expanded, onToggle }: { role: RoleData; expanded: boolean; onToggle: () => void }) {
  const modules = allModules();
  const permCount = role.permissions.length;
  const panelId = `role-card-panel-${role.id}`;

  return (
    <Card padding="none" className={styles.s6}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={styles.s7}
      >
        <div className="ui-hstack-3">
          <div className={styles.s8} style={{background: role.isSystem ? 'var(--color-warning-light)' : 'var(--color-primary-light)', color: role.isSystem ? 'var(--color-warning)' : 'var(--color-primary)'}}>
            <Shield size={18} />
          </div>
          <div>
            <div className="ui-hstack-2">
              <span className="ui-heading-sm">{role.name}</span>
              {role.isSystem && <Badge variant="warning">System</Badge>}
            </div>
            <p className={styles.s9}>
              {role.description}
            </p>
          </div>
        </div>
        <div className="ui-hstack-3">
          <Badge variant="info">{permCount} permissions</Badge>
          {expanded ? <ChevronDown size={16} className="ui-text-tertiary" /> : <ChevronRight size={16} className="ui-text-tertiary" />}
        </div>
      </button>

      {expanded && (
        <div id={panelId} className={styles.s10}>
          <div className="ui-flex-between mb-4">
            <span className={styles.s11}>
              MODULE PERMISSIONS
            </span>
            {!role.isSystem && (
              <ProtectedComponent permission="admin.role.update">
                <div className="ui-flex ui-gap-2">
                  <Button variant="outline" onClick={() => {}}>
                    <Edit2 size={12} className="mr-1" /> Edit
                  </Button>
                  <Button variant="outline" onClick={() => {}}>
                    <Copy size={12} className="mr-1" /> Duplicate
                  </Button>
                </div>
              </ProtectedComponent>
            )}
          </div>
          <div className={styles.s12}>
            {modules.map((mod) => {
              const modPerms = getPermissionsByModule(mod);
              if (modPerms.length === 0) return null;
              const grantedCount = modPerms.filter((p) => role.permissions.includes(p.code)).length;
              const percentage = Math.round((grantedCount / modPerms.length) * 100);
              const categories = getCategoriesForModule(mod);
              return (
                <div key={mod} className={styles.s13}>
                  <div className="ui-flex-between mb-2">
                    <span className={styles.s14}>
                      {mod}
                    </span>
                    <span className={styles.s15} style={{color: percentage === 100 ? 'var(--color-success)' : percentage > 0 ? 'var(--color-warning)' : 'var(--color-text-tertiary)' }}>
                      {grantedCount}/{modPerms.length}
                    </span>
                  </div>
                  <div className={styles.s16}>
                    <div className={styles.s17} style={{width: `${percentage}%`, background: percentage === 100 ? 'var(--color-success)' : percentage > 0 ? 'var(--color-warning)' : 'transparent'}} />
                  </div>
                  {categories.length > 0 ? (
                    <div className="ui-stack-3">
                      {categories.map((category) => {
                        const catPerms = getPermissionsByCategory(mod, category);
                        const catGranted = catPerms.filter((p) => role.permissions.includes(p.code)).length;
                        return (
                          <div key={category}>
                            <div className={styles.s18}>
                              <span className={styles.s19}>{category}</span>
                              <span className="ui-text-micro">{catGranted}/{catPerms.length}</span>
                            </div>
                            <div className={styles.s20}>
                              {catPerms.map((perm) => {
                                const has = role.permissions.includes(perm.code);
                                return (
                                  <label key={perm.code} className={styles.s21} style={{color: has ? 'var(--color-text)' : 'var(--color-text-tertiary)'}}>
                                    <input type="checkbox" checked={has} readOnly className={styles.s22} />
                                    {perm.description || perm.code}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.s23}>
                      {modPerms.map((perm) => {
                        const has = role.permissions.includes(perm.code);
                        return (
                          <label key={perm.code} className={styles.s24} style={{color: has ? 'var(--color-text)' : 'var(--color-text-tertiary)'}}>
                            <input type="checkbox" checked={has} readOnly className={styles.s25} />
                            {perm.description || perm.code}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function CreateRoleModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const client = useApiClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permSearch, setPermSearch] = useState('');
  const modules = allModules();

  const togglePerm = (code: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const toggleModule = (mod: string) => {
    const modPerms = getPermissionsByModule(mod);
    const allSelected = modPerms.every((p) => selectedPerms.has(p.code));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      modPerms.forEach((p) => { allSelected ? next.delete(p.code) : next.add(p.code); });
      return next;
    });
  };

  const toggleCategory = (mod: string, category: string) => {
    const catPerms = getPermissionsByCategory(mod, category);
    const allSelected = catPerms.every((p) => selectedPerms.has(p.code));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      catPerms.forEach((p) => { allSelected ? next.delete(p.code) : next.add(p.code); });
      return next;
    });
  };

  const matchesSearch = (label: string, code: string) =>
    !permSearch ||
    label.toLowerCase().includes(permSearch.toLowerCase()) ||
    code.toLowerCase().includes(permSearch.toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Role name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await client.post('/admin/roles', { name, description, permissions: Array.from(selectedPerms) });
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
      title="Create Role"
      description="Define a new role with specific permissions for each module"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit as any} disabled={saving}>
            {saving ? <><Spinner size="sm" /> Creating...</> : 'Create Role'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="ui-stack-4">
        {error && (
          <div className={styles.s26}>
            {error}
          </div>
        )}

        <div className="ui-grid-2 ui-gap-3">
          <TextField label="Role Name" placeholder="e.g. Sales Manager" required value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Description" placeholder="Brief description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <FormField label={`Permissions (${selectedPerms.size} selected)`} required>
          <div className={styles.s27}>
            <Search size={14} className={styles.s28} />
            <input
              type="text" placeholder="Filter permissions..."
              value={permSearch} onChange={(e) => setPermSearch(e.target.value)}
              className={styles.s29}
            />
          </div>
          <div className={styles.s30}>
            {modules.map((mod) => {
              const allModPerms = getPermissionsByModule(mod);
              const modPerms = allModPerms.filter((p) => matchesSearch(p.description || p.code, p.code));
              if (modPerms.length === 0) return null;
              const selectedCount = modPerms.filter((p) => selectedPerms.has(p.code)).length;
              const categories = getCategoriesForModule(mod);
              return (
                <div key={mod} className="border-b">
                  <label className={styles.s31}>
                    <input
                      type="checkbox"
                      checked={selectedCount === modPerms.length && modPerms.length > 0}
                      ref={(el) => { if (el) el.indeterminate = selectedCount > 0 && selectedCount < modPerms.length; }}
                      onChange={() => toggleModule(mod)}
                      className={styles.s32}
                    />
                    <span className={styles.s33}>{mod}</span>
                    <span className="ui-text-micro">{selectedCount}/{modPerms.length}</span>
                  </label>

                  {categories.length > 0 ? (
                    <div className={styles.s34}>
                      {categories.map((category) => {
                        const allCatPerms = getPermissionsByCategory(mod, category);
                        const catPerms = allCatPerms.filter((p) => matchesSearch(p.description || p.code, p.code));
                        if (catPerms.length === 0) return null;
                        const catSelectedCount = catPerms.filter((p) => selectedPerms.has(p.code)).length;
                        return (
                          <div key={category}>
                            <label className={styles.s35}>
                              <input
                                type="checkbox"
                                checked={catSelectedCount === catPerms.length && catPerms.length > 0}
                                ref={(el) => { if (el) el.indeterminate = catSelectedCount > 0 && catSelectedCount < catPerms.length; }}
                                onChange={() => toggleCategory(mod, category)}
                                className={styles.s36}
                              />
                              <span className={styles.s37}>{category}</span>
                              <span className="ui-text-micro">{catSelectedCount}/{catPerms.length}</span>
                            </label>
                            <div className={styles.s38}>
                              {catPerms.map((perm) => (
                                <label key={perm.code} className={styles.s39}>
                                  <input type="checkbox" checked={selectedPerms.has(perm.code)} onChange={() => togglePerm(perm.code)} className={styles.s40} />
                                  {perm.description || perm.code}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.s41}>
                      {modPerms.map((perm) => (
                        <label key={perm.code} className={styles.s42}>
                          <input type="checkbox" checked={selectedPerms.has(perm.code)} onChange={() => togglePerm(perm.code)} className={styles.s43} />
                          {perm.description || perm.code}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FormField>
      </form>
    </Modal>
  );
}
