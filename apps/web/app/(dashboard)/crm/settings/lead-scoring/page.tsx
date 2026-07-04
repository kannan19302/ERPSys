'use client';

import React, { useEffect, useState } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent } from '@unerp/ui';
import { Plus, Edit3, Trash2, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { Modal, inputStyle, labelStyle } from '../../_components/Modal';
import { apiGet, apiSend } from '../../_components/api';

interface Rule {
  id: string;
  name: string;
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IS_SET';
  value: string;
  points: number;
  active: boolean;
}

const OPERATORS: Rule['operator'][] = ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'IS_SET'];
const LEAD_FIELDS = ['status', 'source.name', 'industry', 'employeeCount', 'annualRevenue', 'email', 'company', 'title'];

const emptyRule: Omit<Rule, 'id'> = { name: '', field: 'status', operator: 'EQUALS', value: '', points: 10, active: true };

export default function LeadScoringPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Rule, 'id'>>(emptyRule);
  const [submitting, setSubmitting] = useState(false);
  const [recalcing, setRecalcing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Rule[]>('/crm/lead-scoring/rules');
      setRules(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Could not load scoring rules.');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyRule); setCreating(true); setEditing(null); };
  const openEdit = (r: Rule) => {
    setForm({ name: r.name, field: r.field, operator: r.operator, value: r.value, points: r.points, active: r.active });
    setEditing(r);
    setCreating(false);
  };
  const closeModal = () => { setCreating(false); setEditing(null); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await apiSend(`/crm/lead-scoring/rules/${editing.id}`, 'PATCH', form);
      } else {
        await apiSend('/crm/lead-scoring/rules', 'POST', form);
      }
      closeModal();
      await load();
    } catch {
      setError('Could not save the rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await apiSend(`/crm/lead-scoring/rules/${id}`, 'DELETE');
      await load();
    } catch { setError('Could not delete the rule.'); }
  };

  const recalcAll = async () => {
    setRecalcing(true);
    try {
      await apiSend('/crm/lead-scoring/recalculate-all', 'POST');
      setFlash('Recalculation queued for all leads.');
      setTimeout(() => setFlash(null), 3000);
    } catch {
      setError('Could not queue recalculation.');
    } finally {
      setRecalcing(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Lead Scoring Rules"
        description="Automated point rules used to prioritise incoming leads."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'Lead Scoring' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <ProtectedComponent permission="crm.lead-scoring.recalculate">
              <Button variant="outline" size="sm" onClick={recalcAll} disabled={recalcing}>
                <RefreshCw size={14} /> {recalcing ? 'Queuing…' : 'Recalculate All'}
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="crm.lead-scoring.create">
              <Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} /> New Rule</Button>
            </ProtectedComponent>
          </div>
        }
      />

      {flash && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-success-light, #ecfdf5)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{flash}</div>
      )}
      {error && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <Card padding="none">
        {rules.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            <Zap size={40} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No scoring rules configured. Create your first rule to start automatically scoring leads.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Name</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Condition</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Points</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{r.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                    <code style={{ fontSize: 'var(--text-xs)' }}>{r.field}</code> {r.operator} <code style={{ fontSize: 'var(--text-xs)' }}>{r.value || '—'}</code>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-bold)', color: r.points >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {r.points > 0 ? `+${r.points}` : r.points}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                    <Badge variant={r.active ? 'success' : 'default'}>{r.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <ProtectedComponent permission="crm.lead-scoring.update">
                      <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1)', color: 'var(--color-primary)' }} aria-label="Edit"><Edit3 size={16} /></button>
                    </ProtectedComponent>
                    <ProtectedComponent permission="crm.lead-scoring.delete">
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
              <input style={inputStyle} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Enterprise customer" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={labelStyle}>Field</label>
                <select style={inputStyle} value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })}>
                  {LEAD_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Operator</label>
                <select style={inputStyle} value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value as Rule['operator'] })}>
                  {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Value</label>
              <input style={inputStyle} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="e.g. QUALIFIED" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Points</label>
                <input type="number" style={inputStyle} value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
              </label>
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
