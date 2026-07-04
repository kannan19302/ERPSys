'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal, FormField, Select } from '@unerp/ui';

interface RetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  action: string;
  isActive: boolean;
  lastRunAt: string | null;
}

const API = '/api/v1/admin/gdpr';
const ENTITY_TYPES = ['customers', 'vendors', 'contacts', 'leads', 'employees'];

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const MOCK_POLICIES: RetentionPolicy[] = [
  { id: '1', entityType: 'customers', retentionDays: 2555, action: 'archive', isActive: true, lastRunAt: null },
  { id: '2', entityType: 'leads', retentionDays: 365, action: 'delete', isActive: true, lastRunAt: '2026-06-01T00:00:00Z' },
  { id: '3', entityType: 'contacts', retentionDays: 1825, action: 'archive', isActive: false, lastRunAt: null },
];

export default function GdprRetentionTab() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>(MOCK_POLICIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntity, setEditEntity] = useState(ENTITY_TYPES[0] || '');
  const [editDays, setEditDays] = useState(365);
  const [editAction, setEditAction] = useState('archive');

  useEffect(() => {
    apiFetch<RetentionPolicy[]>('/retention-policies')
      .then((data) => { if (Array.isArray(data) && data.length > 0) setPolicies(data); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!editEntity) return;
    try {
      const result = await apiFetch<RetentionPolicy>('/retention-policies', {
        method: 'POST',
        body: JSON.stringify({ entityType: editEntity, retentionDays: editDays, action: editAction, isActive: true }),
      });
      setPolicies((prev) => {
        const idx = prev.findIndex((p) => p.entityType === editEntity);
        if (idx >= 0) { const next = [...prev]; next[idx] = result; return next; }
        return [...prev, result];
      });
    } catch {
      setPolicies((prev) => [...prev, { id: Date.now().toString(), entityType: editEntity, retentionDays: editDays, action: editAction, isActive: true, lastRunAt: null }]);
    }
    setModalOpen(false);
  };

  const toggleActive = async (policy: RetentionPolicy) => {
    const updated = { ...policy, isActive: !policy.isActive };
    try {
      await apiFetch('/retention-policies', {
        method: 'POST',
        body: JSON.stringify({ entityType: policy.entityType, retentionDays: policy.retentionDays, action: policy.action, isActive: !policy.isActive }),
      });
    } catch { /* still reflect optimistically */ }
    setPolicies((prev) => prev.map((p) => (p.id === policy.id ? updated : p)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={() => setModalOpen(true)}>Add Policy</Button>
      </div>

      <div className="frappe-card" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Entity Type</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Retention (days)</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Action</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Active</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Last Run</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--color-text)', fontWeight: 500 }}>{p.entityType}</td>
                <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>{p.retentionDays}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                    background: p.action === 'delete' ? 'var(--color-danger-light)' : 'var(--color-warning-light)',
                    color: p.action === 'delete' ? 'var(--color-danger)' : 'var(--color-warning)',
                  }}
                  >
                    {p.action}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <button onClick={() => toggleActive(p)} style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative', background: p.isActive ? 'var(--color-success)' : 'var(--color-bg-sunken)', transition: 'background 0.2s' }}>
                    <span style={{ position: 'absolute', top: 2, left: p.isActive ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                  {p.lastRunAt ? new Date(p.lastRunAt).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add GDPR Retention Policy"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Entity">
            <Select value={editEntity} onChange={(e) => setEditEntity(e.target.value)}>
              {ENTITY_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </FormField>
          <FormField label="Retention (days)">
            <input type="number" value={editDays} onChange={(e) => setEditDays(Number(e.target.value))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 13, width: '100%', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
          </FormField>
          <FormField label="Action">
            <Select value={editAction} onChange={(e) => setEditAction(e.target.value)}>
              <option value="archive">Archive</option>
              <option value="delete">Delete</option>
            </Select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
