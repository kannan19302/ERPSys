'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit2, XCircle, Calendar, Clock, Shield,
  AlertTriangle, X, Check, Loader2,
} from 'lucide-react';

interface Delegation {
  id: string;
  delegator: string;
  delegate: string;
  type: string;
  workflowName?: string;
  reason: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt: string;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#d1fae5', color: '#065f46' },
  EXPIRED: { bg: '#f3f4f6', color: '#6b7280' },
  REVOKED: { bg: '#fee2e2', color: '#991b1b' },
};

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  ALL: { bg: '#dbeafe', color: '#1e40af' },
  APPROVALS: { bg: '#fef3c7', color: '#92400e' },
  SPECIFIC_WORKFLOW: { bg: '#ede9fe', color: '#5b21b6' },
};

const emptyForm = (): Omit<Delegation, 'id' | 'createdAt' | 'status'> => ({
  delegator: '', delegate: '', type: 'ALL', workflowName: '', reason: '', startDate: '', endDate: '',
});

export default function DelegationsPage() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

  const fetchDelegations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/delegations', { headers: authHeaders() });
      if (res.ok) setDelegations(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchDelegations(); }, []);

  const openNew = () => { setForm(emptyForm()); setEditId(null); setModalOpen(true); };

  const openEdit = (d: Delegation) => {
    setForm({
      delegator: d.delegator, delegate: d.delegate, type: d.type,
      workflowName: d.workflowName || '', reason: d.reason,
      startDate: d.startDate?.slice(0, 10) || '', endDate: d.endDate?.slice(0, 10) || '',
    });
    setEditId(d.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { ...form };
      if (body.type !== 'SPECIFIC_WORKFLOW') delete body.workflowName;
      if (!body.endDate) delete body.endDate;
      const url = editId ? `/api/v1/admin/delegations/${editId}` : '/api/v1/admin/delegations';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (res.ok) { setModalOpen(false); fetchDelegations(); }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/delegations/${id}/revoke`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { setRevokeConfirm(null); fetchDelegations(); }
    } catch (e) { console.error(e); }
  };

  const activeDelegations = delegations.filter(d => d.status === 'ACTIVE');

  const badge = (styles: { bg: string; color: string }, text: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' as never,
    background: styles.bg, color: styles.color,
  });

  const card = (s: React.CSSProperties = {}): React.CSSProperties => ({
    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', ...s,
  });

  const btnPrimary: React.CSSProperties = {
    background: 'var(--color-primary)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)',
    fontWeight: 'var(--weight-semibold)' as never, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
    fontSize: 'var(--text-sm)',
  };

  const btnOutline: React.CSSProperties = {
    ...btnPrimary, background: 'transparent', color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
    color: 'var(--color-text)', fontSize: 'var(--text-sm)',
  };

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Users style={{ color: 'var(--color-primary)' }} />
            Delegation & Out-of-Office
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Manage delegation of responsibilities and out-of-office coverage.
          </p>
        </div>
        <button onClick={openNew} style={btnPrimary}>
          <Plus size={14} /> New Delegation
        </button>
      </div>

      {/* Active Delegations Cards */}
      {activeDelegations.length > 0 && (
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)' }}>
            Active Delegations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
            {activeDelegations.map(d => (
              <div key={d.id} style={{ ...card(), borderLeft: '4px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--weight-semibold)' as never, fontSize: 'var(--text-sm)' }}>{d.delegator}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      delegated to <strong>{d.delegate}</strong>
                    </div>
                  </div>
                  <span style={badge(TYPE_STYLES[d.type] ?? TYPE_STYLES.ALL!, '')}>{d.type.replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} />
                  {new Date(d.startDate).toLocaleDateString()} - {d.endDate ? new Date(d.endDate).toLocaleDateString() : 'Indefinite'}
                </div>
                {d.reason && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                    {d.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delegations Table */}
      <div style={{ ...card(), overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Loading...</div>
        ) : delegations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>No delegations found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                {['Delegator', 'Delegate', 'Type', 'Reason', 'Start', 'End', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 'var(--weight-semibold)' as never, color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {delegations.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{d.delegator}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{d.delegate}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                    <span style={badge(TYPE_STYLES[d.type] ?? TYPE_STYLES.ALL!, '')}>{d.type.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reason}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', whiteSpace: 'nowrap' }}>{new Date(d.startDate).toLocaleDateString()}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', whiteSpace: 'nowrap' }}>{d.endDate ? new Date(d.endDate).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                    <span style={badge(STATUS_STYLES[d.status] ?? STATUS_STYLES.EXPIRED!, '')}>{d.status}</span>
                  </td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button onClick={() => openEdit(d)} style={{ ...btnOutline, padding: 'var(--space-1) var(--space-2)' }} title="Edit">
                        <Edit2 size={12} />
                      </button>
                      {d.status === 'ACTIVE' && (
                        revokeConfirm === d.id ? (
                          <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                            <button onClick={() => handleRevoke(d.id)} style={{ ...btnOutline, padding: 'var(--space-1) var(--space-2)', color: '#991b1b', borderColor: '#991b1b' }} title="Confirm revoke">
                              <Check size={12} />
                            </button>
                            <button onClick={() => setRevokeConfirm(null)} style={{ ...btnOutline, padding: 'var(--space-1) var(--space-2)' }} title="Cancel">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setRevokeConfirm(d.id)} style={{ ...btnOutline, padding: 'var(--space-1) var(--space-2)', color: '#991b1b' }} title="Revoke">
                            <XCircle size={12} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)', width: '100%', maxWidth: 520,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>
                {editId ? 'Edit Delegation' : 'New Delegation'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as never, marginBottom: 'var(--space-1)', display: 'block' }}>Delegator</label>
                <input value={form.delegator} onChange={e => setField('delegator', e.target.value)} placeholder="User email or name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as never, marginBottom: 'var(--space-1)', display: 'block' }}>Delegate</label>
                <input value={form.delegate} onChange={e => setField('delegate', e.target.value)} placeholder="User who will take over" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as never, marginBottom: 'var(--space-1)', display: 'block' }}>Type</label>
                <select value={form.type} onChange={e => setField('type', e.target.value)} style={inputStyle}>
                  <option value="ALL">All</option>
                  <option value="APPROVALS">Approvals</option>
                  <option value="SPECIFIC_WORKFLOW">Specific Workflow</option>
                </select>
              </div>
              {form.type === 'SPECIFIC_WORKFLOW' && (
                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as never, marginBottom: 'var(--space-1)', display: 'block' }}>Workflow Name</label>
                  <input value={form.workflowName} onChange={e => setField('workflowName', e.target.value)} placeholder="e.g. Purchase Order Approval" style={inputStyle} />
                </div>
              )}
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as never, marginBottom: 'var(--space-1)', display: 'block' }}>Reason</label>
                <textarea value={form.reason} onChange={e => setField('reason', e.target.value)} placeholder="Reason for delegation" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as never, marginBottom: 'var(--space-1)', display: 'block' }}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as never, marginBottom: 'var(--space-1)', display: 'block' }}>End Date (optional)</label>
                  <input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
              <button onClick={() => setModalOpen(false)} style={btnOutline}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.delegator || !form.delegate || !form.startDate} style={{ ...btnPrimary, opacity: saving || !form.delegator || !form.delegate || !form.startDate ? 0.5 : 1 }}>
                {saving ? <Loader2 size={14} /> : <Check size={14} />}
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
