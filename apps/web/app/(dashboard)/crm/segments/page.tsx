'use client';

import React, { useEffect, useState } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent } from '@unerp/ui';
import { Plus, Edit3, Trash2, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Modal, inputStyle, labelStyle } from '../_components/Modal';
import { apiGet, apiSend } from '../_components/api';

type CriteriaOp = 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN';
interface CriteriaRow { field: string; op: CriteriaOp; value: string; }
interface Criteria { logic: 'AND' | 'OR'; rules: CriteriaRow[]; }

interface Segment {
  id: string;
  name: string;
  description?: string | null;
  entity: 'CUSTOMER' | 'LEAD' | 'CONTACT';
  criteria: Criteria;
  memberCount?: number;
  updatedAt?: string;
}

const CUSTOMER_FIELDS = ['status', 'type', 'creditLimit', 'paymentTerms', 'industry', 'annualRevenue', 'country'];
const OPS: CriteriaOp[] = ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'IN'];

const emptyForm = (): Omit<Segment, 'id'> => ({
  name: '', description: '', entity: 'CUSTOMER',
  criteria: { logic: 'AND', rules: [{ field: 'status', op: 'EQUALS', value: 'ACTIVE' }] },
});

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Segment | null>(null);
  const [form, setForm] = useState<Omit<Segment, 'id'>>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Segment[]>('/crm/segments');
      setSegments(Array.isArray(data) ? data : []);
      setError(null);
    } catch { setError('Could not load segments.'); setSegments([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm()); setCreating(true); setEditing(null); };
  const openEdit = (s: Segment) => {
    setForm({ name: s.name, description: s.description ?? '', entity: s.entity, criteria: s.criteria });
    setEditing(s); setCreating(false);
  };
  const closeModal = () => { setCreating(false); setEditing(null); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) await apiSend(`/crm/segments/${editing.id}`, 'PATCH', form);
      else await apiSend('/crm/segments', 'POST', form);
      closeModal();
      await load();
    } catch { setError('Could not save segment.'); } finally { setSubmitting(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this segment?')) return;
    try { await apiSend(`/crm/segments/${id}`, 'DELETE'); await load(); }
    catch { setError('Could not delete segment.'); }
  };

  const addRule = () => setForm((prev) => ({ ...prev, criteria: { ...prev.criteria, rules: [...prev.criteria.rules, { field: 'status', op: 'EQUALS', value: '' }] } }));
  const updateRule = (idx: number, patch: Partial<CriteriaRow>) => setForm((prev) => ({ ...prev, criteria: { ...prev.criteria, rules: prev.criteria.rules.map((r, i) => i === idx ? { ...r, ...patch } : r) } }));
  const removeRule = (idx: number) => setForm((prev) => ({ ...prev, criteria: { ...prev.criteria, rules: prev.criteria.rules.filter((_, i) => i !== idx) } }));

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Customer Segments"
        description="Group customers/leads by attributes to target campaigns."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Segments' }]}
        actions={
          <ProtectedComponent permission="crm.segments.create">
            <Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} /> New Segment</Button>
          </ProtectedComponent>
        }
      />

      {error && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      {segments.length === 0 ? (
        <Card>
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            <Users size={40} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No segments yet. Create a segment to group records for targeted campaigns.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {segments.map((s) => (
            <Card key={s.id} padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                <Link href={`/crm/segments/${s.id}`} style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
                  <div style={{ fontWeight: 'var(--weight-semibold)' }}>{s.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    <Badge>{s.entity}</Badge> · {s.memberCount ?? 0} members
                  </div>
                </Link>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <ProtectedComponent permission="crm.segments.update">
                    <button onClick={() => openEdit(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }} aria-label="Edit"><Edit3 size={16} /></button>
                  </ProtectedComponent>
                  <ProtectedComponent permission="crm.segments.delete">
                    <button onClick={() => remove(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} aria-label="Delete"><Trash2 size={16} /></button>
                  </ProtectedComponent>
                </div>
              </div>
              {s.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{s.description}</p>}
              <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                {s.criteria.rules.length} rule{s.criteria.rules.length === 1 ? '' : 's'} joined by {s.criteria.logic}
              </div>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <Modal title={editing ? 'Edit Segment' : 'New Segment'} onClose={closeModal} maxWidth="640px">
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: '60px' }} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={labelStyle}>Entity</label>
                <select style={inputStyle} value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value as Segment['entity'] })}>
                  <option value="CUSTOMER">Customer</option>
                  <option value="LEAD">Lead</option>
                  <option value="CONTACT">Contact</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Match</label>
                <select style={inputStyle} value={form.criteria.logic} onChange={(e) => setForm({ ...form, criteria: { ...form.criteria, logic: e.target.value as 'AND' | 'OR' } })}>
                  <option value="AND">All rules (AND)</option>
                  <option value="OR">Any rule (OR)</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Criteria</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {form.criteria.rules.map((r, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <select style={inputStyle} value={r.field} onChange={(e) => updateRule(idx, { field: e.target.value })}>
                      {CUSTOMER_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select style={inputStyle} value={r.op} onChange={(e) => updateRule(idx, { op: e.target.value as CriteriaOp })}>
                      {OPS.map((op) => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <input style={inputStyle} value={r.value} placeholder="value" onChange={(e) => updateRule(idx, { value: e.target.value })} />
                    <button type="button" onClick={() => removeRule(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} aria-label="Remove"><Trash2 size={14} /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" type="button" onClick={addRule}><Plus size={12} /> Add Rule</Button>
              </div>
            </div>
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
