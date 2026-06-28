'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable, ConfirmDialog } from '@unerp/ui';
import { Shield, Plus, Trash2 } from 'lucide-react';

export default function AccessControlPage() {
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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/governance/permissions', {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setPermissions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

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
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button 
            className="frappe-btn" 
            style={{ padding: '4px var(--space-2)', color: 'var(--color-danger)', background: 'transparent', border: '1px solid var(--color-border)' }}
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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/governance/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          roleId: formRole,
          moduleSlug: formModule,
          canRead: formRead,
          canWrite: formWrite
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchPermissions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/governance/permissions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        fetchPermissions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="Builder Access Control (RBAC)" 
        description="Configure edit, read and publish permissions for custom modules and visual studio workspaces."
        actions={
          <button className="frappe-btn frappe-btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> New Rule
          </button>
        }
      />

      <div className="frappe-card">
        {loading && permissions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading rules...</div>
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
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="frappe-card" style={{ width: 420, padding: 'var(--space-5)' }}>
            <h3 style={{ margin: '0 0 var(--space-4) 0' }}>Add Access Rule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <div className="frappe-form-group">
                <label className="frappe-label">Role</label>
                <select className="frappe-input" value={formRole} onChange={e => setFormRole(e.target.value)}>
                  <option value="System Manager">System Manager</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label">Target Module Slug</label>
                <input className="frappe-input" type="text" value={formModule} onChange={e => setFormModule(e.target.value)} placeholder="e.g. inventory" />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input type="checkbox" checked={formRead} onChange={e => setFormRead(e.target.checked)} /> Read
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input type="checkbox" checked={formWrite} onChange={e => setFormWrite(e.target.checked)} /> Write
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button className="frappe-btn frappe-btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="frappe-btn frappe-btn-primary" onClick={handleAdd}>Create Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

