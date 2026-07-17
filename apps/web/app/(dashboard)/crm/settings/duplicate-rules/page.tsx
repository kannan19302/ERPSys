'use client';
import styles from './page.module.css';
import React, { useEffect, useState } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent, ListPageTemplate, type ListColumn } from '@unerp/ui';
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

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <div className="ui-stack-6">
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
        <div className={styles.style0}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <Card padding="none">
        {rules.length === 0 ? (
          <div className={styles.style1}>
            <Users size={40} className={styles.s2} />
            <p className="text-sm">No duplicate rules configured. Add a rule to enable duplicate detection.</p>
          </div>
        ) : (
          <ListPageTemplate
            columns={[
              { key: 'name', header: 'Name', render: (v) => <span className="font-semibold">{String(v)}</span> },
              { key: 'entity', header: 'Entity', render: (v) => <Badge>{String(v)}</Badge> },
              { key: 'matchFields', header: 'Match Fields', render: (v) => (v as string[]).join(', ') },
              { key: 'threshold', header: 'Threshold', render: (v) => `${Math.round(Number(v) * 100)}%` },
              { key: 'action', header: 'Action', render: (v) => <Badge variant={v === 'BLOCK' ? 'danger' : 'info'}>{String(v)}</Badge> },
              { key: 'active', header: 'Status', render: (v) => <Badge variant={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Badge> },
              { key: 'id', header: 'Actions', render: (v, row) => (
                <div className={styles.style2}>
                  <ProtectedComponent permission="crm.duplicate-rules.update">
                    <button onClick={() => openEdit(row as any)} className={styles.style3} aria-label="Edit"><Edit3 size={16} /></button>
                  </ProtectedComponent>
                  <ProtectedComponent permission="crm.duplicate-rules.delete">
                    <button onClick={() => remove(String(v))} className="ui-btn-icon ui-text-danger" aria-label="Delete"><Trash2 size={16} /></button>
                  </ProtectedComponent>
                </div>
              ) },
            ] as ListColumn[]}
            data={rules as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No rules"
            emptyDescription="No duplicate rules configured."
          />
        )}
      </Card>

      {(creating || editing) && (
        <Modal title={editing ? 'Edit Rule' : 'New Rule'} onClose={closeModal}>
          <form onSubmit={save} className="ui-stack-3">
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
              <div className={styles.style4}>
                {ENTITY_FIELDS[form.entity].map((f) => (
                  <label key={f} style={{ background: form.matchFields.includes(f) ? 'var(--color-bg-sunken)' : 'transparent' }} className={styles.s1}>
                    <input type="checkbox" checked={form.matchFields.includes(f)} onChange={() => toggleField(f)} /> {f}
                  </label>
                ))}
              </div>
            </div>
            <div className="ui-grid-2 ui-gap-3">
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
            <label className={styles.style5}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
            </label>
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : (editing ? 'Save' : 'Create')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
