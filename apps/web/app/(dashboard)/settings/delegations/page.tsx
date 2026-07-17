'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
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

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: 'var(--color-success-light)', color: 'var(--color-success-text)' },
  EXPIRED: { bg: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)' },
  REVOKED: { bg: 'var(--color-danger-light)', color: 'var(--color-danger-text)' },
};

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  ALL: { bg: 'var(--color-info-light)', color: 'var(--color-info-text)' },
  APPROVALS: { bg: 'var(--color-warning-light)', color: 'var(--color-warning-text)' },
  SPECIFIC_WORKFLOW: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
};

const emptyForm = (): Omit<Delegation, 'id' | 'createdAt' | 'status'> => ({
  delegator: '', delegate: '', type: 'ALL', workflowName: '', reason: '', startDate: '', endDate: '',
});

export default function DelegationsPage() {
  const client = useApiClient();
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
      setDelegations(await client.get<Delegation[]>('/admin/delegations'));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { void fetchDelegations(); }, [client]);

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
      const url = editId ? `/admin/delegations/${editId}` : '/admin/delegations';
      if (editId) await client.patch(url, body); else await client.post(url, body);
      setModalOpen(false); void fetchDelegations();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleRevoke = async (id: string) => {
    try {
      await client.post(`/admin/delegations/${id}/revoke`);
      setRevokeConfirm(null); void fetchDelegations();
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
  background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none',
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
    <div className="ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <Users className="ui-text-primary" />
            Delegation & Out-of-Office
          </h1>
          <p className="ui-text-sm-muted">
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
          <h2 className={styles.p1}>
            Active Delegations
          </h2>
          <div className={styles.p2}>
            {activeDelegations.map(d => (
              <div key={d.id} style={{ ...card() }} className={styles.s1}>
                <div className="ui-flex-between ui-items-start">
                  <div>
                    <div className={styles.p3}>{d.delegator}</div>
                    <div className={styles.p4}>
                      delegated to <strong>{d.delegate}</strong>
                    </div>
                  </div>
                  <span style={badge(TYPE_STYLES[d.type] ?? TYPE_STYLES.ALL!, '')}>{d.type.replace('_', ' ')}</span>
                </div>
                <div className={styles.p5}>
                  <Calendar size={12} />
                  {new Date(d.startDate).toLocaleDateString()} - {d.endDate ? new Date(d.endDate).toLocaleDateString() : 'Indefinite'}
                </div>
                {d.reason && (
                  <div className="ui-text-xs-muted mt-1">
                    {d.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delegations Table */}
      <ListPageTemplate
        columns={[
          { key: 'delegator', header: 'Delegator' },
          { key: 'delegate', header: 'Delegate' },
          { key: 'type', header: 'Type', render: (v) => <span style={badge(TYPE_STYLES[String(v)] ?? TYPE_STYLES.ALL!, '')}>{String(v).replace('_', ' ')}</span> },
          { key: 'reason', header: 'Reason' },
          { key: 'startDate', header: 'Start', render: (v) => new Date(String(v)).toLocaleDateString() },
          { key: 'endDate', header: 'End', render: (v) => v ? new Date(String(v)).toLocaleDateString() : '-' },
          { key: 'status', header: 'Status', render: (v) => <span style={badge(STATUS_STYLES[String(v)] ?? STATUS_STYLES.EXPIRED!, '')}>{String(v)}</span> },
          { key: 'id', header: 'Actions', render: (_, row) => (
            <div className="ui-flex ui-gap-1">
              <button onClick={() => openEdit(row as unknown as Delegation)} style={{ ...btnOutline }} className={styles.s2} title="Edit"><Edit2 size={12} /></button>
              {row.status === 'ACTIVE' && (
                revokeConfirm === String(row.id) ? (
                  <div className={styles.p6}>
                    <button onClick={() => handleRevoke(String(row.id))} style={{ ...btnOutline }} className={styles.s3} title="Confirm"><Check size={12} /></button>
                    <button onClick={() => setRevokeConfirm(null)} style={{ ...btnOutline }} className={styles.s2} title="Cancel"><X size={12} /></button>
                  </div>
                ) : (
                  <button onClick={() => setRevokeConfirm(String(row.id))} style={{ ...btnOutline }} className={styles.s4} title="Revoke"><XCircle size={12} /></button>
                )
              )}
            </div>
          ) },
        ] as ListColumn[]}
        data={delegations as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No delegations found"
        emptyDescription="No approval delegations have been set up."
      />

      {/* Modal */}
      {modalOpen && (
        <div className={styles.s5} onClick={() => setModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} className={styles.s6}>
            <div className="ui-flex-between mb-4">
              <h2 className={styles.p7}>
                {editId ? 'Edit Delegation' : 'New Delegation'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="ui-btn-icon ui-text-muted">
                <X size={20} />
              </button>
            </div>

            <div className="ui-stack-4">
              <div>
                <label className={styles.p8}>Delegator</label>
                <input value={form.delegator} onChange={e => setField('delegator', e.target.value)} placeholder="User email or name" style={inputStyle} />
              </div>
              <div>
                <label className={styles.p9}>Delegate</label>
                <input value={form.delegate} onChange={e => setField('delegate', e.target.value)} placeholder="User who will take over" style={inputStyle} />
              </div>
              <div>
                <label className={styles.p10}>Type</label>
                <select value={form.type} onChange={e => setField('type', e.target.value)} style={inputStyle}>
                  <option value="ALL">All</option>
                  <option value="APPROVALS">Approvals</option>
                  <option value="SPECIFIC_WORKFLOW">Specific Workflow</option>
                </select>
              </div>
              {form.type === 'SPECIFIC_WORKFLOW' && (
                <div>
                  <label className={styles.p11}>Workflow Name</label>
                  <input value={form.workflowName} onChange={e => setField('workflowName', e.target.value)} placeholder="e.g. Purchase Order Approval" style={inputStyle} />
                </div>
              )}
              <div>
                <label className={styles.p12}>Reason</label>
                <textarea value={form.reason} onChange={e => setField('reason', e.target.value)} placeholder="Reason for delegation" rows={3} style={{ ...inputStyle }} className={styles.s7} />
              </div>
              <div className="ui-grid-2 ui-gap-3">
                <div>
                  <label className={styles.p13}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className={styles.p14}>End Date (optional)</label>
                  <input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>

            <div className={styles.p15}>
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
