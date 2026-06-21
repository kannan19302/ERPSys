'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

export default function UserGroupsPage() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Form states
  const [groupForm, setGroupForm] = useState({ name: '', description: '', isActive: true });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      console.error('Failed to load groups', e);
    } finally {
      setLoading(false);
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
    } catch (e) {
      console.error('Failed to load members', e);
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
    } catch (e) {
      console.error('Failed to load users', e);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchAllUsers();
  }, [fetchGroups, fetchAllUsers]);

  const selectGroup = (group: UserGroup) => {
    setSelectedGroup(group);
    fetchGroupMembers(group.id);
  };

  /* ---- Create Group ---- */
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name) return;

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
    }
  };

  /* ---- Update Group ---- */
  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Users style={{ color: 'var(--color-primary)' }} />
            User Groups & Teams
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Organize users into logical groups for access control and workflow task routing.
          </p>
        </div>
        <button
          onClick={() => {
            setGroupForm({ name: '', description: '', isActive: true });
            setShowAddGroupModal(true);
          }}
          style={{
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)'
          }}
        >
          <Plus size={16} /> New Group
        </button>
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
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>User Groups</h3>
          {loading && <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>Loading groups...</div>}
          {!loading && groups.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-tertiary)' }}>No groups defined.</div>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(g.id);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Group Members Details */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {selectedGroup ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{selectedGroup.name}</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{selectedGroup.description || 'No description provided.'}</p>
                </div>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  style={{
                    background: 'var(--color-primary)', color: '#fff', border: 'none',
                    padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)'
                  }}
                >
                  <UserPlus size={14} /> Add Members
                </button>
              </div>

              <div>
                <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>Group Members ({members.length})</h4>
                {members.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>No members in this group yet.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
                    {members.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                        <div>
                          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{m.firstName} {m.lastName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{m.email}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                          title="Remove member"
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-8)' }}>
              <Users size={48} style={{ marginBottom: 'var(--space-3)', opacity: 0.5 }} />
              <div>Select a group from the list to view and manage members.</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateGroup} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-md)' }}>Create User Group</h3>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Group Name</label>
              <input value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} required style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Description</label>
              <textarea value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} rows={3} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setShowAddGroupModal(false)} style={{ background: 'none', border: '1px solid var(--color-border)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
              <button type="submit" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleUpdateGroup} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', width: '400px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-md)' }}>Edit User Group</h3>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Group Name</label>
              <input value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} required style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Description</label>
              <textarea value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} rows={3} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setShowEditGroupModal(false)} style={{ background: 'none', border: '1px solid var(--color-border)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
              <button type="submit" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMemberModal && selectedGroup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', width: '500px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-md)' }}>Add Users to {selectedGroup.name}</h3>
            
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

            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => { setShowAddMemberModal(false); setSelectedUserIds([]); }} style={{ background: 'none', border: '1px solid var(--color-border)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
              <button onClick={handleAddMembers} disabled={selectedUserIds.length === 0} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Add Selected</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
