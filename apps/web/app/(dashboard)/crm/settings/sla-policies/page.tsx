'use client';
import styles from './page.module.css';
import React, { useEffect, useState } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent, ListPageTemplate, type ListColumn } from '@unerp/ui';
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

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <div className="ui-stack-6">
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
        <div className={styles.style0}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <Card padding="none">
        {policies.length === 0 ? (
          <div className={styles.style1}>
            <Clock size={40} className={styles.s1} />
            <p className="text-sm">No SLA policies. Add a policy so cases get response and resolution deadlines.</p>
          </div>
        ) : (
          <ListPageTemplate
            columns={[
              { key: 'name', header: 'Name', render: (v) => <span className="font-semibold">{String(v)}</span> },
              { key: 'entity', header: 'Entity', render: (v) => <Badge>{String(v)}</Badge> },
              { key: 'priority', header: 'Priority', render: (v) => <Badge variant={v === 'URGENT' || v === 'HIGH' ? 'danger' : v === 'MEDIUM' ? 'info' : 'default'}>{String(v)}</Badge> },
              { key: 'firstResponseMins', header: 'First Response', render: (v) => fmt(Number(v)) },
              { key: 'resolutionMins', header: 'Resolution', render: (v) => fmt(Number(v)) },
              { key: 'active', header: 'Status', render: (v) => <Badge variant={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Badge> },
              { key: 'id', header: 'Actions', render: (v, row) => (
                <div className={styles.style2}>
                  <ProtectedComponent permission="crm.sla-policies.update">
                    <button onClick={() => openEdit(row as any)} className={styles.style3} aria-label="Edit"><Edit3 size={16} /></button>
                  </ProtectedComponent>
                  <ProtectedComponent permission="crm.sla-policies.delete">
                    <button onClick={() => remove(String(v))} className="ui-btn-icon ui-text-danger" aria-label="Delete"><Trash2 size={16} /></button>
                  </ProtectedComponent>
                </div>
              ) },
            ] as ListColumn[]}
            data={policies as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No policies"
            emptyDescription="No SLA policies. Add a policy so cases get response and resolution deadlines."
          />
        )}
      </Card>

      {(creating || editing) && (
        <Modal title={editing ? 'Edit Policy' : 'New Policy'} onClose={closeModal}>
          <form onSubmit={save} className="ui-stack-3">
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="ui-grid-2 ui-gap-3">
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
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label style={labelStyle}>First Response (min)</label>
                <input style={inputStyle} type="number" min={1} value={form.firstResponseMins} onChange={(e) => setForm({ ...form, firstResponseMins: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelStyle}>Resolution (min)</label>
                <input style={inputStyle} type="number" min={1} value={form.resolutionMins} onChange={(e) => setForm({ ...form, resolutionMins: Number(e.target.value) })} />
              </div>
            </div>
            <label className={styles.style4}>
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
