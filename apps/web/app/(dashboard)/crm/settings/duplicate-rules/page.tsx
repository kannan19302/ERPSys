'use client';

import React, { useEffect, useState } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent } from '@unerp/ui';
import { Plus, Edit3, Trash2, Users, AlertCircle } from 'lucide-react';
import { Modal, inputStyle, labelStyle } from '../../_components/Modal';
import { apiGet, apiSend } from '../../_components/api';

type Entity = 'LEAD' | 'CONTACT' | 'ACCOUNT' | 'CUSTOMER';
type Action = 'FLAG' | 'BLOCK' | 'MERGE_SUGGEST';

interface Rule {
  id: string;
  name: string;
  entity: Entity;
  matchFields: string[];
  threshold: number; // 0..1
  action: Action;
  active: boolean;
}

const ENTITY_FIELDS: Record<Entity, string[]> = {
  LEAD: ['email', 'phone', 'company', 'firstName', 'lastName'],
  CONTACT: ['email', 'phone', 'firstName', 'lastName'],
  ACCOUNT: ['name', 'website', 'phone'],
  CUSTOMER: ['name', 'email', 'phone', 'taxId'],
};

const emptyRule: Omit<Rule, 'id'> = { name: '', entity: 'LEAD', matchFields: ['email'], threshold: 0.8, action: 'FLAG', active: true };

export default function DuplicateRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Rule, 'id'>>(emptyRule);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Rule[]>('/crm/duplicate-rules');
      setRules(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Could not load duplicate rules.');
      setRules([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyRule); setCreating(true); setEditing(null); };
  const openEdit = (r: Rule) => {
    setForm({ name: r.name, entity: r.entity, matchFields: r.matchFields, threshold: r.threshold, action: r.action, active: r.active });
    setEditing(r); setCreating(false);
  };
  const closeModal = () => { setCreating(false); setEditing(null); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) await apiSend(`/crm/duplicate-rules/${editing.id}`, 'PATCH', form);
      else await apiSend('/crm/duplicate-rules', 'POST', form);
      closeModal();
      await load();
    } catch { setError('Could not save the rule.'); } finally { setSubmitting(false); }
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try { await apiSend(`/crm/duplicate-rules/${id}`, 'DELETE'); await load(); }
    catch { setError('Could not delete the rule.'); }
  };
  const toggleField = (f: string) => {
    setForm((prev) => ({ ...prev, matchFields: prev.matchFields.includes(f) ? prev.matchFields.filter((x) => x !== f) : [...prev.matchFields, f] }));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Duplicate Detection Rules"
        description="Configure how the system identifies potential duplicate records."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'Duplicate Rules' }]}
        actions={
          <ProtectedComponent permission="crm.duplicate-rules.create">
            <Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} /> New Rule</Button>
          </ProtectedComponent>
        }
      />

      {error && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <Card padding="none">
        {rules.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            <Users size={40} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No duplicate rules configured. Add a rule to enable duplicate detection.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Name</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Entity</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Match Fields</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Threshold</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Action</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{r.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge>{r.entity}</Badge></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{r.matchFields.join(', ')}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>{Math.round(r.threshold * 100)}%</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}><Badge variant={r.action === 'BLOCK' ? 'danger' : 'info'}>{r.action}</Badge></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}><Badge variant={r.active ? 'success' : 'default'}>{r.active ? 'Active' : 'Inactive'}</Badge></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <ProtectedComponent permission="crm.duplicate-rules.update">
                      <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1)', color: 'var(--color-primary)' }} aria-label="Edit"><Edit3 size={16} /></button>
                    </ProtectedComponent>
                    <ProtectedComponent permission="crm.duplicate-rules.delete">
                      <button onClick={() => remove(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1)', color: 'var(--color-danger)' }} aria-label="Delete"><Trash2 size={16} /></button>
                    </ProtectedComponent>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {(creating || editing) && (
        <Modal title={editing ? 'Edit Rule' : 'New Rule'} onClose={closeModal}>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={labelStyle}>Rule Name</label>
              <input style={inputStyle} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Entity</label>
              <select style={inputStyle} value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value as Entity, matchFields: [] })}>
                {(Object.keys(ENTITY_FIELDS) as Entity[]).map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Match Fields</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {ENTITY_FIELDS[form.entity].map((f) => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-1) var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', cursor: 'pointer', background: form.matchFields.includes(f) ? 'var(--color-bg-sunken)' : 'transparent' }}>
                    <input type="checkbox" checked={form.matchFields.includes(f)} onChange={() => toggleField(f)} /> {f}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={labelStyle}>Threshold (0-1)</label>
                <input type="number" min={0} max={1} step={0.05} style={inputStyle} value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelStyle}>Action</label>
                <select style={inputStyle} value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value as Action })}>
                  <option value="FLAG">Flag</option>
                  <option value="BLOCK">Block</option>
                  <option value="MERGE_SUGGEST">Suggest Merge</option>
                </select>
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
