'use client';

import React, { useEffect, useState } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent } from '@unerp/ui';
import { Plus, Edit3, Trash2, Clock, AlertCircle } from 'lucide-react';
import { Modal, inputStyle, labelStyle } from '../../_components/Modal';
import { apiGet, apiSend } from '../../_components/api';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Policy {
  id: string;
  name: string;
  entity: 'CASE';
  priority: Priority;
  firstResponseMins: number;
  resolutionMins: number;
  active: boolean;
}

const emptyForm: Omit<Policy, 'id'> = { name: '', entity: 'CASE', priority: 'MEDIUM', firstResponseMins: 60, resolutionMins: 480, active: true };

export default function SlaPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);
  const [form, setForm] = useState<Omit<Policy, 'id'>>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Policy[]>('/crm/sla-policies');
      setPolicies(Array.isArray(data) ? data : []);
      setError(null);
    } catch { setError('Could not load policies.'); setPolicies([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setCreating(true); setEditing(null); };
  const openEdit = (p: Policy) => {
    setForm({ name: p.name, entity: p.entity, priority: p.priority, firstResponseMins: p.firstResponseMins, resolutionMins: p.resolutionMins, active: p.active });
    setEditing(p); setCreating(false);
  };
  const closeModal = () => { setCreating(false); setEditing(null); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) await apiSend(`/crm/sla-policies/${editing.id}`, 'PATCH', form);
      else await apiSend('/crm/sla-policies', 'POST', form);
      closeModal();
      await load();
    } catch { setError('Could not save policy.'); } finally { setSubmitting(false); }
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this policy?')) return;
    try { await apiSend(`/crm/sla-policies/${id}`, 'DELETE'); await load(); }
    catch { setError('Could not delete policy.'); }
  };

  const fmt = (mins: number) => mins >= 60 ? `${Math.round(mins / 60)}h` : `${mins}m`;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="SLA Policies"
        description="Response and resolution deadlines by priority."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'SLA Policies' }]}
        actions={
          <ProtectedComponent permission="crm.sla-policies.create">
            <Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} /> New Policy</Button>
          </ProtectedComponent>
        }
      />

      {error && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <Card padding="none">
        {policies.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            <Clock size={40} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No SLA policies. Add a policy so cases get response and resolution deadlines.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Name</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Entity</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Priority</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>First Response</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Resolution</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{p.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge>{p.entity}</Badge></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Badge variant={p.priority === 'URGENT' || p.priority === 'HIGH' ? 'danger' : p.priority === 'MEDIUM' ? 'info' : 'default'}>{p.priority}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>{fmt(p.firstResponseMins)}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>{fmt(p.resolutionMins)}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}><Badge variant={p.active ? 'success' : 'default'}>{p.active ? 'Active' : 'Inactive'}</Badge></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <ProtectedComponent permission="crm.sla-policies.update">
                      <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }} aria-label="Edit"><Edit3 size={16} /></button>
                    </ProtectedComponent>
                    <ProtectedComponent permission="crm.sla-policies.delete">
                      <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} aria-label="Delete"><Trash2 size={16} /></button>
                    </ProtectedComponent>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {(creating || editing) && (
        <Modal title={editing ? 'Edit Policy' : 'New Policy'} onClose={closeModal}>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={labelStyle}>Entity</label>
                <select style={inputStyle} value={form.entity} disabled>
                  <option value="CASE">CASE</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select style={inputStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={labelStyle}>First Response (min)</label>
                <input style={inputStyle} type="number" min={1} value={form.firstResponseMins} onChange={(e) => setForm({ ...form, firstResponseMins: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelStyle}>Resolution (min)</label>
                <input style={inputStyle} type="number" min={1} value={form.resolutionMins} onChange={(e) => setForm({ ...form, resolutionMins: Number(e.target.value) })} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : (editing ? 'Save' : 'Create')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
