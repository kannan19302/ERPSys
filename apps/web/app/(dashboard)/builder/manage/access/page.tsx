'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable, ConfirmDialog } from '@unerp/ui';
import { Shield, Plus, Trash2 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function AccessControlPage() {
  const client = useApiClient();
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  // Form fields
  const [formRole, setFormRole] = useState<string>('Guest');
  const [formModule, setFormModule] = useState<string>('inventory');
  const [formRead, setFormRead] = useState<boolean>(true);
  const [formWrite, setFormWrite] = useState<boolean>(false);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      setPermissions(await client.get('/builder/governance/permissions'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const columns = [
    { key: 'roleId', header: 'Role ID' },
    { key: 'moduleSlug', header: 'App Module Slug' },
    { 
      key: 'canRead',
      header: 'Read Access', 
      render: (row: any) => row.canRead ? 'Allowed' : 'Denied' 
    },
    { 
      key: 'canWrite',
      header: 'Write Access', 
      render: (row: any) => row.canWrite ? 'Allowed' : 'Denied' 
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <div className="ui-flex ui-gap-2">
          <button 
            className={`ui-btn ${styles.s1}`} 
            
            onClick={() => setDeleteTarget(row.id)}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )
    }
  ];

  const handleAdd = async () => {
    try {
      await client.post('/builder/governance/permissions', {
          roleId: formRole,
          moduleSlug: formModule,
          canRead: formRead,
          canWrite: formWrite
      });
      setShowAddModal(false);
      fetchPermissions();
    } catch (e) {
      console.error(e);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await client.delete(`/builder/governance/permissions/${id}`);
      fetchPermissions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader 
        title="Builder Access Control (RBAC)" 
        description="Configure edit, read and publish permissions for custom modules and visual studio workspaces."
        actions={
          <button className="ui-btn ui-btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> New Rule
          </button>
        }
      />

      <div className="ui-card">
        {loading && permissions.length === 0 ? (
          <div className={styles.s2}>Loading rules...</div>
        ) : (
          <DataTable columns={columns} data={permissions} />
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            executeDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Delete Access Rule"
        message="Are you sure you want to delete this access control rule? The corresponding permissions will be revoked."
        confirmLabel="Revoke Access"
        variant="danger"
      />

      {showAddModal && (
        <div className={styles.s3}>
          <div className={`ui-card ${styles.s4}`} >
            <h3 className={styles.s5}>Add Access Rule</h3>
            <div className={styles.s6}>
              <div className="ui-form-group">
                <label className="ui-label">Role</label>
                <select className="ui-input" value={formRole} onChange={e => setFormRole(e.target.value)}>
                  <option value="System Manager">System Manager</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>

              <div className="ui-form-group">
                <label className="ui-label">Target Module Slug</label>
                <input className="ui-input" type="text" value={formModule} onChange={e => setFormModule(e.target.value)} placeholder="e.g. inventory" />
              </div>

              <div className={styles.s7}>
                <label className={styles.s8}>
                  <input type="checkbox" checked={formRead} onChange={e => setFormRead(e.target.checked)} /> Read
                </label>
                <label className={styles.s8}>
                  <input type="checkbox" checked={formWrite} onChange={e => setFormWrite(e.target.checked)} /> Write
                </label>
              </div>
            </div>

            <div className="ui-flex-end ui-gap-2">
              <button className="ui-btn ui-btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="ui-btn ui-btn-primary" onClick={handleAdd}>Create Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

