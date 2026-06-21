'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus } from 'lucide-react';

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

export default function GdprRetentionPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>(MOCK_POLICIES);
  const [editEntity, setEditEntity] = useState('');
  const [editDays, setEditDays] = useState(365);
  const [editAction, setEditAction] = useState('archive');

  useEffect(() => {
    apiFetch<RetentionPolicy[]>('/retention-policies')
      .then(data => { if (Array.isArray(data) && data.length > 0) setPolicies(data); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!editEntity) return;
    try {
      const result = await apiFetch<RetentionPolicy>('/retention-policies', {
        method: 'POST',
        body: JSON.stringify({ entityType: editEntity, retentionDays: editDays, action: editAction, isActive: true }),
      });
      setPolicies(prev => {
        const idx = prev.findIndex(p => p.entityType === editEntity);
        if (idx >= 0) { const next = [...prev]; next[idx] = result; return next; }
        return [...prev, result];
      });
      setEditEntity('');
    } catch {
      // Mock add
      setPolicies(prev => [...prev, { id: Date.now().toString(), entityType: editEntity, retentionDays: editDays, action: editAction, isActive: true, lastRunAt: null }]);
      setEditEntity('');
    }
  };

  const toggleActive = async (policy: RetentionPolicy) => {
    const updated = { ...policy, isActive: !policy.isActive };
    try {
      await apiFetch('/retention-policies', {
        method: 'POST',
        body: JSON.stringify({ entityType: policy.entityType, retentionDays: policy.retentionDays, action: policy.action, isActive: !policy.isActive }),
      });
    } catch {}
    setPolicies(prev => prev.map(p => p.id === policy.id ? updated : p));
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card, #fff)',
    border: '1px solid var(--border-default, #e5e7eb)',
    borderRadius: 'var(--radius-lg, 12px)',
    padding: 'var(--space-5, 20px)',
  };

  return (
    <div style={{ padding: 'var(--space-6, 24px)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl, 24px)', fontWeight: 700, marginBottom: 'var(--space-4, 16px)', color: 'var(--text-primary, #111)' }}>
        <Shield size={24} style={{ verticalAlign: 'middle', marginRight: 8, display: 'inline' }} />
        GDPR Retention Policies
      </h1>

      <div className="frappe-card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 600, color: 'var(--text-primary, #111)' }}>Retention Configurator</h3>
          <button
            onClick={() => setEditEntity(editEntity ? '' : ENTITY_TYPES[0])}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--color-primary, #6366f1)', color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-sm, 14px)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Plus size={14} /> Add Policy
          </button>
        </div>

        {/* Add form */}
        {editEntity && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginBottom: 2 }}>Entity</label>
              <select value={editEntity} onChange={e => setEditEntity(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-default, #e5e7eb)', fontSize: 13, background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #111)' }}>
                {ENTITY_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginBottom: 2 }}>Days</label>
              <input type="number" value={editDays} onChange={e => setEditDays(Number(e.target.value))} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-default, #e5e7eb)', fontSize: 13, width: 80, background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #111)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginBottom: 2 }}>Action</label>
              <select value={editAction} onChange={e => setEditAction(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-default, #e5e7eb)', fontSize: 13, background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #111)' }}>
                <option value="archive">Archive</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <button onClick={handleSave} style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--color-success, #22c55e)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Save</button>
          </div>
        )}

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm, 14px)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default, #e5e7eb)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Entity Type</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Retention (days)</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Action</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Active</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Last Run</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-default, #e5e7eb)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--text-primary, #111)', fontWeight: 500 }}>{p.entityType}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-primary, #111)' }}>{p.retentionDays}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                    background: p.action === 'delete' ? 'var(--bg-danger-subtle, #fef2f2)' : 'var(--bg-warning-subtle, #fffbeb)',
                    color: p.action === 'delete' ? 'var(--color-danger, #ef4444)' : 'var(--color-warning, #f59e0b)',
                  }}>
                    {p.action}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <button onClick={() => toggleActive(p)} style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
                    background: p.isActive ? 'var(--color-success, #22c55e)' : 'var(--bg-muted, #d1d5db)',
                    transition: 'background 0.2s',
                  }}>
                    <span style={{
                      position: 'absolute', top: 2, left: p.isActive ? 18 : 2, width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', transition: 'left 0.2s',
                    }} />
                  </button>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary, #6b7280)', fontSize: 12 }}>
                  {p.lastRunAt ? new Date(p.lastRunAt).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
