'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Spinner, Badge, StatusBadge,
  DataTable, type Column, Modal, TextField, FormField,
  Pagination, Drawer, ConfirmDialog, ProtectedComponent,
} from '@unerp/ui';
import {
  UserPlus, Search, Edit2, Lock, Unlock, Mail,
  Users, UserCheck, UserX, Clock, Shield, Download,
} from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './UsersTab.module.css';

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

export default function UsersTab() {
  const client = useApiClient();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const data = await client.get<UserData[] | { data?: UserData[]; meta?: PaginationMeta }>(`/admin/users?${params}`);
      setUsers(Array.isArray(data) ? data : (data?.data || []));
      if (!Array.isArray(data) && data.meta) setMeta(data.meta);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [client, searchQuery, statusFilter]);

  useEffect(() => {
    void fetchUsers(1);
  }, [fetchUsers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName || inviteForm.roleIds.length === 0) {
      setInviteError('All fields are required, including at least one role.');
      return;
    }
    setInviting(true);
    setInviteError(null);
    try {
      await client.post('/admin/users', inviteForm);
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
      await client.patch(`/admin/users/${suspendTarget.id}/suspend`);
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
        <div className="ui-hstack-3">
          <div className={styles.s1} style={{background: row.status === 'SUSPENDED' ? 'var(--color-danger-light)' : 'var(--color-primary-light)', color: row.status === 'SUSPENDED' ? 'var(--color-danger)' : 'var(--color-primary)'}}>
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <div className={styles.s2}>
              {row.firstName} {row.lastName}
            </div>
            <div className="ui-text-xs-tertiary">
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'roles', header: 'Roles',
      render: (row) => (
        <div className={styles.s3}>
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
        <span className="ui-text-xs-tertiary">
          {timeAgo(row.lastLoginAt)}
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '100px',
      render: (row) => (
        <div className={styles.s4}>
          <ProtectedComponent permission="admin.user.update">
            <IconButton icon={<Edit2 size={14} />} title="Edit" onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setDrawerOpen(true); }} />
          </ProtectedComponent>
          <ProtectedComponent permission="admin.user.update">
            {row.status === 'ACTIVE' ? (
              <IconButton icon={<Lock size={14} />} title="Suspend" danger onClick={(e) => { e.stopPropagation(); setSuspendTarget(row); }} />
            ) : row.status === 'SUSPENDED' ? (
              <IconButton icon={<Unlock size={14} />} title="Reactivate" onClick={(e) => { e.stopPropagation(); }} />
            ) : (
              <IconButton icon={<Mail size={14} />} title="Resend Invite" onClick={(e) => { e.stopPropagation(); }} />
            )}
          </ProtectedComponent>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end ui-gap-2">
        <Button variant="outline" onClick={() => {}}>
          <Download size={14} className="mr-2" /> Export
        </Button>
        <ProtectedComponent permission="admin.user.create">
          <Button variant="primary" onClick={() => setInviteOpen(true)}>
            <UserPlus size={14} className="mr-2" /> Invite User
          </Button>
        </ProtectedComponent>
      </div>

      {/* Status Summary */}
      <div className={styles.s5}>
        <MiniStatCard icon={<Users size={16} />} label="Total Users" value={statusCounts.all} color="var(--color-primary)" />
        <MiniStatCard icon={<UserCheck size={16} />} label="Active" value={statusCounts.active} color="var(--color-success)" />
        <MiniStatCard icon={<Clock size={16} />} label="Invited" value={statusCounts.invited} color="var(--color-warning)" />
        <MiniStatCard icon={<UserX size={16} />} label="Suspended" value={statusCounts.suspended} color="var(--color-danger)" />
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <div className={styles.s6}>
          <div className={styles.s7}>
            <Search size={16} className={styles.s8} />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.s9}
            />
          </div>
          <div className="ui-flex ui-gap-2">
            {['ALL', 'ACTIVE', 'INVITED', 'SUSPENDED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={styles.s10} style={{borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)', background: statusFilter === s ? 'var(--color-primary-light)' : 'var(--color-bg)', color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)'}}
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
        <form onSubmit={handleInvite} className="ui-stack-4">
          {inviteError && (
            <div className={styles.s11}>
              {inviteError}
            </div>
          )}

          <div className="ui-grid-2 ui-gap-3">
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
            <div className={styles.s12}>
              {AVAILABLE_ROLES.map((role) => (
                <label
                  key={role.id}
                  className={styles.s13}
                >
                  <input
                    type="checkbox"
                    checked={inviteForm.roleIds.includes(role.id)}
                    onChange={() => handleRoleToggle(role.id)}
                    className={styles.s14}
                  />
                  <div>
                    <div className="ui-heading-sm">{role.name}</div>
                    <div className="ui-text-xs-tertiary">{role.description}</div>
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
            <ProtectedComponent permission="admin.user.update">
              <Button variant="primary">Save Changes</Button>
            </ProtectedComponent>
          </>
        }
      >
        {selectedUser && (
          <div className={styles.s15}>
            {/* Avatar & Name */}
            <div className="ui-hstack-4">
              <div className={styles.s16}>
                {selectedUser.firstName[0]}{selectedUser.lastName[0]}
              </div>
              <div>
                <h3 className={styles.s17}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className={styles.s18}>
                  {selectedUser.email}
                </p>
                <div className={styles.s19}>
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>
            </div>

            <hr className={styles.s20} />

            {/* Info Grid */}
            <div className="ui-grid-2">
              <DetailField label="Last Active" value={timeAgo(selectedUser.lastLoginAt)} />
              <DetailField label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
              <DetailField label="Department" value={selectedUser.department || 'Unassigned'} />
              <DetailField label="User ID" value={selectedUser.id.slice(0, 12) + '...'} mono />
            </div>

            <hr className={styles.s21} />

            {/* Roles */}
            <div>
              <h4 className={styles.s22}>
                Assigned Roles
              </h4>
              <div className="ui-stack-2">
                {selectedUser.roles.map((r) => (
                  <div
                    key={r.id}
                    className={styles.s23}
                  >
                    <div className="ui-hstack-2">
                      <Shield size={14} className="ui-text-primary" />
                      <span className="ui-heading-sm">{r.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className={styles.s24} />

            {/* Quick Actions */}
            <div className="ui-stack-2">
              <h4 className={styles.s25}>
                Actions
              </h4>
              <Button variant="outline" onClick={() => {}}>
                <Mail size={14} className="mr-2" /> Send Password Reset
              </Button>
              <ProtectedComponent permission="admin.user.update">
                {selectedUser.status === 'ACTIVE' && (
                  <Button variant="danger" onClick={() => { setDrawerOpen(false); setSuspendTarget(selectedUser); }}>
                    <Lock size={14} className="mr-2" /> Suspend User
                  </Button>
                )}
              </ProtectedComponent>
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
    <div className={styles.s26}>
      <div className={styles.s27} style={{background: `${color}15`}}>
        {icon}
      </div>
      <div>
        <div className="ui-text-xs-tertiary">{label}</div>
        <div className="ui-heading-lg">{value}</div>
      </div>
    </div>
  );
}

function IconButton({ icon, title, danger, onClick }: { icon: React.ReactNode; title: string; danger?: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`${styles.s28} ${danger ? styles.danger : ''}`}
    >
      {icon}
    </button>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className={styles.s29}>{label}</div>
      <div className={styles.s30} style={{fontFamily: mono ? 'monospace' : 'inherit'}}>
        {value}
      </div>
    </div>
  );
}
