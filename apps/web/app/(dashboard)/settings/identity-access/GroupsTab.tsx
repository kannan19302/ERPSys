'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Spinner, TextField, FormField, Textarea, Modal,
  EmptyState, ProtectedComponent,
} from '@unerp/ui';
import { Users, Plus, Trash2, Edit3, UserPlus, UserMinus, ShieldAlert, CheckCircle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './GroupsTab.module.css';

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
  const client = useApiClient();
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
  const [saving, setSaving] = useState(false);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  /* ---- Fetch Groups ---- */
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      setGroups(await client.get<UserGroup[]>('/admin/groups'));
    } catch {
      showNotification('error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [client, showNotification]);

  /* ---- Fetch Members ---- */
  const fetchGroupMembers = useCallback(async (groupId: string) => {
    try {
      setMembers(await client.get<GroupMember[]>(`/admin/groups/${groupId}/members`));
    } catch {
      showNotification('error', 'Failed to load members');
    }
  }, [client, showNotification]);

  /* ---- Fetch Users ---- */
  const fetchAllUsers = useCallback(async () => {
    try {
      setAllUsers(await client.get<UserSummary[]>('/admin/users'));
    } catch {
      showNotification('error', 'Failed to load users');
    }
  }, [client, showNotification]);

  useEffect(() => {
    void fetchGroups();
    void fetchAllUsers();
  }, [fetchAllUsers, fetchGroups]);

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
      await client.post('/admin/groups', groupForm);
      showNotification('success', 'Group created successfully');
      setShowAddGroupModal(false);
      setGroupForm({ name: '', description: '', isActive: true });
      void fetchGroups();
    } catch (error: unknown) {
      showNotification('error', error instanceof Error ? error.message : 'Network error');
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
      const updated = await client.patch<UserGroup>(`/admin/groups/${selectedGroup.id}`, groupForm);
      showNotification('success', 'Group updated successfully');
      setShowEditGroupModal(false);
      void fetchGroups();
      setSelectedGroup(updated);
    } catch (error: unknown) {
      showNotification('error', error instanceof Error ? error.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Delete Group ---- */
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? All memberships will be removed.')) return;

    try {
      await client.delete(`/admin/groups/${groupId}`);
      showNotification('success', 'Group deleted');
      setSelectedGroup(null);
      setMembers([]);
      void fetchGroups();
    } catch (error: unknown) {
      showNotification('error', error instanceof Error ? error.message : 'Network error');
    }
  };

  /* ---- Add Group Members ---- */
  const handleAddMembers = async () => {
    if (!selectedGroup || selectedUserIds.length === 0) return;

    try {
      await client.post(`/admin/groups/${selectedGroup.id}/members`, { userIds: selectedUserIds });
      showNotification('success', 'Members added');
      setShowAddMemberModal(false);
      setSelectedUserIds([]);
      void fetchGroupMembers(selectedGroup.id);
      void fetchGroups();
    } catch (error: unknown) {
      showNotification('error', error instanceof Error ? error.message : 'Network error');
    }
  };

  /* ---- Remove Member ---- */
  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      await client.delete(`/admin/groups/${selectedGroup.id}/members/${userId}`);
      showNotification('success', 'Member removed');
      void fetchGroupMembers(selectedGroup.id);
      void fetchGroups();
    } catch (error: unknown) {
      showNotification('error', error instanceof Error ? error.message : 'Network error');
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <ProtectedComponent permission="admin.user-group.create">
          <Button
            variant="primary"
            onClick={() => {
              setGroupForm({ name: '', description: '', isActive: true });
              setShowAddGroupModal(true);
            }}
          >
            <Plus size={14} className="mr-2" /> New Group
          </Button>
        </ProtectedComponent>
      </div>

      {notification && (
        <div className={styles.s1} style={{background: notification.type === 'success' ? 'var(--color-success-light)' : 'var(--color-error-light)', color: notification.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}}>
          {notification.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
          {notification.message}
        </div>
      )}

      {/* Main Grid */}
      <div className={styles.s2}>
        {/* Left Side: Groups List */}
        <Card>
          <div className="ui-stack-3">
            <h3 className={styles.s3}>User Groups</h3>
            {loading && (
              <div className={styles.s4}>
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
            <div className={styles.s5}>
              {groups.map(g => (
                <div
                  key={g.id}
                  onClick={() => selectGroup(g)}
                  className={styles.s6} style={{border: selectedGroup?.id === g.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: selectedGroup?.id === g.id ? 'var(--color-primary-light)' : 'var(--color-bg)'}}
                >
                  <div>
                    <div className="ui-heading-sm">{g.name}</div>
                    <div className="ui-text-caption">{g._count?.members || 0} members</div>
                  </div>
                  <div className="ui-flex ui-gap-1">
                    <ProtectedComponent permission="admin.user-group.update">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroup(g);
                          setGroupForm({ name: g.name, description: g.description || '', isActive: g.isActive });
                          setShowEditGroupModal(true);
                        }}
                        className="ui-btn-icon ui-text-muted"
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
                        className={styles.s7}
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
            <div className="ui-stack-4">
              <div className={styles.s8}>
                <div>
                  <h2 className={styles.s9}>{selectedGroup.name}</h2>
                  <p className={styles.s10}>{selectedGroup.description || 'No description provided.'}</p>
                </div>
                <ProtectedComponent permission="admin.user-group.update">
                  <Button variant="primary" onClick={() => setShowAddMemberModal(true)}>
                    <UserPlus size={14} className="mr-2" /> Add Members
                  </Button>
                </ProtectedComponent>
              </div>

              <div>
                <h4 className={styles.s11}>Group Members ({members.length})</h4>
                {members.length === 0 ? (
                  <EmptyState
                    title="No members in this group yet"
                    description="Add members to start routing tasks and access control to this group."
                    icon={<Users size={40} />}
                  />
                ) : (
                  <div className={styles.s12}>
                    {members.map(m => (
                      <div key={m.id} className={styles.s13}>
                        <div>
                          <div className="ui-heading-sm">{m.firstName} {m.lastName}</div>
                          <div className="ui-text-caption">{m.email}</div>
                        </div>
                        <ProtectedComponent permission="admin.user-group.update">
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className={styles.s14}
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
        <form onSubmit={handleCreateGroup} className="ui-stack-4">
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
        <form onSubmit={handleUpdateGroup} className="ui-stack-4">
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
        <div className={styles.s15}>
          {allUsers
            .filter(user => !members.some(member => member.id === user.id))
            .map(user => {
              const isChecked = selectedUserIds.includes(user.id);
              return (
                <div key={user.id} className={styles.s16}>
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
                    <div className="ui-heading-sm">{user.firstName} {user.lastName}</div>
                    <div className="ui-text-caption">{user.email}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>
    </div>
  );
}
