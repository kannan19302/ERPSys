'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Spinner, TextField, FormField, Textarea, Modal,
  EmptyState, ProtectedComponent,
} from '@unerp/ui';
import { Users, Plus, Trash2, Edit3, UserPlus, UserMinus, ShieldAlert, CheckCircle } from 'lucide-react';

interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: {
    members: number;
  };
}

interface GroupMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  status: string;
  joinedAt: string;
}

interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

export default function GroupsTab() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Form states
  const [groupForm, setGroupForm] = useState({ name: '', description: '', isActive: true });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  /* ---- Fetch Groups ---- */
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/groups', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (e) {
      showNotification('error', 'Failed to load groups');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  /* ---- Fetch Members ---- */
  const fetchGroupMembers = async (groupId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/groups/${groupId}/members`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      showNotification('error', 'Failed to load members');
    }
  };

  /* ---- Fetch Users ---- */
  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/users', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch {
      showNotification('error', 'Failed to load users');
    }
  }, []);

  // Lazy-load only on first activation of this tab
  useEffect(() => {
    if (!loaded) {
      fetchGroups();
      fetchAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectGroup = (group: UserGroup) => {
    setSelectedGroup(group);
    fetchGroupMembers(group.id);
  };

  /* ---- Create Group ---- */
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/groups', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(groupForm),
      });

      if (res.ok) {
        showNotification('success', 'Group created successfully');
        setShowAddGroupModal(false);
        setGroupForm({ name: '', description: '', isActive: true });
        fetchGroups();
      } else {
        const err = await res.json();
        showNotification('error', err.message || 'Failed to create group');
      }
    } catch {
      showNotification('error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Update Group ---- */
  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/groups/${selectedGroup.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(groupForm),
      });

      if (res.ok) {
        showNotification('success', 'Group updated successfully');
        setShowEditGroupModal(false);
        fetchGroups();
        // Update selected group in view
        const updated = await res.json();
        setSelectedGroup(updated);
      } else {
        const err = await res.json();
        showNotification('error', err.message || 'Failed to update group');
      }
    } catch {
      showNotification('error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Delete Group ---- */
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? All memberships will be removed.')) return;

    try {
      const res = await fetch(`/api/v1/admin/groups/${groupId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (res.ok) {
        showNotification('success', 'Group deleted');
        setSelectedGroup(null);
        setMembers([]);
        fetchGroups();
      } else {
        showNotification('error', 'Failed to delete group');
      }
    } catch {
      showNotification('error', 'Network error');
    }
  };

  /* ---- Add Group Members ---- */
  const handleAddMembers = async () => {
    if (!selectedGroup || selectedUserIds.length === 0) return;

    try {
      const res = await fetch(`/api/v1/admin/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userIds: selectedUserIds }),
      });

      if (res.ok) {
        showNotification('success', 'Members added');
        setShowAddMemberModal(false);
        setSelectedUserIds([]);
        fetchGroupMembers(selectedGroup.id);
        fetchGroups(); // refresh counts
      } else {
        showNotification('error', 'Failed to add members');
      }
    } catch {
      showNotification('error', 'Network error');
    }
  };

  /* ---- Remove Member ---- */
  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/v1/admin/groups/${selectedGroup.id}/members/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (res.ok) {
        showNotification('success', 'Member removed');
        fetchGroupMembers(selectedGroup.id);
        fetchGroups(); // refresh counts
      } else {
        showNotification('error', 'Failed to remove member');
      }
    } catch {
      showNotification('error', 'Network error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ProtectedComponent permission="admin.user-group.create">
          <Button
            variant="primary"
            onClick={() => {
              setGroupForm({ name: '', description: '', isActive: true });
              setShowAddGroupModal(true);
            }}
          >
            <Plus size={14} style={{ marginRight: 6 }} /> New Group
          </Button>
        </ProtectedComponent>
      </div>

      {notification && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? 'var(--color-success-light)' : 'var(--color-error-light)',
          color: notification.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
          fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          {notification.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
          {notification.message}
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-6)' }}>
        {/* Left Side: Groups List */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', margin: 0 }}>User Groups</h3>
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}>
                <Spinner size="md" />
              </div>
            )}
            {!loading && groups.length === 0 && (
              <EmptyState
                title="No groups defined"
                description="Create your first group to organize users for access control and task routing."
                icon={<Users size={40} />}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1.5)', maxHeight: '600px', overflowY: 'auto' }}>
              {groups.map(g => (
                <div
                  key={g.id}
                  onClick={() => selectGroup(g)}
                  style={{
                    padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: selectedGroup?.id === g.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: selectedGroup?.id === g.id ? 'var(--color-primary-light)' : 'var(--color-bg)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{g.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{g._count?.members || 0} members</div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <ProtectedComponent permission="admin.user-group.update">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroup(g);
                          setGroupForm({ name: g.name, description: g.description || '', isActive: g.isActive });
                          setShowEditGroupModal(true);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                      >
                        <Edit3 size={14} />
                      </button>
                    </ProtectedComponent>
                    <ProtectedComponent permission="admin.user-group.delete">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(g.id);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </ProtectedComponent>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Right Side: Group Members Details */}
        <Card>
          {selectedGroup ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', margin: 0 }}>{selectedGroup.name}</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>{selectedGroup.description || 'No description provided.'}</p>
                </div>
                <ProtectedComponent permission="admin.user-group.update">
                  <Button variant="primary" onClick={() => setShowAddMemberModal(true)}>
                    <UserPlus size={14} style={{ marginRight: 6 }} /> Add Members
                  </Button>
                </ProtectedComponent>
              </div>

              <div>
                <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>Group Members ({members.length})</h4>
                {members.length === 0 ? (
                  <EmptyState
                    title="No members in this group yet"
                    description="Add members to start routing tasks and access control to this group."
                    icon={<Users size={40} />}
                  />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
                    {members.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                        <div>
                          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{m.firstName} {m.lastName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{m.email}</div>
                        </div>
                        <ProtectedComponent permission="admin.user-group.update">
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                            title="Remove member"
                          >
                            <UserMinus size={14} />
                          </button>
                        </ProtectedComponent>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Select a group"
              description="Select a group from the list to view and manage members."
              icon={<Users size={48} />}
            />
          )}
        </Card>
      </div>

      {/* Create Group Modal */}
      <Modal
        open={showAddGroupModal}
        onClose={() => setShowAddGroupModal(false)}
        title="Create User Group"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddGroupModal(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateGroup as any} disabled={saving}>
              {saving ? <><Spinner size="sm" /> Creating...</> : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField
            label="Group Name"
            required
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
          />
          <FormField label="Description">
            <Textarea rows={3} value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} />
          </FormField>
        </form>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        open={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        title="Edit User Group"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditGroupModal(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdateGroup as any} disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateGroup} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField
            label="Group Name"
            required
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
          />
          <FormField label="Description">
            <Textarea rows={3} value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} />
          </FormField>
        </form>
      </Modal>

      {/* Add Members Modal */}
      <Modal
        open={showAddMemberModal && !!selectedGroup}
        onClose={() => { setShowAddMemberModal(false); setSelectedUserIds([]); }}
        title={selectedGroup ? `Add Users to ${selectedGroup.name}` : 'Add Users'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowAddMemberModal(false); setSelectedUserIds([]); }}>Cancel</Button>
            <Button variant="primary" onClick={handleAddMembers} disabled={selectedUserIds.length === 0}>Add Selected</Button>
          </>
        }
      >
        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {allUsers
            .filter(user => !members.some(member => member.id === user.id))
            .map(user => {
              const isChecked = selectedUserIds.includes(user.id);
              return (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                      } else {
                        setSelectedUserIds([...selectedUserIds, user.id]);
                      }
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{user.firstName} {user.lastName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{user.email}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>
    </div>
  );
}
