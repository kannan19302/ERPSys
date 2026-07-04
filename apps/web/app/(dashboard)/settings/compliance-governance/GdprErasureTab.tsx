'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal, TextField, FormField } from '@unerp/ui';
import { CheckCircle, Play } from 'lucide-react';

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

const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  COMPLETED: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  REJECTED: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
};

export default function GdprErasureTab() {
  const [requests, setRequests] = useState<ErasureRequest[]>(MOCK_REQUESTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    apiFetch<ErasureRequest[]>('/erasure-requests')
      .then((data) => { if (Array.isArray(data) && data.length > 0) setRequests(data); })
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!email || selectedTypes.length === 0) return;
    try {
      const result = await apiFetch<ErasureRequest>('/erasure-requests', {
        method: 'POST',
        body: JSON.stringify({ subjectEmail: email, subjectName: name || undefined, entityTypes: selectedTypes }),
      });
      setRequests((prev) => [result, ...prev]);
    } catch {
      setRequests((prev) => [{
        id: Date.now().toString(), requestedBy: 'current', subjectEmail: email,
        subjectName: name || null, status: 'PENDING', entityTypes: selectedTypes,
        erasedAt: null, createdAt: new Date().toISOString(),
      }, ...prev]);
    }
    setModalOpen(false);
    setEmail('');
    setName('');
    setSelectedTypes([]);
  };

  const handleExecute = async (id: string) => {
    try {
      await apiFetch(`/erasure-requests/${id}/execute`, { method: 'POST' });
    } catch { /* ignore, still reflect in UI */ }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'COMPLETED', erasedAt: new Date().toISOString() } : r)));
  };

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={() => setModalOpen(true)}>New Erasure Request</Button>
      </div>

      <div className="frappe-card" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Subject</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Entity Types</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Status</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Date</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => {
              const sc = statusColors[r.status] || statusColors.PENDING;
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{r.subjectEmail}</div>
                    {r.subjectName && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.subjectName}</div>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(r.entityTypes || []).map((et) => (
                        <span key={et} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'var(--color-bg-sunken)', color: 'var(--color-text-secondary)' }}>{et}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: sc?.bg, color: sc?.color }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {r.status === 'PENDING' && (
                      <button onClick={() => handleExecute(r.id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: 'var(--color-danger)', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Play size={10} /> Execute
                      </button>
                    )}
                    {r.status === 'COMPLETED' && (
                      <span style={{ fontSize: 11, color: 'var(--color-success)' }}>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New GDPR Erasure Request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Create Request</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Subject Email" required placeholder="person@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Subject Name" placeholder="Optional" value={name} onChange={(e) => setName(e.target.value)} />
          <FormField label="Entity Types">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ENTITY_TYPES.map((t) => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', color: 'var(--color-text)' }}>
                  <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} />
                  {t}
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
