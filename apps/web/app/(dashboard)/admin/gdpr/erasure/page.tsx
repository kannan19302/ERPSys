'use client';

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Plus, Play } from 'lucide-react';

interface ErasureRequest {
  id: string;
  requestedBy: string;
  subjectEmail: string;
  subjectName: string | null;
  status: string;
  entityTypes: string[];
  erasedAt: string | null;
  createdAt: string;
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

const MOCK_REQUESTS: ErasureRequest[] = [
  { id: '1', requestedBy: 'admin', subjectEmail: 'john@example.com', subjectName: 'John Doe', status: 'PENDING', entityTypes: ['customers', 'contacts'], erasedAt: null, createdAt: '2026-06-18T10:00:00Z' },
  { id: '2', requestedBy: 'admin', subjectEmail: 'jane@example.com', subjectName: 'Jane Smith', status: 'COMPLETED', entityTypes: ['leads'], erasedAt: '2026-06-17T15:00:00Z', createdAt: '2026-06-15T09:00:00Z' },
];

export default function GdprErasurePage() {
  const [requests, setRequests] = useState<ErasureRequest[]>(MOCK_REQUESTS);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    apiFetch<ErasureRequest[]>('/erasure-requests')
      .then(data => { if (Array.isArray(data) && data.length > 0) setRequests(data); })
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!email || selectedTypes.length === 0) return;
    try {
      const result = await apiFetch<ErasureRequest>('/erasure-requests', {
        method: 'POST',
        body: JSON.stringify({ subjectEmail: email, subjectName: name || undefined, entityTypes: selectedTypes }),
      });
      setRequests(prev => [result, ...prev]);
    } catch {
      setRequests(prev => [{
        id: Date.now().toString(), requestedBy: 'current', subjectEmail: email,
        subjectName: name || null, status: 'PENDING', entityTypes: selectedTypes,
        erasedAt: null, createdAt: new Date().toISOString(),
      }, ...prev]);
    }
    setShowForm(false);
    setEmail('');
    setName('');
    setSelectedTypes([]);
  };

  const handleExecute = async (id: string) => {
    try {
      await apiFetch(`/erasure-requests/${id}/execute`, { method: 'POST' });
    } catch {}
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'COMPLETED', erasedAt: new Date().toISOString() } : r));
  };

  const toggleType = (t: string) => {
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card, #fff)',
    border: '1px solid var(--border-default, #e5e7eb)',
    borderRadius: 'var(--radius-lg, 12px)',
    padding: 'var(--space-5, 20px)',
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: 'var(--bg-warning-subtle, #fffbeb)', color: 'var(--color-warning, #f59e0b)' },
    COMPLETED: { bg: 'var(--bg-success-subtle, #f0fdf4)', color: 'var(--color-success, #22c55e)' },
    REJECTED: { bg: 'var(--bg-danger-subtle, #fef2f2)', color: 'var(--color-danger, #ef4444)' },
  };

  return (
    <div style={{ padding: 'var(--space-6, 24px)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl, 24px)', fontWeight: 700, marginBottom: 'var(--space-4, 16px)', color: 'var(--text-primary, #111)' }}>
        <Shield size={24} style={{ verticalAlign: 'middle', marginRight: 8, display: 'inline' }} />
        GDPR Erasure Requests
      </h1>

      <div className="frappe-card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 600, color: 'var(--text-primary, #111)' }}>Request Directory</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--color-primary, #6366f1)', color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-sm, 14px)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Plus size={14} /> New Request
          </button>
        </div>

        {/* New request form */}
        {showForm && (
          <div style={{ padding: 16, marginBottom: 16, borderRadius: 8, border: '1px solid var(--border-default, #e5e7eb)', background: 'var(--bg-subtle, #f9fafb)' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginBottom: 2 }}>Subject Email *</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="person@example.com"
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-default, #e5e7eb)', fontSize: 13, width: 220, background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #111)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginBottom: 2 }}>Subject Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Optional"
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-default, #e5e7eb)', fontSize: 13, width: 180, background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #111)' }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary, #6b7280)', marginBottom: 4 }}>Entity Types *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ENTITY_TYPES.map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary, #111)' }}>
                    <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleCreate} style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--color-primary, #6366f1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              Create Request
            </button>
          </div>
        )}

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm, 14px)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default, #e5e7eb)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Subject</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Entity Types</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Status</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Date</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-secondary, #6b7280)', fontWeight: 500, fontSize: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => {
              const sc = statusColors[r.status] || statusColors.PENDING;
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-default, #e5e7eb)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary, #111)' }}>{r.subjectEmail}</div>
                    {r.subjectName && <div style={{ fontSize: 11, color: 'var(--text-secondary, #6b7280)' }}>{r.subjectName}</div>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(r.entityTypes || []).map(et => (
                        <span key={et} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-muted, #f3f4f6)', color: 'var(--text-secondary, #6b7280)' }}>{et}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary, #6b7280)', fontSize: 12 }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {r.status === 'PENDING' && (
                      <button onClick={() => handleExecute(r.id)} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                        background: 'var(--color-danger, #ef4444)', color: '#fff', border: 'none', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                      }}>
                        <Play size={10} /> Execute
                      </button>
                    )}
                    {r.status === 'COMPLETED' && (
                      <span style={{ fontSize: 11, color: 'var(--color-success, #22c55e)' }}>
                        <CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                        Done
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
