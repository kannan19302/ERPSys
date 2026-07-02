'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Badge, Spinner, Button, Modal, TextField, FormField,
  DataTable, type Column, Tabs,
} from '@unerp/ui';
import { Shield, Plus, ChevronDown, ChevronRight, Search, Edit2, Trash2, Copy, Users } from 'lucide-react';
import { PERMISSION_REGISTRY, getPermissionsByModule, getCategoriesForModule, getPermissionsByCategory } from '@unerp/shared';

interface RoleData {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  userCount?: number;
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

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/roles`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const filteredRoles = roles.filter((r) =>
    !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Roles & Permissions"
        description="Define roles with granular module-level permissions for your organization"
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Access Control' },
          { label: 'Roles' },
        ]}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} style={{ marginRight: 6 }} /> Create Role
          </Button>
        }
      />

      {/* Navigation Tabs */}
      <Tabs
        tabs={[
          { key: 'roles', label: 'Roles', icon: <Shield size={14} /> },
          { key: 'matrix', label: 'Permission Matrix' },
          { key: 'packages', label: 'Access Packages' },
        ]}
        value="roles"
        onChange={(key) => {
          if (key === 'matrix') window.location.href = '/admin/access-control/matrix';
          if (key === 'packages') window.location.href = '/admin/access-control/packages';
        }}
      />

      {/* Search */}
      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text" placeholder="Search roles..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)',
                color: 'var(--color-text)', outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
            {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      {/* Roles List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
    <Card padding="none" style={{ overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          padding: 'var(--space-4) var(--space-5)', cursor: 'pointer', border: 'none',
          background: 'transparent', font: 'inherit', color: 'inherit', textAlign: 'left',
          transition: 'background var(--duration-fast) var(--ease-default)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-lg)',
            background: role.isSystem ? 'var(--color-warning-light)' : 'var(--color-primary-light)',
            color: role.isSystem ? 'var(--color-warning)' : 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{role.name}</span>
              {role.isSystem && <Badge variant="warning">System</Badge>}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              {role.description}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Badge variant="info">{permCount} permissions</Badge>
          {expanded ? <ChevronDown size={16} style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />}
        </div>
      </button>

      {expanded && (
        <div id={panelId} style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-5)', background: 'var(--color-bg-sunken)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
              MODULE PERMISSIONS
            </span>
            {!role.isSystem && (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="outline" onClick={() => {}}>
                  <Edit2 size={12} style={{ marginRight: 4 }} /> Edit
                </Button>
                <Button variant="outline" onClick={() => {}}>
                  <Copy size={12} style={{ marginRight: 4 }} /> Duplicate
                </Button>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {modules.map((mod) => {
              const modPerms = getPermissionsByModule(mod);
              if (modPerms.length === 0) return null;
              const grantedCount = modPerms.filter((p) => role.permissions.includes(p.code)).length;
              const percentage = Math.round((grantedCount / modPerms.length) * 100);
              const categories = getCategoriesForModule(mod);
              return (
                <div key={mod} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', background: 'var(--color-bg-elevated)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                      {mod}
                    </span>
                    <span style={{ fontSize: '10px', color: percentage === 100 ? 'var(--color-success)' : percentage > 0 ? 'var(--color-warning)' : 'var(--color-text-tertiary)' }}>
                      {grantedCount}/{modPerms.length}
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-sunken)', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
                    <div style={{
                      height: '100%', width: `${percentage}%`, borderRadius: 'var(--radius-full)',
                      background: percentage === 100 ? 'var(--color-success)' : percentage > 0 ? 'var(--color-warning)' : 'transparent',
                      transition: 'width var(--duration-normal) var(--ease-default)',
                    }} />
                  </div>
                  {categories.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {categories.map((category) => {
                        const catPerms = getPermissionsByCategory(mod, category);
                        const catGranted = catPerms.filter((p) => role.permissions.includes(p.code)).length;
                        return (
                          <div key={category}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>{category}</span>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{catGranted}/{catPerms.length}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 'var(--space-3)' }}>
                              {catPerms.map((perm) => {
                                const has = role.permissions.includes(perm.code);
                                return (
                                  <label key={perm.code} style={{
                                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                                    fontSize: '11px', color: has ? 'var(--color-text)' : 'var(--color-text-tertiary)',
                                  }}>
                                    <input type="checkbox" checked={has} readOnly style={{ accentColor: 'var(--color-primary)', width: 13, height: 13 }} />
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {modPerms.map((perm) => {
                        const has = role.permissions.includes(perm.code);
                        return (
                          <label key={perm.code} style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                            fontSize: '11px', color: has ? 'var(--color-text)' : 'var(--color-text-tertiary)',
                          }}>
                            <input type="checkbox" checked={has} readOnly style={{ accentColor: 'var(--color-primary)', width: 13, height: 13 }} />
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
      const res = await fetch(`${API_BASE}/roles`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name, description, permissions: Array.from(selectedPerms) }),
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && (
          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <TextField label="Role Name" placeholder="e.g. Sales Manager" required value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Description" placeholder="Brief description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <FormField label={`Permissions (${selectedPerms.size} selected)`} required>
          <div style={{ position: 'relative', marginBottom: 'var(--space-2)' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text" placeholder="Filter permissions..."
              value={permSearch} onChange={(e) => setPermSearch(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px 6px 30px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-xs)',
                color: 'var(--color-text)', outline: 'none',
              }}
            />
          </div>
          <div style={{
            maxHeight: 360, overflowY: 'auto', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', background: 'var(--color-bg)',
          }}>
            {modules.map((mod) => {
              const allModPerms = getPermissionsByModule(mod);
              const modPerms = allModPerms.filter((p) => matchesSearch(p.description || p.code, p.code));
              if (modPerms.length === 0) return null;
              const selectedCount = modPerms.filter((p) => selectedPerms.has(p.code)).length;
              const categories = getCategoriesForModule(mod);
              return (
                <div key={mod} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
                    background: 'var(--color-bg-sunken)',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedCount === modPerms.length && modPerms.length > 0}
                      ref={(el) => { if (el) el.indeterminate = selectedCount > 0 && selectedCount < modPerms.length; }}
                      onChange={() => toggleModule(mod)}
                      style={{ accentColor: 'var(--color-primary)', width: 15, height: 15 }}
                    />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', flex: 1 }}>{mod}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{selectedCount}/{modPerms.length}</span>
                  </label>

                  {categories.length > 0 ? (
                    <div style={{ padding: 'var(--space-2) var(--space-4) var(--space-2) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {categories.map((category) => {
                        const allCatPerms = getPermissionsByCategory(mod, category);
                        const catPerms = allCatPerms.filter((p) => matchesSearch(p.description || p.code, p.code));
                        if (catPerms.length === 0) return null;
                        const catSelectedCount = catPerms.filter((p) => selectedPerms.has(p.code)).length;
                        return (
                          <div key={category}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 4 }}>
                              <input
                                type="checkbox"
                                checked={catSelectedCount === catPerms.length && catPerms.length > 0}
                                ref={(el) => { if (el) el.indeterminate = catSelectedCount > 0 && catSelectedCount < catPerms.length; }}
                                onChange={() => toggleCategory(mod, category)}
                                style={{ accentColor: 'var(--color-primary)', width: 13, height: 13 }}
                              />
                              <span style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', flex: 1 }}>{category}</span>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{catSelectedCount}/{catPerms.length}</span>
                            </label>
                            <div style={{ paddingLeft: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                              {catPerms.map((perm) => (
                                <label key={perm.code} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '2px 0' }}>
                                  <input type="checkbox" checked={selectedPerms.has(perm.code)} onChange={() => togglePerm(perm.code)} style={{ accentColor: 'var(--color-primary)' }} />
                                  {perm.description || perm.code}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: 'var(--space-2) var(--space-4) var(--space-2) var(--space-8)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                      {modPerms.map((perm) => (
                        <label key={perm.code} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '2px 0' }}>
                          <input type="checkbox" checked={selectedPerms.has(perm.code)} onChange={() => togglePerm(perm.code)} style={{ accentColor: 'var(--color-primary)' }} />
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
