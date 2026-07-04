'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge,
  DataTable, type Column, Modal, TextField, FormField, Select,
  Pagination, Drawer, Tabs, EmptyState, ConfirmDialog, KPICard,
} from '@unerp/ui';
import {
  UserPlus, Search, Edit2, Lock, Unlock, Trash2, Mail,
  Users, UserCheck, UserX, Clock, MoreVertical, Download,
  Filter, Shield, ChevronDown,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{ id: string; name: string }>;
  department?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AVAILABLE_ROLES = [
  { id: 'role-super-admin', name: 'Super Admin', description: 'Full access' },
  { id: 'role-admin', name: 'Admin', description: 'User management' },
  { id: 'role-finance', name: 'Finance Manager', description: 'Billing access' },
  { id: 'role-hr', name: 'HR Manager', description: 'Employee records' },
  { id: 'role-viewer', name: 'Viewer', description: 'Read only' },
];

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Invite Modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', roleIds: [] as string[] });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  // User Detail Drawer
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Suspend Confirm
  const [suspendTarget, setSuspendTarget] = useState<UserData | null>(null);
  const [suspending, setSuspending] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : (data?.data || []));
      if (data?.meta) setMeta(data.meta);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName || inviteForm.roleIds.length === 0) {
      setInviteError('All fields are required, including at least one role.');
      return;
    }
    setInviting(true);
    setInviteError(null);
    try {
      const token = getToken();
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(inviteForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || 'Failed to send invitation');
      }
      setInviteOpen(false);
      setInviteForm({ firstName: '', lastName: '', email: '', roleIds: [] });
      fetchUsers(meta.page);
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      const token = getToken();
      await fetch(`/api/v1/admin/users/${suspendTarget.id}/suspend`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      fetchUsers(meta.page);
    } catch { /* handled by refetch */ }
    finally {
      setSuspending(false);
      setSuspendTarget(null);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setInviteForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = !term ||
      u.email.toLowerCase().includes(term) ||
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    invited: users.filter(u => u.status === 'INVITED').length,
    suspended: users.filter(u => u.status === 'SUSPENDED').length,
  };

  const columns: Column<UserData>[] = [
    {
      key: 'user', header: 'User', width: '35%',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-full)',
            background: row.status === 'SUSPENDED' ? 'var(--color-danger-light)' : 'var(--color-primary-light)',
            color: row.status === 'SUSPENDED' ? 'var(--color-danger)' : 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)', flexShrink: 0,
          }}>
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>
              {row.firstName} {row.lastName}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'roles', header: 'Roles',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
          {row.roles.slice(0, 2).map((r) => (
            <Badge key={r.id} variant="info">{r.name}</Badge>
          ))}
          {row.roles.length > 2 && (
            <Badge variant="default">+{row.roles.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'lastLoginAt', header: 'Last Active',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
          {timeAgo(row.lastLoginAt)}
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '100px',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
          <IconButton icon={<Edit2 size={14} />} title="Edit" onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setDrawerOpen(true); }} />
          {row.status === 'ACTIVE' ? (
            <IconButton icon={<Lock size={14} />} title="Suspend" danger onClick={(e) => { e.stopPropagation(); setSuspendTarget(row); }} />
          ) : row.status === 'SUSPENDED' ? (
            <IconButton icon={<Unlock size={14} />} title="Reactivate" onClick={(e) => { e.stopPropagation(); }} />
          ) : (
            <IconButton icon={<Mail size={14} />} title="Resend Invite" onClick={(e) => { e.stopPropagation(); }} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="User Management"
        description="Invite users, assign roles, and manage access across your organization"
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Users' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={() => {}}>
              <Download size={14} style={{ marginRight: 6 }} /> Export
            </Button>
            <Button variant="primary" onClick={() => setInviteOpen(true)}>
              <UserPlus size={14} style={{ marginRight: 6 }} /> Invite User
            </Button>
          </div>
        }
      />

      {/* Status Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        <MiniStatCard icon={<Users size={16} />} label="Total Users" value={statusCounts.all} color="var(--color-primary)" />
        <MiniStatCard icon={<UserCheck size={16} />} label="Active" value={statusCounts.active} color="var(--color-success)" />
        <MiniStatCard icon={<Clock size={16} />} label="Invited" value={statusCounts.invited} color="var(--color-warning)" />
        <MiniStatCard icon={<UserX size={16} />} label="Suspended" value={statusCounts.suspended} color="var(--color-danger)" />
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['ALL', 'ACTIVE', 'INVITED', 'SUSPENDED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                  border: '1px solid',
                  borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)',
                  background: statusFilter === s ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  transition: 'all var(--duration-fast) var(--ease-default)',
                }}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          rowKey={(row) => row.id}
          onRowClick={(row) => { setSelectedUser(row); setDrawerOpen(true); }}
          emptyTitle="No users found"
          emptyMessage="Try adjusting your search or filters, or invite your first team member."
          emptyIcon={<Users size={48} />}
        />
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <Pagination page={meta.page} pageCount={meta.totalPages} onChange={(p) => fetchUsers(p)} />
      )}

      {/* Invite User Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); setInviteError(null); }}
        title="Invite Team Member"
        description="Send an invitation to join your organization"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)} disabled={inviting}>Cancel</Button>
            <Button variant="primary" onClick={handleInvite as any} disabled={inviting}>
              {inviting ? <><Spinner size="sm" /> Sending...</> : 'Send Invitation'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {inviteError && (
            <div style={{
              padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-light)', color: 'var(--color-danger)',
              fontSize: 'var(--text-sm)',
            }}>
              {inviteError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField
              label="First Name"
              placeholder="Jane"
              required
              value={inviteForm.firstName}
              onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
            />
            <TextField
              label="Last Name"
              placeholder="Doe"
              required
              value={inviteForm.lastName}
              onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
            />
          </div>

          <TextField
            label="Email Address"
            type="email"
            placeholder="jane.doe@company.com"
            required
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
          />

          <FormField label="Assign Roles" required>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
              maxHeight: 180, overflowY: 'auto',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)', background: 'var(--color-bg)',
            }}>
              {AVAILABLE_ROLES.map((role) => (
                <label
                  key={role.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', transition: 'background var(--duration-fast) var(--ease-default)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <input
                    type="checkbox"
                    checked={inviteForm.roleIds.includes(role.id)}
                    onChange={() => handleRoleToggle(role.id)}
                    style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{role.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{role.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </FormField>
        </form>
      </Modal>

      {/* User Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedUser(null); }}
        title="User Details"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Close</Button>
            <Button variant="primary">Save Changes</Button>
          </>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Avatar & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)',
              }}>
                {selectedUser.firstName[0]}{selectedUser.lastName[0]}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {selectedUser.email}
                </p>
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <DetailField label="Last Active" value={timeAgo(selectedUser.lastLoginAt)} />
              <DetailField label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
              <DetailField label="Department" value={selectedUser.department || 'Unassigned'} />
              <DetailField label="User ID" value={selectedUser.id.slice(0, 12) + '...'} mono />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Roles */}
            <div>
              <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                Assigned Roles
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {selectedUser.roles.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Shield size={14} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{r.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                Actions
              </h4>
              <Button variant="outline" onClick={() => {}}>
                <Mail size={14} style={{ marginRight: 6 }} /> Send Password Reset
              </Button>
              {selectedUser.status === 'ACTIVE' && (
                <Button variant="danger" onClick={() => { setDrawerOpen(false); setSuspendTarget(selectedUser); }}>
                  <Lock size={14} style={{ marginRight: 6 }} /> Suspend User
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Suspend Confirmation */}
      <ConfirmDialog
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleSuspend}
        title="Suspend User"
        message={
          suspendTarget ? (
            <span>
              Are you sure you want to suspend <strong>{suspendTarget.firstName} {suspendTarget.lastName}</strong>?
              They will immediately lose access to the system.
            </span>
          ) : undefined
        }
        confirmLabel="Suspend"
        variant="danger"
        loading={suspending}
      />
    </div>
  );
}

function MiniStatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)',
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--radius-md)',
        background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{label}</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{value}</div>
      </div>
    </div>
  );
}

function IconButton({ icon, title, danger, onClick }: { icon: React.ReactNode; title: string; danger?: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        border: 'none', background: 'none', cursor: 'pointer',
        padding: 'var(--space-1)', borderRadius: 'var(--radius-sm)',
        color: 'var(--color-text-tertiary)',
        transition: 'color var(--duration-fast) var(--ease-default)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = danger ? 'var(--color-danger)' : 'var(--color-primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}
    >
      {icon}
    </button>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}>
        {value}
      </div>
    </div>
  );
}
